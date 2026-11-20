import { clsx } from 'clsx'

export interface DeviceFrameProps {
  device: 'mobile' | 'laptop' | 'telco'
  children: React.ReactNode
  className?: string
}

// Scanlines over every old screen
const SCANLINES = (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 glow-flicker"
    style={{ background: 'repeating-linear-gradient(0deg, rgba(234,223,201,0.035) 0 1px, transparent 1px 3px)', mixBlendMode: 'screen' }}
  />
)

export function DeviceFrame({ device, children, className }: DeviceFrameProps) {
  if (device === 'telco') {
    return (
      <div
        className={clsx(
          'border border-gold rounded-sm overflow-hidden',
          className
        )}
        style={{ background: 'var(--ink)' }}
      >
        {/* Ledger header */}
        <div
          className="px-4 py-2 border-b border-gold flex items-center gap-3"
          style={{ background: 'var(--burgundy)' }}
        >
          <span className="font-cinzel text-xs tracking-widest text-parchment uppercase">
            Telephone Company Records
          </span>
        </div>
        <div className="relative p-4">{children}{SCANLINES}</div>
      </div>
    )
  }

  if (device === 'laptop') {
    return (
      <div className={clsx('flex flex-col items-center', className)}>
        {/* Screen */}
        <div
          className="w-full rounded-t-lg overflow-hidden border-2"
          style={{
            borderColor: 'var(--brown)',
            background: 'var(--ink)',
            minHeight: '320px',
          }}
        >
          {/* Menu bar */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 border-b"
            style={{ background: 'var(--brown)', borderColor: 'var(--obsidian)' }}
          >
            {['var(--thread)', 'var(--gold)', 'var(--verdigris)'].map((c, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: c, opacity: 0.7 }}
              />
            ))}
            <span className="font-inter text-xs text-parchment-dark ml-2 opacity-60">
              Clara&apos;s Laptop — 2008
            </span>
          </div>
          <div className="relative p-4 overflow-y-auto max-h-72">{children}{SCANLINES}</div>
        </div>
        {/* Base */}
        <div
          className="w-full h-3 rounded-b-lg"
          style={{ background: 'var(--brown)' }}
        />
        <div
          className="w-3/4 h-1 rounded-b-sm"
          style={{ background: 'var(--obsidian)', borderTop: '1px solid var(--brown)' }}
        />
      </div>
    )
  }

  // mobile
  return (
    <div className={clsx('flex flex-col items-center', className)}>
      <div
        className="rounded-2xl overflow-hidden border-2 w-56"
        style={{ borderColor: 'var(--brown)', background: 'var(--ink)' }}
      >
        {/* Speaker */}
        <div
          className="flex justify-center py-2 border-b"
          style={{ background: 'var(--brown)', borderColor: 'var(--obsidian)' }}
        >
          <div
            className="w-10 h-1.5 rounded-full opacity-50"
            style={{ background: 'var(--obsidian)' }}
          />
        </div>
        {/* Screen */}
        <div className="relative p-3 overflow-y-auto max-h-72">{children}{SCANLINES}</div>
        {/* Home button */}
        <div
          className="flex justify-center py-2 border-t"
          style={{ background: 'var(--brown)', borderColor: 'var(--obsidian)' }}
        >
          <div
            className="w-6 h-6 rounded-full border opacity-60"
            style={{ borderColor: 'var(--parchment-dark)' }}
          />
        </div>
      </div>
    </div>
  )
}
