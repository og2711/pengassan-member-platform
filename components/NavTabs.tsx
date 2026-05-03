'use client'

import { usePathname, useRouter } from 'next/navigation'

const TABS = [
  { label: 'Tracker',         path: '/',                adminOnly: false },
  { label: 'Events',          path: '/events',          adminOnly: false },
  { label: 'Officials',       path: '/officials',       adminOnly: false },
  { label: 'Recommendations', path: '/recommendations', adminOnly: true  },
]

// Parallelogram: both left and right edges are slanted, all corners rounded.
// Viewbox 0-100 wide, 0-38 tall. Slant offset = 14 units (~14% of width).
const SHAPE       = 'M18,0 L96,0 Q100,0 99,5 L88,33 Q86,38 82,38 L4,38 Q0,38 1,33 L11,4 Q14,0 18,0 Z'
// Open path — bottom edge omitted so the active tab merges with the content below
const STROKE_OPEN = 'M4,38 Q0,38 1,33 L11,4 Q14,0 18,0 L96,0 Q100,0 99,5 L88,33 Q86,38 82,38'

export default function NavTabs({ isAdmin }: { isAdmin: boolean }) {
  const router   = useRouter()
  const pathname = usePathname()
  const visible  = TABS.filter((t) => !t.adminOnly || isAdmin)
  const n        = visible.length

  return (
    <div className="flex items-end justify-end px-6 pt-3">
      {visible.map((tab, i) => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            style={{
              // Each tab's left slant tucks behind the tab to its left.
              // 22px ≈ 14% of an average tab width, matching the slant offset.
              marginLeft: i > 0 ? '-22px' : '0',
              // Left tabs sit in front: the left tab's body covers the right tab's left slant.
              // Active tab always pops to the front.
              zIndex: active ? 20 : n - i,
            }}
            className={`group relative px-8 py-2.5 text-sm select-none -mb-px ${
              active
                ? 'text-green-800 font-semibold'
                : 'text-green-300 hover:text-white font-medium'
            }`}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 38"
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
              aria-hidden="true"
            >
              {active ? (
                <>
                  <path d={SHAPE} fill="#F9FAFB" stroke="none" />
                  <path
                    d={STROKE_OPEN}
                    fill="none"
                    stroke="#D1D5DB"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              ) : (
                <path
                  d={SHAPE}
                  stroke="#16A34A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  className="fill-green-700 group-hover:fill-green-600"
                />
              )}
            </svg>
            <span className="relative z-10">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
