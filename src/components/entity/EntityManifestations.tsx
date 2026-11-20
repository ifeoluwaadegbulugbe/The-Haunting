'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useFxStore, type Manifestation } from '@/store/fxStore'
import { audio, type SfxName } from '@/lib/audio/engine'
import { prefersReducedMotion } from '@/lib/motion'

type Effect = 'glitch' | 'flicker' | 'shadow' | 'figure' | 'breath'

/**
 * How the entity shows itself for each rule. Presentation only: the rule engine
 * has already decided what happens; this decides how it looks and sounds.
 */
const MANIFEST: Record<string, { effects: Effect[]; sounds: SfxName[]; ms: number }> = {
  'ER-01': { effects: ['flicker'], sounds: ['static'], ms: 1200 },
  'ER-02': { effects: ['glitch', 'flicker'], sounds: ['static', 'whisper'], ms: 1100 },
  'ER-03': { effects: ['shadow'], sounds: ['whisper'], ms: 1800 },
  'ER-04': { effects: ['flicker'], sounds: ['static', 'drone'], ms: 1300 },
  'ER-05': { effects: ['glitch', 'figure'], sounds: ['heartbeat', 'whisper'], ms: 1900 },
  'ER-06': { effects: ['glitch', 'figure'], sounds: ['static', 'drone'], ms: 1900 },
  'ER-06b': { effects: ['glitch'], sounds: ['static'], ms: 1100 },
  'ER-07': { effects: ['breath'], sounds: ['whisper'], ms: 1800 },
  'ER-08': { effects: ['glitch', 'flicker', 'figure'], sounds: ['drone', 'static', 'heartbeat'], ms: 2400 },
}

function Active({ m }: { m: Manifestation }) {
  const clear = useFxStore((s) => s.clearManifestation)
  const cfg = MANIFEST[m.ruleId]

  useEffect(() => {
    if (!cfg) { clear(m.id); return }
    cfg.sounds.forEach((s, i) => setTimeout(() => audio.sfx(s, 0.9), i * 180))
    const reduced = prefersReducedMotion()
    if (cfg.effects.includes('glitch') && !reduced) {
      document.documentElement.classList.add('haunt-glitch')
      setTimeout(() => document.documentElement.classList.remove('haunt-glitch'), 650)
    }
    const t = setTimeout(() => clear(m.id), cfg.ms)
    return () => clearTimeout(t)
  }, [cfg, clear, m.id])

  if (!cfg || prefersReducedMotion()) return null
  return (
    <>
      {cfg.effects.includes('flicker') && (
        <motion.div
          className="absolute inset-0"
          style={{ background: 'var(--ink)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0.1, 0.85, 0, 0.5, 0] }}
          transition={{ duration: cfg.ms / 1000, times: [0, 0.08, 0.16, 0.3, 0.45, 0.6, 1] }}
        />
      )}
      {cfg.effects.includes('shadow') && (
        <motion.div
          className="absolute top-0 h-full w-[45vw]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(14,12,16,0.85) 0%, rgba(14,12,16,0) 70%)',
            filter: 'blur(18px)',
          }}
          initial={{ x: '-50vw', opacity: 0 }}
          animate={{ x: '110vw', opacity: [0, 0.9, 0.9, 0] }}
          transition={{ duration: cfg.ms / 1000, ease: 'easeInOut' }}
        />
      )}
      {cfg.effects.includes('figure') && (
        <motion.svg
          viewBox="0 0 200 520"
          className="absolute bottom-0 right-[8vw] h-[78vh]"
          style={{ filter: 'blur(5px)' }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: [0, 0.55, 0.4, 0.6, 0], scale: [0.97, 1, 1.01, 1.02, 1.04] }}
          transition={{ duration: cfg.ms / 1000, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          {/* a woman's silhouette: head, hair, narrow shoulders, long dress */}
          <ellipse cx="100" cy="70" rx="34" ry="42" fill="var(--ink)" />
          <path d="M66 70 Q60 140 74 170 L126 170 Q140 140 134 70 Z" fill="var(--ink)" />
          <path d="M60 165 Q100 150 140 165 L172 520 L28 520 Z" fill="var(--ink)" />
          <ellipse cx="88" cy="72" rx="3" ry="2" fill="var(--entity-glow)" opacity="0.7" />
          <ellipse cx="112" cy="72" rx="3" ry="2" fill="var(--entity-glow)" opacity="0.7" />
        </motion.svg>
      )}
      {cfg.effects.includes('breath') && (
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(234,223,201,0.18), transparent 65%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: cfg.ms / 1000 }}
        />
      )}
    </>
  )
}

/** Rendered once in the root layout. Never blocks clicks. */
export function EntityManifestations() {
  const list = useFxStore((s) => s.manifestations)
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 48 }} aria-hidden="true">
      <AnimatePresence>
        {list.map((m) => <Active key={m.id} m={m} />)}
      </AnimatePresence>
      {/* Colour-split filter used by the glitch (see .haunt-glitch in globals.css) */}
      <svg width="0" height="0" className="absolute">
        <filter id="haunt-rgb">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx="-6" dy="0" result="r2" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
          <feOffset in="gb" dx="5" dy="1" result="gb2" />
          <feBlend in="r2" in2="gb2" mode="screen" />
        </filter>
      </svg>
    </div>
  )
}
