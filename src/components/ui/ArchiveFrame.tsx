import { clsx } from 'clsx'

export interface ArchiveFrameProps {
  children: React.ReactNode
  className?: string
}

const CornerMark = ({
  position,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br'
}) => {
  const transforms: Record<string, string> = {
    tl: '',
    tr: 'rotate(90 6 6)',
    br: 'rotate(180 6 6)',
    bl: 'rotate(270 6 6)',
  }
  const posClass: Record<string, string> = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0',
    br: 'bottom-0 right-0',
    bl: 'bottom-0 left-0',
  }
  return (
    <svg
      viewBox="0 0 12 12"
      className={clsx('absolute w-3 h-3', posClass[position])}
      aria-hidden="true"
    >
      <path
        d={`M 0 6 L 0 0 L 6 0`}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.5"
        transform={transforms[position]}
      />
    </svg>
  )
}

export function ArchiveFrame({ children, className }: ArchiveFrameProps) {
  return (
    <div
      className={clsx(
        'relative border border-gold rounded-sm',
        className
      )}
    >
      <CornerMark position="tl" />
      <CornerMark position="tr" />
      <CornerMark position="br" />
      <CornerMark position="bl" />
      {children}
    </div>
  )
}
