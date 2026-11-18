export interface TrustMeterProps {
  trust: number // 0–100
}

function trustLabel(trust: number): string {
  if (trust >= 67) return 'Open'
  if (trust >= 34) return 'Guarded'
  return 'Low'
}

export function TrustMeter({ trust }: TrustMeterProps) {
  const clamped = Math.min(100, Math.max(0, trust))
  const label = trustLabel(clamped)

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-inter text-xs text-brown uppercase tracking-wide">Trust</span>
        <span className="font-inter text-xs font-medium text-parchment-dark">{label}</span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--ink)' }}
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Trust level: ${label}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${clamped}%`,
            background: 'var(--burgundy)',
          }}
        />
      </div>
    </div>
  )
}
