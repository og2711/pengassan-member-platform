'use client'

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { supabase, nameFromEmail } from '@/lib/supabase'

type Message = { role: 'user' | 'assistant'; content: string }

const AVATAR = '/assistant-avatar.png'
const HIDDEN_ON = ['/login', '/admin']
const SUGGESTIONS = [
  'I was given a query by management. What are my options?',
  'My company is declaring redundancies. What am I entitled to?',
  'Can I contest for Branch Chairman?',
]

// Minimal Markdown: **bold**, numbered lists, "-" bullets and paragraphs.
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}

function renderMarkdown(text: string) {
  const blocks: ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  const flush = () => {
    if (!list) return
    const items = list.items.map((it, i) => <li key={i}>{renderInline(it)}</li>)
    blocks.push(
      list.ordered ? (
        <ol key={blocks.length} className="list-decimal pl-5 space-y-1">{items}</ol>
      ) : (
        <ul key={blocks.length} className="list-disc pl-5 space-y-1">{items}</ul>
      )
    )
    list = null
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const ordered = line.match(/^\d+[.)]\s+(.*)/)
    const bullet = line.match(/^[-*•]\s+(.*)/)
    if (ordered || bullet) {
      const isOrdered = !!ordered
      if (!list || list.ordered !== isOrdered) {
        flush()
        list = { ordered: isOrdered, items: [] }
      }
      list.items.push((ordered ?? bullet)![1])
    } else if (line) {
      flush()
      blocks.push(<p key={blocks.length}>{renderInline(line)}</p>)
    } else {
      flush()
    }
  }
  flush()
  return <div className="space-y-2">{blocks}</div>
}

export default function MemberAssistant() {
  const pathname = usePathname()
  const [signedIn, setSignedIn] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apply = (email: string | undefined | null, hasSession: boolean) => {
      setSignedIn(hasSession)
      setFirstName(email ? nameFromEmail(email).split(' ')[0] : '')
    }
    supabase.auth.getSession().then(({ data: { session } }) => apply(session?.user.email, !!session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      apply(session?.user.email, !!session)
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (isOpen) scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen, loading])

  if (!signedIn || HIDDEN_ON.includes(pathname)) return null

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || loading) return
    const next: Message[] = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json().catch(() => ({}))
      const reply = res.ok && data.reply ? data.reply : data.error || 'Something went wrong. Please try again.'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I couldn't reach the assistant service. Please try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 flex flex-col h-[min(600px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] sm:w-[400px] bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-green-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 shrink-0">
                <img src={AVATAR} alt="" className="w-full h-full rounded-full object-cover object-top bg-white border border-green-600" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-green-800" />
              </div>
              <div>
                <h2 className="font-bold text-sm leading-none">The Comrades&rsquo; Assistant</h2>
                <p className="text-[10px] text-green-200 mt-1 uppercase tracking-wider">Constitution &amp; Labour Law</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Close assistant" className="p-1 rounded-lg hover:bg-green-700 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 text-gray-800 text-sm">
            <div className="flex items-start">
              <div className="max-w-[85%] p-3 rounded-2xl bg-white border border-gray-200 shadow-sm">
                Hello{firstName ? ` ${firstName}` : ''}, I can help you understand your options on a personal
                workplace case using the PENGASSAN Constitution (2026) and Nigerian labour law. What&apos;s happening?
              </div>
            </div>

            {messages.length === 0 && (
              <div className="flex flex-col items-start gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-xs text-green-800 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl px-3 py-2 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                    m.role === 'user'
                      ? 'bg-green-700 text-white whitespace-pre-wrap'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {m.role === 'user' ? m.content : renderMarkdown(m.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-white border border-gray-200 shadow-sm flex gap-1" aria-label="Assistant is typing">
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2 items-end">
              <textarea
                rows={1}
                className="flex-1 resize-none max-h-32 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Describe your case…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="bg-green-800 hover:bg-green-700 text-white p-2.5 rounded-xl disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              Guidance only, not legal advice. For serious matters, contact your Branch IRO.
            </p>
          </div>
        </div>
      )}

      {/* Launcher */}
      <div className="flex items-center gap-3">
        {!isOpen && (
          <div className="relative bg-green-800 text-white px-4 py-2 rounded-full shadow-lg hidden sm:block">
            <p
              className="text-base font-black whitespace-nowrap tracking-wide text-white"
              style={{
                WebkitTextStroke: '4px #111',
                paintOrder: 'stroke fill',
                textShadow: '2px 3px 0 #111',
              }}
            >
              Ask me anything
            </p>
            <div className="absolute right-[-7px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[8px] border-l-green-800" />
          </div>
        )}
        <button
          onClick={() => setIsOpen((o) => !o)}
          aria-label={isOpen ? 'Close assistant' : "Open The Comrades' Assistant"}
          className={`rounded-full shadow-2xl border-2 border-white bg-white overflow-hidden flex items-center justify-center transition-all duration-300 active:scale-95 ${
            isOpen ? 'w-12 h-12' : 'w-20 h-20 sm:w-24 sm:h-24'
          }`}
        >
          {isOpen ? (
            <svg className="w-6 h-6 text-green-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          ) : (
            <img src={AVATAR} alt="The Comrades' Assistant" className="w-full h-full object-cover object-top" />
          )}
        </button>
      </div>
    </div>
  )
}
