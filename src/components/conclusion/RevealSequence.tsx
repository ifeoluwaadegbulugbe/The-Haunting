'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, SkipForward, Check, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { CASE_001 } from '@/data/case001'
import { audio } from '@/lib/audio/engine'
import { ease } from '@/lib/motion'

type Stage = 'fade' | 'note' | 'ringing' | 'voicemail' | 'night' | 'witnesses' | 'entity' | 'cellar'

interface RevealSequenceProps {
  theorySummary?: string
  /** Where the player put each event: slot index -> event id */
  timelinePlacement?: Record<string, string>
  /** How the cellar ending goes, and what the entity remembers (never changes the score) */
  ending?: { kind: 'answered' | 'quiet'; memory: string }
  onComplete: () => void
}

const WITNESS_TRUTH = [
  { id: 'margaret', name: 'Margaret Hale', text: 'At 11:13 her phone rang. She saw Julian\u2019s car in the drive and let it ring. She has never stopped hearing it.' },
  { id: 'dorothea', name: 'Dorothea Pryce', text: 'She left at 16:55 and never came back. Julian\u2019s envelope bought the story that the family drove away before dark.' },
  { id: 'julian', name: 'Julian Ashworth', text: 'He came for a signature. Edmund refused. Julian killed him, locked Clara and Lily in the cellar and flew to Lisbon the next day.' },
]

/** Key evidence for an event: core items first. */
function proofFor(eventId: string) {
  return CASE_001.evidence
    .filter((e) => e.relatedEvents.includes(eventId) && e.relevance !== 'optional' && e.authenticity === 'genuine')
    .sort((a, b) => (a.relevance === 'core' ? -1 : 1) - (b.relevance === 'core' ? -1 : 1))
    .slice(0, 2)
}

