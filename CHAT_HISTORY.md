# Chat History

A running log of Claude Code sessions on this project, newest first. Each entry records what was asked, what was done, and anything left open. Claude appends to this file at the end of each task (see CLAUDE.md).

---

## 2026-11-24: Branch v2.1_mobile-view-fix
**Asked:** Create branch `v2.1_mobile-view-fix`.
**Done:** Branch created from `v2.0_AI_Assistant`. Nothing committed; all uncommitted work (installable app and mobile fixes) moved onto it with the switch.

## 2026-11-24: Mobile tab fix; PENGASSAN logo in rights box
**Asked:** Tabs get cut off on phones; replace the Chairman's face in the "Have a question about your rights at work?" box with the PENGASSAN logo.
**Cause:** The tab row was right-aligned with wide padding, so on phones it overflowed to the left, where it can't be scrolled to.
**Done:**
- `components/NavTabs.tsx`: smaller text, padding and overlap on phones; left-aligned on phones; the row scrolls sideways (hidden scrollbar) if it still doesn't fit, and the current tab is scrolled into view.
- `app/events/page.tsx`, `app/officials/page.tsx`, `app/recommendations/page.tsx`: smaller titles and side padding on phones.
- `app/page.tsx`, `components/KanbanBoardClient.tsx`: header logos 48px on phones (64px from tablet up).
- `app/page.tsx`: rights box shows the PENGASSAN logo in a white circle; text now says "Tap the round button at the bottom right" (the floating assistant button itself still uses the Chairman's photo).
- Build passes; not checked on a real phone.

## 2026-11-21: Install button disappeared
**Asked:** The "Install the Mobile App!" button has disappeared.
**Cause:** On computers the button only showed when the browser had fired its one-click install event (`beforeinstallprompt`). Chrome stops firing it once the app is installed or its prompt is dismissed, and the saved event is lost whenever the dev server hot-reloads `InstallPrompt.tsx` (which every edit did).
**Done:** `components/InstallPrompt.tsx`: button now always shows except when running inside the installed app. Where one-click install isn't available on a computer, tapping it opens a pop-up: "Open this site on your phone…", plus how to install on the computer (Chrome/Edge address-bar install icon; Safari on Mac: File → Add to Dock). Phone behaviour unchanged. Build passes; not checked in a browser.
**Note:** The button is only on the Welcome page (`/`), not the other tabs.

## 2026-11-20: Slower pulse, "Install the Mobile App!"
**Asked:** Pulse once every 5 seconds; change label to "Install the Mobile App!".
**Done:** `app/globals.css`: new `animate-ping-slow` (Tailwind theme animation): a 1-second pulse then a 4-second pause, repeating. `components/InstallPrompt.tsx`: uses it instead of `animate-ping`; label and screen-reader label now "Install the Mobile App!". Build passes and the animation is in the built CSS.

## 2026-11-20: "Install the App!" in yellow; PWA explained
**Asked:** Change the button text to "Install the App!" with a yellow background; then asked for more about PWAs.
**Done:** `components/InstallPrompt.tsx`: button is now yellow (`bg-yellow-400`, dark green bold text, lighter yellow on hover) with a matching yellow pulse ring; label "Install the App!" (phones still show the icon only).
**Answer (PWA):** Explained what an installable web app is, how install/updates work, what it can and can't do (no offline mode yet since there's no service worker; iPhone limits; push needs extra work), and how it relates to the future native app.

## 2026-11-20: Install card → pulsing button
**Asked:** Replace the full-width install card with a pulsing button on the right.
**Done:** `components/InstallPrompt.tsx`: `InstallAppCard` replaced by `InstallAppButton`, a white pill with a pulsing ring (`animate-ping`, off for reduced-motion users) on the right of the Welcome page header (`app/page.tsx`). Android with one-tap support: tapping installs. Otherwise (iPhone, other Android browsers) it opens a small pop-up with the home-screen steps; closes on outside tap or Escape. On phones it shows only the download icon so the header fits; "Install app" label from tablet width up. Hidden once installed and on computers without one-tap install. The "don't show again" dismiss was removed. Build passes; not seen in a browser.

