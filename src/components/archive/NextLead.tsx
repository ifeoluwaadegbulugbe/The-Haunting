'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Compass, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { selectNextStep, type CaseSection } from '@/store/selectors'
import { CASE_001 } from '@/data/case001'
import { audio } from '@/lib/audio/engine'

const DISMISSED_KEY = 'haunting-next-lead-dismissed'

function sectionOf(pathname: string): CaseSection | null {
  const m = pathname.match(/^\/case\/001\/(scene|archive|witnesses|evidence|conclusion)/)
  return (m?.[1] as CaseSection) ?? null
}

/**
 * Tells the player where to go once the section they are in has nothing left.
 * The step itself comes from the deterministic `selectNextStep` selector.
 */
export function NextLead() {
  const hydrated = useHydrated()
  const pathname = usePathname()
  const router = useRouter()
  const state = useGameStore((s) => s)
  const [dismissed, setDismissed] = useState<string | null>(null)
  // Opened by hand while folded (on the board, or in the section the lead points to)
  const [openHere, setOpenHere] = useState(false)
  useEffect(() => setOpenHere(false), [pathname])

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISSED_KEY))
  }, [])

  const step = hydrated ? selectNextStep(state, CASE_001) : null
  const here = sectionOf(pathname)
  const onBoard = here === 'evidence'
  // Already where the lead points (the board is where the final step happens)
  const sameSection = Boolean(step && (step.section === here || (onBoard && step.section === 'conclusion')))
  const visible = Boolean(step && here)
  const key = step ? `${step.section}|${step.text}` : ''
  // The full card opens by itself only when it points somewhere else, and never on
  // the board, where it would cover the evidence cards
  const folded = onBoard || sameSection
  const collapsed = folded ? !openHere : dismissed === key

  // A soft chime when a new lead appears
  useEffect(() => {
    if (visible && !folded && !collapsed) audio.sfx('chime', 0.5)
  }, [visible, folded, collapsed, step?.section])

  if (!step || !visible) return null

  const collapse = () => {
    if (folded) { setOpenHere(false); return }
    sessionStorage.setItem(DISMISSED_KEY, key); setDismissed(key)
  }
  const expand = () => {
    if (folded) { setOpenHere(true); return }
    sessionStorage.removeItem(DISMISSED_KEY); setDismissed(null)
  }
  const go = () => { audio.sfx('click'); router.push(step.href) }

  return (
    <div className={onBoard ? 'fixed right-4' : 'fixed left-4'} style={{ top: onBoard ? 62 : 64, zIndex: 12 }}>
      <AnimatePresence mode="wait" initial>
        {collapsed ? (
          <motion.button
            key="pill"
            onClick={expand}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-gold font-inter text-sm text-parchment hover:border-parchment-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            style={{ background: 'rgba(14,12,16,0.85)' }}
          >
            <Compass size={14} color="var(--gold)" aria-hidden="true" /> Next lead
          </motion.button>
        ) : (
          <motion.div
            key="card"
            role="status"
            aria-label="Next lead"
            initial={{ opacity: 0, y: -12, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="relative w-[min(320px,calc(100vw-2rem))] rounded-sm p-4 pr-8"
            style={{ background: 'linear-gradient(160deg, var(--parchment-light), var(--parchment-dark))', boxShadow: '0 12px 28px rgba(0,0,0,0.55)' }}
          >
            <button aria-label="Hide the next lead" onClick={collapse} className="absolute top-2 right-2 p-1">
              <X size={14} color="var(--brown)" />
            </button>
            <p className="font-cinzel text-[10px] tracking-[0.25em] text-brown flex items-center gap-1.5">
              <Compass size={12} aria-hidden="true" /> NEXT LEAD
            </p>
            <h3 className="font-cormorant font-bold text-obsidian text-lg leading-tight mt-1">{step.title}</h3>
            <p className="font-inter text-base text-obsidian leading-snug mt-1.5">{step.text}</p>
            {step.section !== here && (
              <Button variant="primary" onClick={go} className="mt-3 px-4 py-1.5">{step.action}</Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
