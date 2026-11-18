import { ParchmentCard, Button } from '@/components/ui'
import type { VerdictResult } from '@/lib/scoring'

interface ReportCardProps {
  result:     VerdictResult
  narration?: string
  onReplay:   () => void
  onHQ:       () => void
}

const CATEGORY_LABELS: Record<string, { label: string; max: number; correct: string }> = {
  culpritAndWhatHappened: {
    label: 'Culprit & What Happened',
    max: 25,
    correct: 'Julian killed Edmund and locked Clara and Lily in the cellar.',
  },
  timeline: {
    label: 'Timeline',
    max: 20,
    correct: 'TL-01 → TL-02 → TL-03 → TL-04 → TL-05 → TL-06 → TL-07',
  },
  evidenceInterpretation: {
    label: 'Evidence Interpretation',
    max: 20,
    correct: 'EV-05, EV-06, EV-07 (culprit); EV-01, EV-07, EV-11 (timeline); EV-08, EV-13 (cover-up)',
  },
  witnessReliability: {
    label: 'Witness Reliability',
    max: 15,
    correct: 'Margaret: Concealing · Dorothea: Lying · Julian: Lying',
  },
  whyCallsContinue: {
    label: 'Why the Calls Continue',
    max: 10,
    correct: "Clara's call for help was never answered.",
  },
  manipulatedEvidence: {
    label: 'Manipulated Evidence',
    max: 10,
    correct: 'EV-X1 — the Disturbed Photograph',
  },
}

export function ReportCard({ result, narration, onReplay, onHQ }: ReportCardProps) {
  const { score, breakdown, rank } = result

  return (
    <ParchmentCard className="p-8 max-w-xl w-full space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="font-cinzel text-xs tracking-widest text-brown uppercase">Case 001 — Closed</p>
        <h2 className="font-cormorant font-bold text-obsidian text-3xl">The House That Calls Back</h2>
        <div className="flex items-center justify-center gap-4 pt-2">
          <span className="font-cormorant font-bold text-obsidian text-5xl">{score}</span>
          <div className="text-left">
            <p className="font-inter text-xs text-brown uppercase tracking-wide">Score</p>
            <p className="font-cormorant font-semibold text-obsidian text-lg">{rank}</p>
          </div>
        </div>
      </div>

      {narration && (
        <p className="font-cormorant text-obsidian text-base leading-relaxed border-t border-brown pt-4">
          {narration}
        </p>
      )}

      {/* Breakdown */}
      <div className="space-y-3 border-t border-brown pt-4">
        {Object.entries(CATEGORY_LABELS).map(([key, { label, max, correct }]) => {
          const earned = breakdown[key as keyof typeof breakdown] ?? 0
          const full   = earned === max
          return (
            <div key={key} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="font-inter text-sm text-obsidian font-medium">{label}</span>
                <span
                  className="font-inter text-sm font-semibold"
                  style={{ color: full ? 'var(--verdigris)' : 'var(--thread)' }}
                >
                  {earned} / {max}
                </span>
              </div>
              {!full && (
                <p className="font-caveat text-xs text-brown leading-relaxed">
                  Correct: {correct}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onReplay} className="flex-1">
          Replay
        </Button>
        <Button variant="primary" onClick={onHQ} className="flex-1">
          Return to HQ
        </Button>
      </div>
    </ParchmentCard>
  )
}
