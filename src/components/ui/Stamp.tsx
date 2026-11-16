export interface StampProps {
  label: string
  variant: 'unresolved' | 'solved'
}

export function Stamp({ label, variant }: StampProps) {
  const color = variant === 'solved' ? 'var(--verdigris)' : 'var(--thread)'

  return (
    <svg
      viewBox="0 0 140 48"
      className="w-36 h-12 select-none"
      aria-label={label}
      role="img"
    >
      {/* rough border */}
      <rect
        x="2" y="2" width="136" height="44"
        rx="3"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray="4 2"
        opacity="0.85"
      />
      <text
        x="70" y="31"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-cinzel), serif"
        fontWeight="700"
        fontSize="15"
        fill={color}
        letterSpacing="3"
        transform="rotate(-8 70 24)"
        opacity="0.9"
      >
        {label.toUpperCase()}
      </text>
    </svg>
  )
}
