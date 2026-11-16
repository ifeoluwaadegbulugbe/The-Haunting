'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Lock } from 'lucide-react'
import { WaxSeal } from '@/components/ui'

interface UnlockedSections {
  scene: boolean
  archive: boolean
  witnesses: boolean
  conclusion: boolean
}

interface TopBarProps {
  investigatorName: string
  rankTitle: string
  rankNumber: number
  unlockedSections?: UnlockedSections
}

const NAV_LINKS = [
  { label: 'Cases', href: '/hq', sectionKey: null },
  { label: 'Scene', href: '/case/001/scene', sectionKey: 'scene' as const },
  { label: 'Archive', href: '/case/001/archive', sectionKey: 'archive' as const },
  { label: 'Evidence', href: '/case/001/evidence', sectionKey: null },
  { label: 'Witnesses', href: '/case/001/witnesses/margaret', sectionKey: 'witnesses' as const },
]

export function TopBar({
  investigatorName,
  rankTitle,
  rankNumber,
  unlockedSections,
}: TopBarProps) {
  const pathname = usePathname()

  return (
    <header
      className="fixed top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 border-b border-gold"
      style={{ background: 'var(--burgundy)', height: '56px' }}
    >
      {/* Left — crest + wordmark */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <WaxSeal />
        <span className="font-cinzel text-parchment text-sm tracking-widest uppercase hidden md:inline">
          THE HAUNTING
        </span>
      </div>

      {/* Centre — navigation */}
      <nav aria-label="Main navigation" className="flex items-center gap-0.5">
        {NAV_LINKS.map(({ label, href, sectionKey }) => {
          const active = pathname === href ||
            (href !== '/hq' && pathname.startsWith(href.replace('/margaret', '')))
          const isLocked = sectionKey && unlockedSections
            ? !unlockedSections[sectionKey]
            : false

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'inline-flex items-center gap-1 font-inter text-xs tracking-wider px-2.5 py-1.5 rounded transition-colors',
                active
                  ? 'text-parchment border-b-2 border-gold'
                  : isLocked
                    ? 'text-parchment-dark opacity-50 pointer-events-none'
                    : 'text-parchment-dark hover:text-parchment'
              )}
              aria-disabled={isLocked}
              tabIndex={isLocked ? -1 : undefined}
            >
              {isLocked && <Lock size={10} />}
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Right — investigator */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="font-inter text-parchment text-xs font-medium leading-tight">
          {investigatorName || 'Investigator'}
        </span>
        <span className="font-inter text-parchment-dark text-xs leading-tight">
          Rank {rankNumber} · {rankTitle}
        </span>
      </div>
    </header>
  )
}
