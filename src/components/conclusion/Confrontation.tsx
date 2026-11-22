'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'framer-motion'
import { Gavel } from 'lucide-react'
import { Button, Stamp } from '@/components/ui'
import { audio } from '@/lib/audio/engine'
import { objectionHolds, trialGrade } from '@/store/story'
import { DEFENCE_POINTS, TRIAL_VERDICT } from '@/data/case001/story'
import { CASE_001 } from '@/data/case001'
import type { Evidence } from '@/types'

/**
 * Julian defends himself point by point; the investigator answers each point with
 * evidence. Decided by the defence table, never by the AI. Never changes the score.
 */
export function Confrontation({ evidenceIds, onDone }: { evidenceIds: string[]; onDone: (mistakes: number) => void }) {
  const [point, setPoint] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [answer, setAnswer] = useState<{ ok: boolean; text: string } | null>(null)
  const [verdict, setVerdict] = useState(false)
  const [scope, animate] = useAnimate()
  const julian = CASE_001.witnesses.find((w) => w.id === 'julian')!
  const p = DEFENCE_POINTS[point]
  const composure = 1 - point / DEFENCE_POINTS.length
  const evidence = evidenceIds
    .map((id) => CASE_001.evidence.find((e) => e.id === id))
    .filter((e): e is Evidence => Boolean(e) && e!.relevance !== 'optional')

  useEffect(() => { audio.sfx('drone', 0.5) }, [])

  const present = (ev: Evidence) => {
    if (answer || verdict) return
    if (objectionHolds(p.id, ev.id)) {
      audio.sfx('stamp', 1)
      setTimeout(() => audio.sfx('sting', 0.8), 180)
      if (scope.current) void animate(scope.current, { x: [0, -14, 12, -8, 5, 0] }, { duration: 0.45 })
      setAnswer({ ok: true, text: p.crack })
    } else {
      audio.sfx('deny', 0.8)
      setMistakes((m) => m + 1)
      setAnswer({ ok: false, text: 'That proves nothing, and you know it.' })
    }
  }

  const advance = () => {
    const ok = answer?.ok
    setAnswer(null)
    if (!ok) return
    if (point + 1 >= DEFENCE_POINTS.length) {
      audio.sfx('heartbeat', 0.8)
      setTimeout(() => audio.sfx('stamp', 1), 1400)
      setVerdict(true)
    } else setPoint(point + 1)
  }

  return (
    <div ref={scope} className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'var(--ink)' }}>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <p className="font-cinzel text-xs tracking-[0.35em] text-parchment-dark text-center">THE CONFRONTATION</p>

        {!verdict ? (
          <>
            <div className="grid md:grid-cols-[220px_1fr] gap-6 items-start">
              <div className="space-y-2">
                <img src={composure < 0.5 ? julian.portrait.replace('.jpg', '-pressured.jpg') : julian.portrait} onError={(e) => { (e.target as HTMLImageElement).src = julian.portrait }} alt={julian.name} className="w-full rounded-sm object-cover object-top" style={{ aspectRatio: '3 / 4', filter: `brightness(${0.6 + composure * 0.4}) contrast(${1.2 - composure * 0.2})` }} />
                <p className="font-inter text-xs text-parchment-dark uppercase tracking-wide">Composure</p>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(81,65,61,0.5)' }}>
                  <motion.div className="h-full" style={{ background: 'var(--entity)' }} animate={{ width: `${composure * 100}%` }} />
                </div>
              </div>
              <div className="space-y-4">
                <p className="font-inter text-sm text-parchment-dark">Point {point + 1} of {DEFENCE_POINTS.length}</p>
                <motion.blockquote key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-cormorant text-3xl text-parchment leading-snug">
                  &ldquo;{p.claim}&rdquo;
                </motion.blockquote>
                <AnimatePresence mode="wait">
                  {answer ? (
                    <motion.div key="answer" role="status" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <motion.div initial={{ scale: 2.4, rotate: -16, opacity: 0 }} animate={{ scale: 1.2, rotate: -6, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 16 }} className="inline-block">
                        <Stamp label={answer.ok ? 'OBJECTION SUSTAINED' : 'OVERRULED'} variant={answer.ok ? 'unresolved' : 'solved'} />
                      </motion.div>
                      <p className="font-cormorant italic text-2xl text-parchment-dark">Julian: &ldquo;{answer.text}&rdquo;</p>
                      <Button variant="primary" onClick={advance}>{answer.ok ? 'Press on' : 'Try again'}</Button>
                    </motion.div>
                  ) : (
                    <motion.p key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-inter text-base text-parchment-dark">
                      Put down the evidence that breaks this.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" aria-label="Your evidence">
              {evidence.map((ev) => (
                <li key={ev.id}>
                  <button
                    onClick={() => present(ev)}
                    disabled={Boolean(answer)}
                    className="w-full h-full text-left rounded-sm p-3 transition-transform hover:-translate-y-1 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    style={{ background: 'linear-gradient(160deg, var(--parchment-light), var(--parchment-dark))', boxShadow: '0 8px 16px rgba(14,12,16,0.5)' }}
                  >
                    <span className="font-cormorant font-semibold text-obsidian text-base leading-tight">{ev.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <motion.div className="text-center space-y-6 py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
            <Gavel size={44} color="var(--gold)" className="mx-auto" aria-hidden="true" />
            <p className="font-cormorant italic text-xl text-parchment-dark">Julian: &ldquo;{CASE_001.witnesses.find((w) => w.id === 'julian')?.facts.find((f) => f.id === 'J6')?.statement}&rdquo;</p>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 1 }} className="font-cormorant text-2xl md:text-3xl text-parchment max-w-3xl mx-auto leading-snug">
              {TRIAL_VERDICT}
            </motion.p>
            <motion.div initial={{ scale: 2.6, rotate: -18, opacity: 0 }} animate={{ scale: 1.5, rotate: -8, opacity: 1 }} transition={{ delay: 2.6, type: 'spring', stiffness: 380, damping: 15 }} className="inline-block">
              <Stamp label="GUILTY" variant="unresolved" />
            </motion.div>
            <p className="font-inter text-sm text-parchment-dark">Your case in court: {trialGrade(mistakes)}{mistakes ? ` (${mistakes} wrong ${mistakes === 1 ? 'answer' : 'answers'})` : ''}</p>
            <Button variant="primary" onClick={() => onDone(mistakes)}>Leave the court</Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
