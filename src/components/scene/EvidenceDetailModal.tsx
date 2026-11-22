'use client'
import { useState } from 'react'

import { Modal, Button } from '@/components/ui'
import { EvidenceVisual } from './EvidenceVisual'
import { useGameStore } from '@/store/gameStore'
import { CASE_001 } from '@/data/case001'
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

        {evidence.explanation && <CrossCheck evidence={evidence} />}

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

/**
 * Red herrings can be checked against the evidence that answers them. The player
 * chooses to do it; nothing changes in the case, it only explains the record.
 */
function CrossCheck({ evidence }: { evidence: Evidence }) {
  const collected = useGameStore((s) => s.collectedEvidence)
  const [open, setOpen] = useState(false)
  const held = (evidence.refutedBy ?? []).filter((id) => collected[id])
  const names = held.map((id) => CASE_001.evidence.find((e) => e.id === id)?.name ?? id)
  if (held.length === 0) {
    return <p className="font-inter text-xs text-parchment-dark italic">Something about this does not sit right. You have nothing yet to check it against.</p>
  }
  return open ? (
    <div className="rounded-sm p-3 border-l-2 border-gold" style={{ background: 'rgba(95,127,107,0.12)' }}>
      <p className="font-inter text-xs uppercase tracking-wider text-parchment-dark">Checked against {names.join(' and ')}</p>
      <p className="font-inter text-sm text-parchment leading-relaxed mt-1">{evidence.explanation}</p>
    </div>
  ) : (
    <Button variant="secondary" className="text-xs" onClick={() => setOpen(true)}>
      Cross-check against {names[0]}
    </Button>
  )
}