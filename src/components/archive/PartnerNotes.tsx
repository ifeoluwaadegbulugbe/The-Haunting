'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { evaluateCondition } from '@/lib/engine/conditions'
import { audio } from '@/lib/audio/engine'
import { PARTNER_NOTES, type PartnerNote } from '@/data/case001/story'

const SHOW_MS = 9000

/** Archivist Reed comments on what the investigator finds. Text only, never blocks play. */
export function PartnerNotes() {
  const hydrated = useHydrated()
  const pathname = usePathname()
  const state = useGameStore((s) => s)
  const markPartnerSeen = useGameStore((s) => s.markPartnerSeen)
  const [note, setNote] = useState<PartnerNote | null>(null)

  const onCase = pathname.startsWith('/case/001/') && !pathname.startsWith('/case/001/conclusion') && !pathname.startsWith('/case/001/search')
  const due = hydrated && onCase && !state.verdict && !note
    ? PARTNER_NOTES.find((n) => !(state.partnerSeen ?? []).includes(n.id) && (!n.route || pathname.startsWith(n.route)) && evaluateCondition(n.when, state))
    : undefined

  useEffect(() => {
    if (!due) return
    const t = setTimeout(() => { markPartnerSeen(due.id); setNote(due); audio.sfx('page', 0.5) }, 1800)
    return () => clearTimeout(t)
  }, [due, markPartnerSeen])

  useEffect(() => {
    if (!note) return
    const t = setTimeout(() => setNote(null), SHOW_MS)
    return () => clearTimeout(t)
  }, [note])

  return (
    <div className="fixed left-4 pointer-events-none" style={{ bottom: 96, zIndex: 13 }}>
      <AnimatePresence>
        {note && (
          <motion.div
            key={note.id}
            role="status"
            aria-label="Note from your partner"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pointer-events-auto flex items-start gap-3 w-[min(360px,calc(100vw-2rem))] rounded-sm p-3 pr-8 relative"
            style={{ background: 'rgba(14,12,16,0.94)', border: '1px solid var(--gold)', boxShadow: '0 12px 28px rgba(14,12,16,0.6)' }}
          >
            <span aria-hidden="true" className="w-9 h-9 rounded-full flex items-center justify-center font-cinzel text-sm flex-shrink-0" style={{ background: 'var(--burgundy)', color: 'var(--parchment)', border: '1px solid var(--gold)' }}>R</span>
            <p className="font-inter text-sm text-parchment-dark leading-snug"><span className="text-parchment font-semibold">Archivist Reed: </span>{note.text}</p>
            <button onClick={() => setNote(null)} aria-label="Dismiss the note" className="absolute top-2 right-2 p-1"><X size={14} color="var(--parchment-dark)" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
