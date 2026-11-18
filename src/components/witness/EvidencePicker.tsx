'use client'

import { FileText, Image, Volume2, Phone, Mail, User, Package } from 'lucide-react'
import { Modal } from '@/components/ui'
import type { Evidence } from '@/types'

interface EvidencePickerProps {
  open: boolean
  collectedIds: string[]
  allEvidence: Evidence[]
  onSelect: (evidence: Evidence) => void
  onClose: () => void
}

const KIND_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  physical:   Package,
  document:   FileText,
  photo:      Image,
  audio:      Volume2,
  callRecord: Phone,
  email:      Mail,
  profile:    User,
  message:    Mail,
  statement:  FileText,
}

export function EvidencePicker({
  open,
  collectedIds,
  allEvidence,
  onSelect,
  onClose,
}: EvidencePickerProps) {
  const collected = collectedIds
    .map((id) => allEvidence.find((e) => e.id === id))
    .filter(Boolean) as Evidence[]

  return (
    <Modal open={open} onClose={onClose} title="Present Evidence">
      <div className="space-y-1 max-h-72 overflow-y-auto min-w-64">
        {collected.length === 0 ? (
          <p className="font-caveat text-parchment-dark text-sm italic py-2">
            No evidence collected yet.
          </p>
        ) : (
          collected.map((ev) => {
            const Icon = KIND_ICONS[ev.kind] ?? FileText
            return (
              <button
                key={ev.id}
                onClick={() => { onSelect(ev); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors hover:bg-parchment-dark cursor-pointer"
                style={{ background: 'none', border: 'none' }}
              >
                <Icon size={14} color="var(--gold)" />
                <div>
                  <p className="font-inter text-sm text-parchment">{ev.name}</p>
                  <p className="font-inter text-xs text-parchment-dark">{ev.kind}</p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </Modal>
  )
}
