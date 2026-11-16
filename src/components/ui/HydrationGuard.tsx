'use client'

import { useHydrated } from '@/store/useHydrated'

export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated()

  if (!hydrated) {
    return (
      <div
        className="fixed inset-0 bg-obsidian flex items-center justify-center"
        aria-hidden="true"
      >
        {/* Minimal crest placeholder while store hydrates */}
        <svg viewBox="0 0 44 44" className="w-10 h-10 opacity-30 animate-pulse">
          <circle cx="22" cy="22" r="20" fill="var(--burgundy)" />
          <text
            x="22" y="27"
            textAnchor="middle"
            fontFamily="var(--font-cinzel),serif"
            fontWeight="700"
            fontSize="16"
            fill="var(--parchment-light)"
          >A</text>
        </svg>
      </div>
    )
  }

  return <>{children}</>
}
