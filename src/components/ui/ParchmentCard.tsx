import { clsx } from 'clsx'

export interface ParchmentCardProps {
  children: React.ReactNode
  className?: string
  tilt?: number // degrees
}

export function ParchmentCard({
  children,
  className,
  tilt = 0,
}: ParchmentCardProps) {
  return (
    <div
      className={clsx('bg-parchment-dark rounded-sm', className)}
      style={{
        transform: tilt !== 0 ? `rotate(${tilt}deg)` : undefined,
        boxShadow: '0 4px 24px rgba(14,12,16,0.6)',
      }}
    >
      {children}
    </div>
  )
}