## 2026-11-20: Installable app (PWA), step 1
**Asked:** No app stores for now (native app later). Is a download link Android-only?
**Answer:** No. There is no download file; members install from the website on both Android and iPhone. Android (Chrome/Edge/Samsung) can show a one-tap "Install app" button; iPhone has no such button, so members use Safari's Share → Add to Home Screen.
**Done:**
- `app/manifest.ts`: app name "PENGASSAN", green theme, opens full screen at `/`.
- Icons generated from the PENGASSAN logo on a green background: `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png` (Android), `app/apple-icon.png` (iPhone).
- `app/layout.tsx`: theme colour, iPhone home-screen settings, and `InstallPromptListener`.
- `components/InstallPrompt.tsx`: an "Install app" card on the Welcome page. Android gets a one-tap button (or menu instructions); iPhone gets Share → Add to Home Screen steps; hidden once installed, on computers without one-tap install, or after the member dismisses it.
- Production build checked: manifest, icons and tags are served. Not yet tried on a real phone.
**Open:** Must be deployed (HTTPS) before phones offer install. Next steps: phone polish (5 tabs cramped, assistant label hidden on phones), optional push notifications.

## 2026-11-20: Branch and mobile app planning
**Asked:** Create branch `v2.0_AI_Assistant`; then: where to start on a mobile app version?
**Done:** Branch created; all work so far is on it, uncommitted. Open question: whether to commit `Chairman Portrait.png` (source image; the app uses `public/assistant-avatar.png`).
**Answer (mobile):** Recommended starting with a Progressive Web App (installable from the browser to the home screen, same codebase; Next.js has a guide at `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`). Needs a web app manifest, app icons, a service worker if push notifications are wanted, and phone polish (e.g. assistant label hidden on phones, tab bar width). If App Store/Play Store presence is needed later, wrap with Capacitor or build with Expo (React Native) against the same Supabase backend and `/api/assistant`. No manifest or app icons exist yet.
**Open:** User to decide whether store listing / push notifications are needed.

