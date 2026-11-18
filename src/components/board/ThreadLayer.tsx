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
  const my = (ay + by) / 2 + Math.min(30, Math.abs(bx - ax) * 0.15) // sag
  return `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`
}

export function ThreadLayer({ links, positions, pendingFrom, pendingTo }: ThreadLayerProps) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', zIndex: 4 }}
      aria-hidden="true"
    >
      {links.map((link, i) => {
        const posA = positions[link.a]
        const posB = positions[link.b]
        if (!posA || !posB) return null

        const a = midPoint(posA)
        const b = midPoint(posB)
        const path = sagPath(a.x, a.y, b.x, b.y)

        if (link.verdict === 'invalid') return null // invisible

        const isContradiction = link.verdict === 'contradiction'
        const color = isContradiction ? 'var(--thread)' : 'var(--thread)'
        const opacity = link.verdict === 'valid' ? 0.85 : 0.6

        return (
          <g key={i}>
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={isContradiction ? 1.5 : 2}
              opacity={opacity}
              strokeDasharray={isContradiction ? '4 3' : undefined}
            />
            {isContradiction && (
              <text
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2 - 8}
                textAnchor="middle"
                fontSize="10"
                fill="var(--thread)"
                fontFamily="var(--font-inter)"
              >
                ✗
              </text>
            )}
          </g>
        )
      })}

      {/* Pending thread while dragging */}
      {pendingFrom && pendingTo && positions[pendingFrom.id] && (
        <path
          d={sagPath(
            midPoint(positions[pendingFrom.id]).x,
            midPoint(positions[pendingFrom.id]).y,
            pendingTo.x, pendingTo.y
          )}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          opacity={0.6}
        />
      )}
    </svg>
  )
}
