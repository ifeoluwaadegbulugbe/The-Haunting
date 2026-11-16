'use client'

// Disturbed hotspot ring — uses entity colours (entity directory).
// Rendered by the Hotspot component when state === 'disturbed'.

export function DisturbedRing({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ animation: 'flicker 1.2s ease-in-out infinite' }}
    >
      <circle
        cx="20" cy="20" r="17"
        fill="none"
        stroke="var(--entity-glow)"
        strokeWidth="2.5"
        opacity="0.85"
      />
      <circle
        cx="20" cy="20" r="12"
        fill="rgba(192,40,61,0.12)"
      />
    </svg>
  )
}
