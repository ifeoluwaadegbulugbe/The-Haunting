'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { WaxSeal } from '@/components/ui'

interface TopBarProps {
  investigatorName: string
  rankTitle: string
  rankNumber: number
}

const NAV_LINKS = [
  { label: 'Cases', href: '/hq' },
  { label: 'Evidence', href: '/case/001/evidence' },
  { label: 'Archive', href: '/case/001/archive' },
  { label: 'Profile', href: '/profile' },
]

export function TopBar({ investigatorName, rankTitle, rankNumber }: TopBarProps) {
  const pathname = usePathname()

  return (
    <header
      className="fixed top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-3 border-b border-gold"
      style={{ background: 'var(--burgundy)', height: '56px' }}
    >
      {/* Left — crest + wordmark */}
      <div className="flex items-center gap-3">
        <WaxSeal />
        <span className="font-cinzel text-parchment text-base tracking-widest uppercase hidden sm:inline">
          THE HAUNTING
        </span>
      </div>

      {/* Centre — navigation */}
      <nav aria-label="Main navigation" className="flex items-center gap-1">
        {NAV_LINKS.map(({ label, href }) => {
          const active = pathname === href || (href !== '/hq' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'font-inter text-xs tracking-wider px-3 py-1.5 rounded transition-colors',
                active
                  ? 'text-parchment border-b-2 border-gold'
                  : 'text-parchment-dark hover:text-parchment'
              )}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Right — investigator */}
      <div className="flex flex-col items-end">
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
