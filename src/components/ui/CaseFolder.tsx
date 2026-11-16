import { ParchmentCard } from './ParchmentCard'
import { Stamp } from './Stamp'
import { ProgressBar } from './ProgressBar'

export interface CaseFolderProps {
  caseNumber: string
  title: string
  teaser: string
  status: 'unresolved' | 'solved'
  progress: number
}

export function CaseFolder({
  caseNumber,
  title,
  teaser,
  status,
  progress,
}: CaseFolderProps) {
  return (
    <ParchmentCard tilt={1} className="p-6 relative overflow-hidden max-w-lg">
      {/* torn-edge effect */}
      <div
        className="absolute top-0 left-0 w-full h-1 opacity-30"
        style={{
          background:
            'repeating-linear-gradient(90deg, var(--parchment) 0, var(--parchment) 6px, transparent 6px, transparent 10px)',
        }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-cinzel text-xs tracking-widest text-brown mb-1">
            {caseNumber}
          </p>
          <h2 className="font-cormorant font-bold text-2xl text-obsidian leading-tight mb-3">
            {title}
          </h2>
          <p className="font-inter text-sm text-brown leading-relaxed mb-4 whitespace-pre-line">
            {teaser}
          </p>
          <ProgressBar
            value={progress}
            label={`Investigation progress — ${progress}%`}
          />
        </div>

        <div className="flex-shrink-0 mt-1">
          <Stamp label={status === 'solved' ? 'SOLVED' : 'UNRESOLVED'} variant={status} />
        </div>
      </div>
    </ParchmentCard>
  )
}
