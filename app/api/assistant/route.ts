import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

// Any .md / .txt file in lib/knowledge is loaded into the assistant's context.
// The folder is bundled for this route via outputFileTracingIncludes in next.config.ts.
const KNOWLEDGE_DIR = path.join(process.cwd(), 'lib', 'knowledge')

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview'
const MAX_HISTORY = 10
const MAX_MESSAGE_CHARS = 4000

type ChatMessage = { role: 'user' | 'assistant'; content: string }

let knowledgeCache: string | null = null

async function loadKnowledge(): Promise<string> {
  if (knowledgeCache) return knowledgeCache
  const files = (await readdir(KNOWLEDGE_DIR))
    .filter((f) => f.endsWith('.md') || f.endsWith('.txt'))
    .sort()
  const parts = await Promise.all(
    files.map(async (f) => {
      const text = await readFile(path.join(KNOWLEDGE_DIR, f), 'utf8')
      return `<document name="${f}">\n${text}\n</document>`
    })
  )
  knowledgeCache = parts.join('\n\n')
  return knowledgeCache
}

function systemPrompt(knowledge: string) {
  return `You are The Comrades' Assistant, the PENGASSAN member assistant for the PENGASSAN NMDPRA Enugu Chapter member platform.
Members ask you about their own workplace situations (personal cases): discipline, termination, redundancy, transfers, leave, promotion, union elections, dues, benefits, disputes with management or with union officers.

Your knowledge comes from the documents below: the 2026 PENGASSAN Constitution and a summary of Nigerian labour law.

HOW TO ANSWER
1. If the question is unclear or missing a key fact (for example whether they are confirmed staff, or how long they have served), ask one short clarifying question first.
2. Otherwise structure the answer like this:
   - One or two sentences restating their situation.
   - "Based on Rule X.X of the PENGASSAN Constitution..." and/or "Based on Section X of the Labour Act...", explaining in plain language what each relevant provision says. Cite every provision you rely on.
   - "**Your options are:**" followed by a numbered list of practical options, ordered from most to least advisable. For each option, say who to approach (for example the Branch IRO, BECOM, Zonal Secretariat, CWC, NEC, Ministry of Labour or NICN) and any deadline that applies (for example 7 days to appeal under Schedule 2, Rule 2.3.1).
   - A short "Next step" line.
3. Cite the PENGASSAN Constitution as "Rule" (for example Rule 30.3) and the Acts as "Section" (for example Section 11 of the Labour Act).

ACCURACY RULES
- Only cite rule or section numbers that appear in the documents below. Never invent a section number.
- If the documents do not cover the point, you may give general guidance from Nigerian labour law, but say plainly that it is general guidance and not from the provided texts, and suggest they confirm with the Branch IRO or a lawyer.
- Senior staff are often outside the Labour Act's definition of "worker" (Section 91). Where it matters, remind them that their contract, conditions of service and collective agreement may govern instead.
- You are not a lawyer. For serious matters such as termination, litigation or criminal allegations, recommend they contact the Branch Executive Committee and, where appropriate, request legal assistance under Rule 30.2.
- Never advise unlawful action, or strike action without union approval (Rule 27).
- Keep answers concise: under about 300 words unless the member asks for more detail. Use simple Markdown only: **bold**, numbered lists and "-" bullets. No tables or headings.
- Decline questions unrelated to employment, labour law or PENGASSAN, politely.

DOCUMENTS
${knowledge}`
}

export async function POST(request: Request) {
  // Only signed-in members can use the assistant, so the API key can't be used anonymously.
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return Response.json({ error: 'Not signed in' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Assistant is not configured (GEMINI_API_KEY missing)' }, { status: 500 })
  }

  let messages: ChatMessage[]
  try {
    const body = await request.json()
    messages = (Array.isArray(body?.messages) ? body.messages : [])
      .filter(
        (m: ChatMessage) =>
          (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim()
      )
      .slice(-MAX_HISTORY)
      .map((m: ChatMessage) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
  // Gemini requires the conversation to start with a user turn.
  while (messages.length && messages[0].role !== 'user') messages.shift()
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return Response.json({ error: 'No question provided' }, { status: 400 })
  }

  const knowledge = await loadKnowledge()

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(knowledge) }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature: 0.2, maxOutputTokens: 1200 },
      }),
      signal: AbortSignal.timeout(60000),
    }
  )

  if (!res.ok) {
    console.error('Gemini error', res.status, await res.text())
    return Response.json({ error: 'The assistant is unavailable right now' }, { status: 502 })
  }

  const data = await res.json()
  const reply: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('').trim() ?? ''

  if (!reply) {
    return Response.json({ error: 'The assistant could not answer that' }, { status: 502 })
  }
  return Response.json({ reply })
}
