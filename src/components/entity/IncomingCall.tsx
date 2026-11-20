'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Phone, PhoneOff } from 'lucide-react'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { evaluateCondition } from '@/lib/engine/conditions'
import { audio } from '@/lib/audio/engine'
import {
  INCOMING_CALLS, CALL_ANSWER_ATTENTION, CALL_IGNORE_ATTENTION, CALL_RING_SECONDS,
  type IncomingCallDef,
} from '@/data/case001/calls'

const RING_DELAY_MS = 4000

/**
 * The study extension calls the investigator at fixed moments (truth file §9.10).
 * Answer it, or let it ring. The outcome only nudges the entity's attention.
 */
export function IncomingCall() {
  const hydrated = useHydrated()
  const pathname = usePathname()
  const state = useGameStore((s) => s)
  const resolveCall = useGameStore((s) => s.resolveCall)
  const addAttention = useGameStore((s) => s.addAttention)
  const addEntityMessage = useGameStore((s) => s.addEntityMessage)

  const [ringing, setRinging] = useState<IncomingCallDef | null>(null)
  const [onLine, setOnLine] = useState<IncomingCallDef | null>(null)
  const [left, setLeft] = useState(CALL_RING_SECONDS)
  const resolved = useRef(false)

  const onCase = pathname.startsWith('/case/001/')
  const due = hydrated && onCase && !state.verdict
    ? INCOMING_CALLS.find((c) => !state.calls?.[c.id] && evaluateCondition(c.when, state)) ?? null
    : null

  // A call that becomes due rings after a short pause
  useEffect(() => {
    if (!due || ringing || onLine) return
    const t = setTimeout(() => { resolved.current = false; setLeft(CALL_RING_SECONDS); setRinging(due) }, RING_DELAY_MS)
    return () => clearTimeout(t)
  }, [due, ringing, onLine])

  // Ring, count down, and give up if nobody answers
  useEffect(() => {
    if (!ringing) return
    audio.sfx('phone-ring', 0.7)
    const ring = setInterval(() => audio.sfx('phone-ring', 0.7), 3000)
    const tick = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => { clearInterval(ring); clearInterval(tick) }
  }, [ringing])

  useEffect(() => {
    if (ringing && left <= 0) ignore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, ringing])

  const answer = () => {
    if (!ringing || resolved.current) return
    resolved.current = true
    resolveCall(ringing.id, 'answered')
    addAttention(CALL_ANSWER_ATTENTION)
    audio.sfx('pickup')
    setTimeout(() => audio.sfx('static', 0.6), 250)
    setTimeout(() => audio.sfx('whisper', 0.7), 1200)
    setOnLine(ringing)
    setRinging(null)
  }

  function ignore() {
    if (!ringing || resolved.current) return
    resolved.current = true
    resolveCall(ringing.id, 'ignored')
    addAttention(CALL_IGNORE_ATTENTION)
    addEntityMessage({ id: `${ringing.id}-ignored`, text: ringing.ignoredLine, at: Date.now() })
    audio.sfx('drone', 0.6)
    setRinging(null)
  }

  // The line goes dead after a few seconds
  useEffect(() => {
    if (!onLine) return
    const t = setTimeout(() => { audio.sfx('static', 0.4); setOnLine(null) }, 7000)
    return () => clearTimeout(t)
  }, [onLine])

  return (
    <div className="fixed left-1/2 -translate-x-1/2 w-[min(380px,calc(100vw-2rem))]" style={{ top: 64, zIndex: 44 }}>
      <AnimatePresence>
        {ringing && (
          <motion.div
            key={`ring-${ringing.id}`}
            role="alertdialog"
            aria-label="Incoming call"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1, x: [0, -2, 2, -2, 0] }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ x: { repeat: Infinity, duration: 0.35, repeatDelay: 2.6 }, default: { type: 'spring', stiffness: 300, damping: 24 } }}
            className="rounded-lg p-4 border"
            style={{ background: 'rgba(14,12,16,0.96)', borderColor: 'var(--entity)', boxShadow: '0 0 30px rgba(192,40,61,0.35)' }}
          >
            <div className="flex items-center gap-3">
              <motion.span
                aria-hidden="true"
                animate={{ rotate: [0, -18, 18, -14, 14, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, repeatDelay: 2.4 }}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--entity)' }}
              >
                <Phone size={20} color="var(--parchment-light)" />
              </motion.span>
              <div className="min-w-0">
                <p className="font-inter text-[10px] tracking-[0.25em] text-parchment-dark">INCOMING CALL · 11:13</p>
                <p className="font-inter text-sm font-semibold text-parchment">ASHWORTH H. EXT 2</p>
              </div>
              <span className="ml-auto font-inter text-xs text-parchment-dark tabular-nums" aria-hidden="true">{left}s</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={answer}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded py-2 font-inter text-sm text-parchment-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                style={{ background: 'var(--verdigris)' }}
              >
                <Phone size={14} /> Answer
              </button>
              <button
                onClick={ignore}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded py-2 font-inter text-sm text-parchment border border-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <PhoneOff size={14} /> Let it ring
              </button>
            </div>
          </motion.div>
        )}

        {onLine && (
          <motion.div
            key={`line-${onLine.id}`}
            role="status"
            aria-label="On the line"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(4px)' }}
            className="rounded-lg p-4 border haunt-glitch pointer-events-none"
            style={{ background: 'rgba(14,12,16,0.96)', borderColor: 'var(--entity)' }}
          >
            <p className="font-inter text-[10px] tracking-[0.25em]" style={{ color: 'var(--entity-glow)' }}>ON THE LINE</p>
            <div className="flex items-end gap-[2px] h-6 my-2" aria-hidden="true">
              {Array.from({ length: 40 }, (_, i) => (
                <motion.span
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ background: 'var(--entity-glow)', height: 3 }}
                  animate={{ height: [3, 4 + ((i * 29) % 18), 3] }}
                  transition={{ repeat: Infinity, duration: 0.3 + ((i * 7) % 5) / 10 }}
                />
              ))}
            </div>
            <p className="font-cormorant italic text-parchment text-lg leading-snug">{onLine.heard}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