export function RevealSequence({ theorySummary, timelinePlacement = {}, ending, onComplete }: RevealSequenceProps) {
  const [stage, setStage] = useState<Stage>('fade')
  const [shown, setShown] = useState(0)
  const [cellarRinging, setCellarRinging] = useState(false)
  const [cellarAnswered, setCellarAnswered] = useState(false)
  const cellarRingRef = useRef(true)
  const voicemailWords = CASE_001.truth.finalVoicemail.split(' ')

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined
    let i: ReturnType<typeof setInterval> | undefined
    setShown(0)
    switch (stage) {
      case 'fade': audio.sfx('whoosh', 0.6); t = setTimeout(() => setStage('note'), 1800); break
      case 'note': t = setTimeout(() => setStage('ringing'), 3800); break
      case 'ringing':
        audio.sfx('phone-ring', 0.9)
        i = setInterval(() => audio.sfx('phone-ring', 0.9), 3000)
        break
      case 'voicemail':
        audio.sfx('pickup'); setTimeout(() => audio.sfx('tape', 0.5), 300)
        i = setInterval(() => setShown((n) => {
          if (n >= voicemailWords.length) { clearInterval(i); t = setTimeout(() => setStage('night'), 2600); return n }
          return n + 1
        }), 230)
        break
      case 'night':
        i = setInterval(() => setShown((n) => {
          if (n >= CASE_001.timeline.length) { clearInterval(i); return n }
          audio.sfx('page', 0.5)
          return n + 1
        }), 1500)
        break
      case 'witnesses':
        i = setInterval(() => setShown((n) => {
          if (n >= WITNESS_TRUTH.length) { clearInterval(i); return n }
          audio.sfx('stamp', 0.5)
          return n + 1
        }), 1800)
        break
      case 'entity': audio.sfx('whisper'); audio.sfx('drone', 0.6); break
      case 'cellar':
        audio.sfx('heartbeat', 0.7)
        // The extension rings one last time
        t = setTimeout(() => { setCellarRinging(true); audio.sfx('phone-ring', 0.9) }, 2600)
        i = setInterval(() => { if (cellarRingRef.current) audio.sfx('phone-ring', 0.9) }, 3200)
        break
    }
    return () => { if (t) clearTimeout(t); if (i) clearInterval(i) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  // Which event did the player put in each position?
  const placedAt = (order: number) => timelinePlacement[String(order - 1)]

  const Next = ({ to, label = 'Continue', ready = true }: { to: Stage; label?: string; ready?: boolean }) => (
    <motion.div animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.4 }}>
      <Button variant="primary" onClick={() => setStage(to)} disabled={!ready}>{label}</Button>
    </motion.div>
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'var(--ink)' }} aria-live="polite">
      <button
        onClick={onComplete}
        className="fixed top-4 right-4 z-10 flex items-center gap-2 font-inter text-xs text-parchment-dark hover:text-parchment px-3 py-2 rounded border border-brown"
      >
        <SkipForward size={14} /> Skip to the report
      </button>

      <AnimatePresence mode="wait">
        {stage === 'fade' && (
          <motion.div key="fade" className="min-h-dvh flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
            <p className="font-cinzel text-parchment-dark text-sm tracking-[0.4em] uppercase">Case 001 — Concluding</p>
          </motion.div>
        )}

        {stage === 'note' && (
          <motion.div key="note" className="min-h-dvh flex items-center justify-center px-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            <p className="font-caveat text-parchment text-2xl leading-relaxed max-w-md text-center">
              {theorySummary ? `"${theorySummary}"` : '"The truth was in the house all along."'}
            </p>
          </motion.div>
        )}

        {stage === 'ringing' && (
          <motion.div key="ringing" className="min-h-dvh flex flex-col items-center justify-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div animate={{ rotate: [-10, 10, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 0.7, repeatDelay: 1.2 }}>
              <Phone size={52} color="var(--entity-glow)" />
            </motion.div>
            <p className="font-cinzel text-lg tracking-[0.4em]" style={{ color: 'var(--entity-glow)' }}>11:13</p>
            <p className="font-inter text-xs text-parchment-dark tracking-widest">ASHWORTH H. EXT 2</p>
            <Button variant="primary" onClick={() => setStage('voicemail')}>Answer</Button>
          </motion.div>
        )}

        {stage === 'voicemail' && (
          <motion.div key="voicemail" className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            <p className="font-inter text-xs text-parchment-dark uppercase tracking-[0.3em]">Clara Ashworth</p>
            <p className="font-caveat text-2xl leading-relaxed max-w-lg" style={{ color: 'var(--entity-glow)', textShadow: '0 0 18px var(--entity)' }}>
              {voicemailWords.slice(0, shown).join(' ')}
            </p>
          </motion.div>
        )}

        {stage === 'night' && (
          <motion.div key="night" className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center">
              <p className="font-cinzel text-xs tracking-[0.35em] text-parchment-dark">WHAT REALLY HAPPENED</p>
              <h2 className="font-cormorant font-bold text-parchment text-3xl">The final night</h2>
            </div>
            <ol className="relative w-full max-w-2xl space-y-3 pl-8">
              <motion.span className="absolute left-3 top-2 w-px" style={{ background: 'var(--gold)' }} initial={{ height: 0 }} animate={{ height: `${(shown / CASE_001.timeline.length) * 100}%` }} transition={{ duration: 1.2, ease: ease.settle }} />
              {CASE_001.timeline.slice(0, shown).map((ev) => {
                const right = placedAt(ev.order) === ev.id
                return (
                  <motion.li key={ev.id} className="relative" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: ease.settle }}>
                    <span className="absolute -left-[26px] top-2 w-3 h-3 rounded-full" style={{ background: 'var(--gold)', boxShadow: '0 0 10px var(--candle)' }} />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-inter text-xs text-gold tracking-wide">{ev.time}</p>
                        <p className="font-cormorant text-parchment text-xl leading-snug">{ev.label}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {proofFor(ev.id).map((e) => (
                            <span key={e.id} className="font-inter text-[11px] px-2 py-0.5 rounded-sm" style={{ background: 'var(--parchment-dark)', color: 'var(--obsidian)' }}>{e.name}</span>
                          ))}
                        </div>
                      </div>
                      <span className="flex items-center gap-1 font-inter text-xs flex-shrink-0 mt-1" style={{ color: right ? 'var(--verdigris)' : 'var(--thread)' }}>
                        {right ? <Check size={14} /> : <X size={14} />}{right ? 'You placed this' : 'You missed this'}
                      </span>
                    </div>
                  </motion.li>
                )
              })}
            </ol>
            <Next to="witnesses" ready={shown >= CASE_001.timeline.length} />
          </motion.div>
        )}

        {stage === 'witnesses' && (
          <motion.div key="witnesses" className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="font-cinzel text-xs tracking-[0.35em] text-parchment-dark">THE WITNESSES, RECONSIDERED</p>
            <div className="grid md:grid-cols-3 gap-5 max-w-4xl">
              {WITNESS_TRUTH.slice(0, shown).map((w) => {
                const portrait = CASE_001.witnesses.find((x) => x.id === w.id)?.portrait
                return (
                  <motion.div key={w.id} className="rounded-sm overflow-hidden" style={{ background: 'linear-gradient(160deg, var(--parchment-light), var(--parchment))', boxShadow: '0 14px 30px rgba(0,0,0,0.6)' }} initial={{ opacity: 0, y: 30, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
                    {portrait && (
                      <div className="relative h-44">
                        <Image src={portrait} alt={w.name} fill className="object-cover object-top" style={{ filter: 'sepia(0.4) contrast(1.05)' }} />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="font-cormorant font-bold text-obsidian text-xl">{w.name}</p>
                      <p className="font-cormorant text-obsidian text-base leading-snug">{w.text}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            <Next to="entity" ready={shown >= WITNESS_TRUTH.length} />
          </motion.div>
        )}

        {stage === 'entity' && (
          <motion.div key="entity" className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }}>
            <p className="font-cinzel text-xs tracking-[0.35em]" style={{ color: 'var(--entity-glow)' }}>THE ONE WHO CALLS</p>
            <motion.p initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 2 }} className="font-cormorant text-parchment text-2xl md:text-3xl max-w-2xl leading-snug">
              {CASE_001.truth.entityIdentity}
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4, duration: 1.2 }} className="font-caveat text-xl" style={{ color: 'var(--entity-glow)' }}>
              You looked. No one ever looks.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4 }}>
              <Button variant="primary" onClick={() => setStage('cellar')}>Go down to the cellar</Button>
            </motion.div>
          </motion.div>
        )}

        {stage === 'cellar' && (
          <motion.div key="cellar" className="fixed inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}>
            <motion.div className="absolute inset-0" initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 7, ease: ease.drift }}>
              <Image src="/assets/ui/cellar-reveal.jpg" alt="The cellar at Ashworth House" fill className="object-cover" />
            </motion.div>
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(14,12,16,0.2), rgba(14,12,16,0.85))' }} />
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-4 text-center px-6">
              <AnimatePresence mode="wait">
                {!cellarAnswered && cellarRinging && (
                  <motion.div key="ring" className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div animate={{ rotate: [-12, 12, -12, 12, 0] }} transition={{ repeat: Infinity, duration: 0.6, repeatDelay: 1.6 }}>
                      <Phone size={40} color="var(--entity-glow)" />
                    </motion.div>
                    <p className="font-cormorant italic text-parchment text-2xl">On the wall, the cellar extension is ringing.</p>
                    <Button variant="primary" onClick={() => { cellarRingRef.current = false; setCellarAnswered(true); audio.sfx('pickup'); setTimeout(() => audio.sfx('whisper', 0.6), 600) }}>
                      Answer the cellar phone
                    </Button>
                  </motion.div>
                )}
                {cellarAnswered && (
                  <motion.div key="answered" className="flex flex-col items-center gap-4 max-w-2xl" initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 1.6 }}>
                    <p className="font-caveat text-3xl leading-snug" style={{ color: 'var(--entity-glow)', textShadow: '0 0 18px var(--entity)' }}>
                      {ending?.memory ?? 'You came all this way.'}
                    </p>
                    <p className="font-cormorant italic text-parchment text-2xl">
                      {ending?.kind === 'answered'
                        ? '\u201cThank you for answering. I can stop now.\u201d The line clicks. For the first time in eighteen years, the house is quiet.'
                        : '\u201cYou came down. That will have to be enough.\u201d The line goes dead. Somewhere above you, very faintly, a phone begins to ring again.'}
                    </p>
                    <Button variant="primary" onClick={() => { audio.sfx('chime', 0.6); onComplete() }}>Leave the cellar</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
