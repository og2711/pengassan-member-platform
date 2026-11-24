'use client'

import { useEffect, useRef, useState } from 'react'

// Chrome, Edge and Samsung Internet on Android fire `beforeinstallprompt` once,
// early in page load. InstallPromptListener (mounted in the root layout) keeps
// the event so InstallAppButton can use it later, whenever it mounts.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

export function InstallPromptListener() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      notify()
    }
    const onInstalled = () => {
      deferredPrompt = null
      notify()
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])
  return null
}

type Platform = 'installed' | 'ios' | 'android' | 'other'

function detectPlatform(): Platform {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (standalone) return 'installed'
  const ua = navigator.userAgent
  // iPadOS reports itself as a Mac, so also check for a touch screen.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

export function InstallAppButton() {
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [canPrompt, setCanPrompt] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sync = () => setCanPrompt(deferredPrompt !== null)
    // Browser-only checks: run after mount so server and client render the same markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(detectPlatform())
    sync()
    listeners.add(sync)
    return () => { listeners.delete(sync) }
  }, [])

  // Close the steps pop-up on outside tap or Escape.
  useEffect(() => {
    if (!showSteps) return
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowSteps(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSteps(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [showSteps])

  const onClick = async () => {
    if (!deferredPrompt) {
      setShowSteps((v) => !v)
      return
    }
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    notify()
    if (outcome === 'accepted') setPlatform('installed')
  }

  if (!platform || platform === 'installed') return null

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={onClick}
        aria-label="Install the Mobile App!"
        aria-expanded={canPrompt ? undefined : showSteps}
        className="relative flex items-center gap-2 bg-yellow-400 text-green-900 font-bold text-sm p-2.5 sm:pl-3 sm:pr-4 sm:py-2 rounded-full shadow-lg hover:bg-yellow-300 transition-colors"
      >
        {/* Pulsing ring */}
        <span aria-hidden="true" className="absolute inset-0 rounded-full bg-yellow-400/70 animate-ping-slow motion-reduce:hidden" />
        <svg className="relative w-5 h-5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>
        <span className="relative whitespace-nowrap hidden sm:inline">Install the Mobile App!</span>
      </button>

      {showSteps && (
        <div className="absolute right-0 top-full mt-3 w-64 bg-white text-gray-700 rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
          <p className="font-semibold text-gray-800 text-sm mb-2">
            {platform === 'other' ? 'Get the mobile app' : 'Add the app to your home screen'}
          </p>
          {platform === 'ios' ? (
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>
                Tap <strong>Share</strong>
                <svg className="inline w-4 h-4 mx-1 -mt-1 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
                in Safari.
              </li>
              <li>Tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong>.</li>
            </ol>
          ) : platform === 'other' ? (
            <div className="text-sm space-y-2">
              <p>Open this site on your phone and tap this button there to install it.</p>
              <p className="text-gray-500">
                To install it on this computer: in Chrome or Edge, click the install icon at the right of the
                address bar; in Safari on a Mac, choose <strong>File → Add to Dock</strong>.
              </p>
            </div>
          ) : (
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Open the browser menu <strong>⋮</strong> (top right).</li>
              <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
