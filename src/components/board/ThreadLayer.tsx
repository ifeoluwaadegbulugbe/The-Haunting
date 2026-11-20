'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion'
import { prefersReducedMotion } from '@/lib/motion'

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
  /** A wrong connection that is falling off the board */
  dropped?: { a: string; b: string; key: number }
}

const CARD_W = 120

function pinOf(pos: { x: number; y: number }) {
  return { x: pos.x + CARD_W / 2, y: pos.y - 8 }
}

/** Resting sag of a string between two pins: longer strings hang lower. */
function restingSag(ax: number, bx: number, ay: number, by: number) {
  return Math.min(34, Math.hypot(bx - ax, by - ay) * 0.12)
}

function sagPath(ax: number, ay: number, bx: number, by: number, sag: number): string {
  const mx = (ax + bx) / 2
  const my = (ay + by) / 2 + sag
  return `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`
}

/** Red string between pinned cards. Drawn strings swing, correct ones twang tight, wrong ones fall. */
export function ThreadLayer({ links, positions, pendingFrom, pendingTo, dropped }: ThreadLayerProps) {
  const reduced = prefersReducedMotion()
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', zIndex: 4, overflow: 'visible' }} aria-hidden="true">
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
        const a = pinOf(posA)
        const b = pinOf(posB)
        const sag = restingSag(a.x, b.x, a.y, b.y)
        const d = sagPath(a.x, a.y, b.x, b.y, sag)
        const isContradiction = link.verdict === 'contradiction'
        // Pulled tight, it overshoots and settles: a twang
        const twang = [
          sagPath(a.x, a.y, b.x, b.y, sag + 22),
          sagPath(a.x, a.y, b.x, b.y, -sag * 0.6),
          sagPath(a.x, a.y, b.x, b.y, sag * 1.4),
          sagPath(a.x, a.y, b.x, b.y, sag * 0.7),
          d,
        ]
        return (
          <g key={`${link.a}-${link.b}`} data-thread={link.verdict}>
            {/* shadow of the string on the cork */}
            <path d={d} fill="none" stroke="rgba(14,12,16,0.45)" strokeWidth={3} transform="translate(2 4)" />
            <motion.path
              fill="none"
              stroke="var(--thread)"
              strokeWidth={isContradiction ? 1.6 : 2.2}
              strokeDasharray={isContradiction ? '5 4' : undefined}
              filter="url(#thread-glow)"
              initial={{ pathLength: 0, opacity: 1, d: twang[0] }}
              animate={{ pathLength: 1, opacity: isContradiction ? 0.75 : 0.9, d: reduced ? d : twang }}
              transition={{
                pathLength: { duration: 0.7, ease: [0.22, 0.61, 0.36, 1] },
                d: { duration: 0.8, delay: 0.6, ease: 'easeOut' },
              }}
            />
            {isContradiction && (
              <motion.text
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2 + sag / 2 - 8}
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

      {dropped && positions[dropped.a] && positions[dropped.b] && (
        <FallingThread key={dropped.key} a={pinOf(positions[dropped.a])} b={pinOf(positions[dropped.b])} />
      )}

      {pendingFrom && pendingTo && positions[pendingFrom.id] && (
        <SwingingThread from={pinOf(positions[pendingFrom.id])} to={pendingTo} />
      )}
    </svg>
  )
}

/** The string in your hand: its belly lags behind on a spring, so it swings as you move. */
function SwingingThread({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  const ax = useMotionValue(from.x)
  const ay = useMotionValue(from.y)
  const bx = useMotionValue(to.x)
  const by = useMotionValue(to.y)
  const cx = useSpring((from.x + to.x) / 2, { stiffness: 120, damping: 9, mass: 0.6 })
  const cy = useSpring((from.y + to.y) / 2 + 30, { stiffness: 120, damping: 9, mass: 0.6 })

  useEffect(() => {
    ax.set(from.x); ay.set(from.y); bx.set(to.x); by.set(to.y)
    cx.set((from.x + to.x) / 2)
    cy.set((from.y + to.y) / 2 + restingSag(from.x, to.x, from.y, to.y) + 18)
  }, [from.x, from.y, to.x, to.y, ax, ay, bx, by, cx, cy])

  const d = useMotionTemplate`M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`
  return (
    <>
      <motion.path d={d} fill="none" stroke="rgba(14,12,16,0.4)" strokeWidth={3} transform="translate(2 4)" />
      <motion.path d={d} fill="none" stroke="var(--thread)" strokeWidth={2} opacity={0.85} />
      <circle cx={to.x} cy={to.y} r={4} fill="var(--thread)" />
    </>
  )
}

/** A connection that does not hold: the string goes slack and drops off the board. */
function FallingThread({ a, b }: { a: { x: number; y: number }; b: { x: number; y: number } }) {
  const sag = restingSag(a.x, b.x, a.y, b.y)
  return (
    <motion.path
      data-thread="dropped"
      fill="none"
      stroke="var(--thread)"
      strokeWidth={2}
      initial={{ d: sagPath(a.x, a.y, b.x, b.y, sag), opacity: 0.9, y: 0 }}
      animate={{ d: sagPath(a.x, a.y, b.x, b.y, sag + 140), opacity: 0, y: 60 }}
      transition={{ duration: 1.1, ease: 'easeIn' }}
    />
  )
}
