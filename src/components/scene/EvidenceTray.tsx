'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, FileText, Image, Volume2, Phone, Mail, User, Package } from 'lucide-react'
import { EvidenceDetailModal } from './EvidenceDetailModal'
import type { Evidence } from '@/types'

interface EvidenceTrayProps {
  collectedIds: string[]
  allEvidence: Evidence[]
  confirmedContradictions: string[]
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

export function EvidenceTray({ collectedIds, allEvidence, confirmedContradictions }: EvidenceTrayProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const trayRef = useRef<HTMLDivElement>(null)

  const collected = collectedIds
    .map((id) => allEvidence.find((e) => e.id === id))
    .filter(Boolean) as Evidence[]

  const scroll = (dir: 'left' | 'right') => {
    if (!trayRef.current) return
    trayRef.current.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' })
  }

  if (collected.length === 0) return null

  return (
    <>
      <div
        className="fixed bottom-0 inset-x-0 z-10 flex items-center gap-1 px-2 py-2"
        style={{
          background: 'var(--ink)',
          borderTop: '1px solid var(--gold)',
          minHeight: '64px',
        }}
      >
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll evidence left"
          className="flex-shrink-0 p-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ background: 'none', border: 'none' }}
        >
          <ChevronLeft size={20} color="var(--gold)" />
        </button>

        <div
          ref={trayRef}
          className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {collected.map((ev) => {
            const Icon = KIND_ICONS[ev.kind] ?? FileText
            return (
              <button
                key={ev.id}
                onClick={() => setSelectedEvidence(ev)}
                aria-label={ev.name}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-1.5 rounded cursor-pointer transition-colors"
                style={{
                  minWidth: '80px',
                  minHeight: '44px',
                  background: 'var(--brown)',
                  border: '1px solid var(--gold)',
                  color: 'var(--parchment)',
                }}
              >
                <Icon size={14} color="var(--gold)" />
                <span className="font-inter text-[10px] text-parchment-dark text-center leading-tight max-w-[70px] truncate">
                  {ev.name}
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => scroll('right')}
          aria-label="Scroll evidence right"
          className="flex-shrink-0 p-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ background: 'none', border: 'none' }}
        >
          <ChevronRight size={20} color="var(--gold)" />
        </button>
      </div>

      <EvidenceDetailModal
        evidence={selectedEvidence}
        cxConfirmed={confirmedContradictions}
        onClose={() => setSelectedEvidence(null)}
      />
    </>
  )
}
