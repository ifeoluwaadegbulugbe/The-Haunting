'use client'

import { Modal, Button } from '@/components/ui'
import type { Evidence } from '@/types'

interface EvidenceDetailModalProps {
  evidence: Evidence | null
  cxConfirmed: string[]
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

export function EvidenceDetailModal({
  evidence,
  cxConfirmed,
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

        <p className="font-inter text-sm text-parchment leading-relaxed">
          {evidence.description}
        </p>

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