## 2026-11-20: Welcome page and logo links
**Asked:** Add a Welcome page/tab; the two logos at the top left should link to it.
**Done:**
- Welcome page is now the home page (`app/page.tsx`, at `/`): header with the two logos, greeting "Welcome, Comrade <first name>!" (from `profiles.full_name`), short intro to the chapter, quick-link cards to Tracker, Events, Officials (and Recommendations for admins), and a panel pointing to The Comrades' Assistant. Same sign-in check as the other pages.
- Tracker moved from `/` to `/tracker` (`app/tracker/page.tsx`). Login and admin login still go to `/`, so members now land on Welcome.
- `components/NavTabs.tsx`: new first tab "Welcome" (`/`); Tracker tab points to `/tracker`.
- `components/KanbanBoardClient.tsx`: both logos wrapped in a link to `/`.
- Build passes; not checked in a browser.
**Open:**
- Welcome text is a placeholder written by Claude; user may want to supply their own (e.g. Chairman's message, announcements).
- Events, Officials and Recommendations headers have no logos, so there are no logo links on those pages.
- Anyone with an old bookmark to `/` for the tracker now gets the Welcome page.

## 2026-11-20: Rename to "The Comrades' Assistant", label "Ask me anything"
**Asked:** Rename "Member Assistant" to "The Comrades' Assistant"; change "Ask the Chairman!" to "Ask me anything" with white instead of yellow letters.
**Done:** `components/MemberAssistant.tsx`: chat header, button label for screen readers and avatar alt text now say "The Comrades' Assistant"; launcher label is "Ask me anything" in white with the same black cartoon outline. `app/api/assistant/route.ts`: system prompt now introduces the assistant as "The Comrades' Assistant" so its answers match.

## 2026-11-20: "Ask the Chairman!" launcher label
**Asked:** User added the API keys. Change the launcher text "Ask about your case" to "Ask the Chairman!" with cartoon-style outlined letters.
**Done:** `components/MemberAssistant.tsx`: label is now "Ask the Chairman!" in bold yellow letters with a thick black outline (`-webkit-text-stroke` drawn behind the fill via `paint-order`) and a hard offset shadow, on the existing green pill.
**Open:** The label is still hidden on phone-width screens (`hidden sm:block`), as before.

## 2026-11-20: Where to store the Gemini API key
**Asked:** Where should the API key go?
**Answer:** Locally, in `.env.local` as `GEMINI_API_KEY=...` (git-ignored by the `.env*` rule), then restart `npm run dev`. On the live site, add it in the hosting provider's environment variables (Vercel → Settings → Environment Variables) and redeploy. Never prefix it with `NEXT_PUBLIC_`. Note: `.env*` also ignores `.env.local.example`, so that template isn't committed.

## 2026-11-20: Free Gemini vs paid ChatGPT for the assistant
**Asked:** User's Gemini account is free; they have paid ChatGPT. Will free Gemini do for the assistant?
**Answer:** The assistant uses the Gemini API, not the Gemini app. A free API key from Google AI Studio works without a subscription. A ChatGPT subscription doesn't include API access, so it doesn't help. Each question sends the whole knowledge folder (~126 KB, roughly 30k tokens), so free-tier per-minute and daily limits could be reached under real use. Google's free tier may use prompts to improve its products, which matters for members' personal cases. Recommended: test on the free key, then turn on billing before members use it.
**Open:** User still needs to create the key and add `GEMINI_API_KEY`.

## 2026-11-20: Chat history file
**Asked:** Create a claude.md file to save chat history.
**Done:** Created `CHAT_HISTORY.md` (this file) and added instructions to `CLAUDE.md` so it is loaded each session and updated after each task. Back-filled the entries below from earlier session transcripts.

## 2026-11-20: Member rights assistant bubble
**Asked:** Add an assistant bubble that answers questions about members' personal cases, based on the Nigerian labour laws and the PENGASSAN constitution. Answers should take the form "Based on section..., your options are...".
**Done:**
- `components/MemberAssistant.tsx`: floating chat bubble, added to `app/layout.tsx`. Shown on every page once signed in; hidden on login and admin pages.
- `app/api/assistant/route.ts`: checks sign-in, then sends the conversation plus the knowledge files to Gemini (`gemini-3.1-flash-lite-preview`, same setup as the NMDPRA "Furo" assistant). Runs inside Next.js rather than a Supabase edge function.
- `lib/knowledge/`: every `.md`/`.txt` file here is fed to the assistant. Contains `pengassan-constitution.txt` (full 2026 constitution, from the .docx) and `nigerian-labour-laws.md` (Claude's summary of the Labour Act, Trade Unions Act, Trade Disputes Act, NIC jurisdiction, Employee's Compensation Act, Pension Reform Act).
- `public/assistant-avatar.png`: avatar image, resized to 400px.
- `next.config.ts`: makes sure the knowledge files are included in the deployment. `.env.local.example` lists the new settings.
**Open:**
- Needs `GEMINI_API_KEY` in `.env.local` (and Vercel). `GEMINI_MODEL` is optional. Not yet tested with a real answer.
- `nigerian-labour-laws.md` was written from memory, not from the Acts. Check it (e.g. Section 11 notice periods, Section 54 maternity terms), ideally replace with the full text of the Acts.
- Changes are not committed yet.

## 2026-11-19: Adding users
**Asked:** How do I add new users? From Supabase?
**Answer:** Yes, in the Supabase dashboard. Each user needs (1) an auth account (Authentication → Users → Add user, tick "Auto Confirm User") and (2) a row in `profiles` with their UUID and a role (`viewer` or `admin`); login checks `profiles.role` in `app/login/page.tsx`.
**Open:**
- `profiles` is not in `supabase/schema.sql` (created by hand) and there is no trigger to create profile rows automatically.
- RLS policies only check `auth.role() = 'authenticated'`, not the admin role, so a viewer could write via the Supabase API directly. Offered to tighten these; not done yet.

## 2026-11-06: First request for the assistant
**Asked:** Add an AI assistant bubble at the bottom right ("Ask me anything about your rights") powered by the 2026 PENGASSAN constitution. Superseded by the 2026-11-20 session above, which built it.
