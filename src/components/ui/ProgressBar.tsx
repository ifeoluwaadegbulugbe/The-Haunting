export interface ProgressBarProps {
  value: number // 0–100
  label?: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className="w-full">
      {label && (
        <span className="block text-xs font-inter text-parchment-dark mb-1">
          {label}
        </span>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className="w-full h-1.5 bg-burgundy rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-gold rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
