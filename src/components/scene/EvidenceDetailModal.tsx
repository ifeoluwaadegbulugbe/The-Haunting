'use client'

import { Modal, Button } from '@/components/ui'
import { EvidenceVisual } from './EvidenceVisual'
import type { Evidence } from '@/types'

interface EvidenceDetailModalProps {
  evidence: Evidence | null
  cxConfirmed: string[]
  disturbed?: boolean
  onReverify?: (id: string) => void
  onClose: () => void
}

const KIND_LABELS: Record<string, string> = {
  physical: 'Physical',
  document: 'Document',
  photo: 'Photograph',
  audio: 'Audio Recording',
  message: 'Message',
  email: 'Email',
  callRecord: 'Call Record',
  profile: 'Profile',
  statement: 'Statement',
}

const RELIABILITY_COLORS: Record<string, string> = {
  high: 'var(--verdigris)',
  medium: 'var(--gold)',
  low: 'var(--thread)',
}

// Disturbed text is unreadable but recoverable: letters are masked, never deleted
function garble(text: string): string {
  return text.replace(/[A-Za-z]/g, (c, i: number) => (i % 3 === 0 ? c : '▒'))
}

export function EvidenceDetailModal({
  evidence,
  cxConfirmed,
  disturbed = false,
  onReverify,
  onClose,
}: EvidenceDetailModalProps) {
  if (!evidence) return null

  // Show authenticity only if manipulated AND CX-07 is confirmed
  const revealManipulated =
    evidence.authenticity === 'manipulated' && cxConfirmed.includes('CX-07')

  return (
    <Modal open={!!evidence} onClose={onClose} title={evidence.name}>
      <div className="space-y-4 min-w-64">
        <div className="flex gap-2 flex-wrap">
          <Badge label={KIND_LABELS[evidence.kind] ?? evidence.kind} color="var(--gold)" />
          <Badge
            label={evidence.reliability.toUpperCase()}
            color={RELIABILITY_COLORS[evidence.reliability] ?? 'var(--parchment-dark)'}
          />
          {revealManipulated && (
            <Badge label="MANIPULATED" color="var(--thread)" />
          )}
        </div>

        {!disturbed && (
          <EvidenceVisual
            evidenceId={evidence.id}
            assetPath={evidence.assetPath}
            name={evidence.name}
            compact
          />
        )}

        <p className="font-inter text-sm text-parchment leading-relaxed">
          {disturbed ? garble(evidence.description) : evidence.description}
        </p>

        {disturbed && (
          <div className="space-y-2">
            <p className="font-caveat text-sm text-parchment-dark">
              Something has interfered with this record.
            </p>
            {onReverify && (
              <Button variant="secondary" onClick={() => onReverify(evidence.id)}>
                Re-verify
              </Button>
            )}
          </div>
        )}

        <p className="font-caveat text-xs text-parchment-dark">
          Source: {evidence.source}
        </p>

        <Button variant="ghost" onClick={onClose} className="w-full mt-2">
          Close
        </Button>
      </div>
    </Modal>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="font-inter text-xs px-2 py-0.5 rounded border"
      style={{ color, borderColor: color, background: 'rgba(14,12,16,0.5)' }}
    >
      {label}
    </span>
  )
}
