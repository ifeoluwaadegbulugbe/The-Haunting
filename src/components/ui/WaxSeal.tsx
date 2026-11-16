export function WaxSeal() {
  return (
    <svg
      viewBox="0 0 44 44"
      className="w-11 h-11 select-none"
      aria-hidden="true"
    >
      {/* outer circle */}
      <circle cx="22" cy="22" r="20" fill="var(--burgundy)" />
      {/* inner ring */}
      <circle
        cx="22" cy="22" r="17"
        fill="none"
        stroke="var(--parchment-dark)"
        strokeWidth="0.75"
        opacity="0.5"
      />
      {/* monogram */}
      <text
        x="22" y="27"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-cinzel), serif"
        fontWeight="700"
        fontSize="16"
        fill="var(--parchment-light)"
        letterSpacing="1"
      >
        A
      </text>
    </svg>
  )
}
