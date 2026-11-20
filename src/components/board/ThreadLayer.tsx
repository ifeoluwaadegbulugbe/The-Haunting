'use client'

import { motion } from 'framer-motion'

interface Link {
  a: string
  b: string
  verdict: 'valid' | 'invalid' | 'contradiction'
}

interface ThreadLayerProps {
  links: Link[]
  positions: Record<string, { x: number; y: number }>
  pendingFrom?: { id: string; x: number; y: number }
  pendingTo?: { x: number; y: number }
}

const CARD_W = 120

function midPoint(pos: { x: number; y: number }) {
  return { x: pos.x + CARD_W / 2, y: pos.y - 8 } // pin position
}

function sagPath(ax: number, ay: number, bx: number, by: number): string {
  const mx = (ax + bx) / 2
  const my = (ay + by) / 2 + Math.min(30, Math.abs(bx - ax) * 0.15) // the string sags
  return `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`
}

/** Red string between pinned cards. New threads draw themselves across the board. */
export function ThreadLayer({ links, positions, pendingFrom, pendingTo }: ThreadLayerProps) {
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', zIndex: 4 }} aria-hidden="true">
      <defs>
        <filter id="thread-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {links.map((link) => {
        const posA = positions[link.a]
        const posB = positions[link.b]
        if (!posA || !posB || link.verdict === 'invalid') return null
        const a = midPoint(posA)
        const b = midPoint(posB)
        const d = sagPath(a.x, a.y, b.x, b.y)
        const isContradiction = link.verdict === 'contradiction'
        return (
          <g key={`${link.a}-${link.b}`} data-thread={link.verdict}>
            {/* shadow of the string on the cork */}
            <path d={d} fill="none" stroke="rgba(14,12,16,0.45)" strokeWidth={3} transform="translate(2 4)" />
            <motion.path
              d={d}
              fill="none"
              stroke="var(--thread)"
              strokeWidth={isContradiction ? 1.6 : 2.2}
              strokeDasharray={isContradiction ? '5 4' : undefined}
              filter="url(#thread-glow)"
              initial={{ pathLength: 0, opacity: 1 }}
              animate={{ pathLength: 1, opacity: isContradiction ? 0.75 : 0.9 }}
              transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
            />
            {isContradiction && (
              <motion.text
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2 - 8}
                textAnchor="middle"
                fontSize="13"
                fill="var(--thread)"
                fontFamily="var(--font-inter)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                ✗
              </motion.text>
            )}
          </g>
        )
      })}

      {pendingFrom && pendingTo && positions[pendingFrom.id] && (
        <path
          d={sagPath(midPoint(positions[pendingFrom.id]).x, midPoint(positions[pendingFrom.id]).y, pendingTo.x, pendingTo.y)}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          opacity={0.7}
        />
      )}
    </svg>
  )
}
