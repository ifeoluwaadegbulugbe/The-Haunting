export interface StampProps {
  label: string
  variant: 'unresolved' | 'solved'
}

/** Width that fits the label: about 13 units a letter at this size, never narrower than the original stamp. */
export function stampWidth(label: string): number {
  return Math.max(140, Math.round(label.length * 13.5 + 30))
}

export function Stamp({ label, variant }: StampProps) {
  const color = variant === 'solved' ? 'var(--verdigris)' : 'var(--thread)'
  const w = stampWidth(label)

  return (
    <svg
      viewBox={`0 0 ${w} 48`}
      className="h-12 select-none"
      style={{ width: w * (144 / 140) }}
      aria-label={label}
      role="img"
      overflow="visible"
    >
      {/* rough border */}
      <rect
        x="2" y="2" width={w - 4} height="44"
        rx="3"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray="4 2"
        opacity="0.85"
      />
      <text
        x={w / 2} y="31"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-cinzel), serif"
        fontWeight="700"
        fontSize="15"
        fill={color}
        letterSpacing="3"
        transform={`rotate(-${w > 160 ? 4 : 8} ${w / 2} 24)`}
        opacity="0.9"
      >
        {label.toUpperCase()}
      </text>
    </svg>
  )
}
