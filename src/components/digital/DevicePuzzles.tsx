'use client'
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, ScanSearch } from 'lucide-react'
import { Button } from '@/components/ui'
import { audio } from '@/lib/audio/engine'
import { checkLaptopPassword, laptopHintAt, laptopHintLevel, LAPTOP_HINTS, inCar, onPlate, unzoom, PHOTO_TARGETS } from '@/lib/engine/puzzles'
import type { DigitalRecord } from '@/types'

// ── Clara's laptop: the lock screen ──────────────────────────────────────

export function LaptopLock({ onUnlock, hasDiary = true }: { onUnlock: () => void; hasDiary?: boolean }) {
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(0)
  const [shake, setShake] = useState(0)
  const [opening, setOpening] = useState(false)
  const [asked, setAsked] = useState(0)
  // Hints come from wrong guesses or from asking; whichever has gone further
  const level = Math.max(laptopHintLevel(wrong), asked)
  const hint = laptopHintAt(level, hasDiary)
  const askHint = () => { audio.sfx('page', 0.5); setAsked(Math.min(LAPTOP_HINTS.length, level + 1)) }

  const submit = () => {
    if (!value.trim() || opening) return
    if (checkLaptopPassword(value)) {
      audio.sfx('confirm')
      setTimeout(() => audio.sfx('chime', 0.7), 250)
      setOpening(true)
      setTimeout(onUnlock, 900)
    } else {
      audio.sfx('deny', 0.8)
      setWrong((w) => w + 1)
      setShake((s) => s + 1)
      setValue('')
    }
  }

  return (
    <motion.div
      className="relative flex flex-col items-center gap-4 py-10 px-4 text-center"
      animate={opening ? { opacity: 0, scale: 1.04, filter: 'brightness(2)' } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(165,138,96,0.15)', border: '1px solid var(--gold)' }}>
        <Lock size={26} color="var(--gold)" aria-hidden="true" />
      </div>
      <div>
        <p className="font-inter text-sm text-parchment">Clara Ashworth</p>
        <p className="font-inter text-xs text-parchment-dark">This computer is locked.</p>
      </div>
      <motion.form
        key={shake}
        onSubmit={(e) => { e.preventDefault(); submit() }}
        animate={shake ? { x: [0, -10, 9, -6, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-2 w-full max-w-xs"
      >
        <label htmlFor="laptop-password" className="sr-only">Laptop password</label>
        <input
          id="laptop-password"
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => { setValue(e.target.value); audio.sfx('type', 0.3) }}
          placeholder="Password"
          className="flex-1 rounded px-3 py-2 font-inter text-sm text-parchment bg-transparent border border-brown focus:border-gold outline-none"
        />
        <Button type="submit" variant="secondary" className="text-xs py-1 px-3">Unlock</Button>
      </motion.form>
      {wrong > 0 && (
        <p role="status" className="font-inter text-xs" style={{ color: 'var(--thread)' }}>
          Incorrect password ({wrong} {wrong === 1 ? 'attempt' : 'attempts'}).
        </p>
      )}
      {/* A note stuck to the bezel, the way people really leave passwords */}
      <div
        className="font-caveat text-lg px-3 py-1 rotate-[-3deg] shadow-md"
        style={{ background: 'var(--parchment-light)', color: 'var(--brown)' }}
      >
        new password &mdash; same as I wrote in the diary {'\u2665'}
      </div>
      {hint && <p role="status" className="font-caveat text-lg text-parchment-dark max-w-xs">{hint}</p>}
      {!hint && <p className="font-inter text-xs text-parchment-dark opacity-70 max-w-xs">Someone in the house may have written it down.</p>}
      {level < LAPTOP_HINTS.length && (
        <Button variant="ghost" className="text-xs" onClick={askHint}>
          {level === 0 ? 'Need a hint?' : 'Another hint'}
        </Button>
      )}
    </motion.div>
  )
}

// ── Recovered voicemail: scrub the damaged recording to rebuild it ──────

export function VoicemailRestore({ record, onRestored }: { record: DigitalRecord; onRestored: () => void }) {
  const c = record.content as { from: string; transcript: string; duration: string }
  const words = c.transcript.split(' ')
  const [pos, setPos] = useState(0)
  const [reached, setReached] = useState(0)
  const [done, setDone] = useState(false)
  const lastTick = useRef(0)

  // Words sit along the first 90% of the tape; scrubbing past one recovers it
  const heard = Math.min(words.length, Math.floor((reached / 90) * words.length))

  const scrub = (v: number) => {
    setPos(v)
    const now = Date.now()
    if (now - lastTick.current > 120) { audio.sfx('static', 0.25); lastTick.current = now }
    const next = Math.max(reached, v)
    setReached(next)
    if (next >= 95 && !done) {
      setDone(true)
      audio.sfx('tape', 0.8)
      setTimeout(onRestored, 700)
    }
  }

  return (
    <div className="rounded p-3 border border-dashed mb-3 space-y-3" style={{ borderColor: 'var(--gold)' }}>
      <div className="flex items-center justify-between">
        <span className="font-inter text-xs italic tracking-wider" style={{ color: 'var(--thread)' }}>— DELETED · DAMAGED AUDIO —</span>
        <span className="font-inter text-xs text-parchment-dark">{c.duration}</span>
      </div>
      <p className="font-inter text-xs text-parchment-dark">Voicemail from {c.from}. Drag along the tape to piece the message back together.</p>
      {/* Waveform: damaged until the playhead has passed over it */}
      <div className="relative h-12 flex items-center gap-[2px]" aria-hidden="true">
        {Array.from({ length: 48 }, (_, i) => {
          const at = (i / 48) * 100
          const restored = at <= reached
          const h = 6 + ((i * 37) % 26)
          return (
            <span
              key={i}
              className="flex-1 rounded-sm transition-all duration-300"
              style={{
                height: restored ? h : 3 + ((i * 11) % 6),
                background: restored ? 'var(--candle)' : 'var(--brown)',
                opacity: restored ? 0.95 : 0.6,
              }}
            />
          )
        })}
        <span className="absolute top-0 bottom-0 w-[2px]" style={{ left: `${pos}%`, background: 'var(--parchment-light)' }} />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => scrub(Number(e.target.value))}
        aria-label="Scrub the recording"
        className="w-full accent-[var(--gold)]"
        disabled={done}
      />
      <p className="font-caveat text-lg text-parchment border-l-2 border-gold pl-3 min-h-8">
        {heard === 0
          ? <span className="opacity-60">Only static so far.</span>
          : <>&ldquo;{words.slice(0, heard).join(' ')}{heard === words.length ? '\u201D' : ' \u2026'}</>}
      </p>
      {done && <p role="status" className="font-inter text-xs" style={{ color: 'var(--verdigris)' }}>Message restored.</p>}
    </div>
  )
}

// ── Edmund's photo: enhance the car until the plate can be read ─────────

type Zoom = { level: 0 | 1 | 2; origin: { x: number; y: number } }
const SCALES = [1, 2.4, 5.2]

export function PhotoEnhance({ record, onEnhanced }: { record: DigitalRecord; onEnhanced: () => void }) {
  const c = record.content as { caption: string; assetPath?: string | null }
  const [zoom, setZoom] = useState<Zoom>({ level: 0, origin: { x: 50, y: 50 } })
  const [misses, setMisses] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const enhanceTo = (level: 1 | 2) => {
    audio.sfx('static', 0.5)
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      setZoom({ level, origin: level === 1 ? { x: PHOTO_TARGETS.car.x, y: PHOTO_TARGETS.car.y } : { x: PHOTO_TARGETS.plate.x, y: PHOTO_TARGETS.plate.y } })
      audio.sfx(level === 2 ? 'sting' : 'chime', 0.7)
      if (level === 2) setTimeout(onEnhanced, 1000)
    }, 600)
    setNote(null)
  }

  const onClick = (e: React.MouseEvent) => {
    if (scanning || zoom.level === 2) return
    const r = boxRef.current!.getBoundingClientRect()
    const p = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
    const at = unzoom(p, zoom.origin, SCALES[zoom.level])
    if (zoom.level === 0 && inCar(at.x, at.y)) return enhanceTo(1)
    if (zoom.level === 1 && onPlate(at.x, at.y)) return enhanceTo(2)
    audio.sfx('deny', 0.5)
    setMisses((m) => m + 1)
    setNote(zoom.level === 0 ? 'Nothing useful there.' : 'Too dark to make out. Try the number plate.')
  }

  const stepHint = misses >= 2
    ? zoom.level === 0 ? 'Enhance the car in the drive.' : 'Enhance the number plate under the grille.'
    : null

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-inter text-xs text-parchment-dark">{c.caption}</span>
        <span className="font-inter text-[10px] tracking-[0.2em] text-parchment-dark">ENHANCE ×{SCALES[zoom.level]}</span>
      </div>
      <div
        ref={boxRef}
        role="button"
        tabIndex={0}
        aria-label={zoom.level === 0 ? 'Photograph: click a spot to enhance it' : zoom.level === 1 ? 'Enhanced photograph: click a spot to enhance it further' : 'Fully enhanced photograph'}
        onClick={onClick}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && stepHint) { e.preventDefault(); enhanceTo(zoom.level === 0 ? 1 : 2) } }}
        className="relative w-full aspect-video rounded overflow-hidden cursor-crosshair"
        style={{ border: '1px solid var(--gold)', background: 'var(--ink)' }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ scale: SCALES[zoom.level] }}
          transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          style={{ transformOrigin: `${zoom.origin.x}% ${zoom.origin.y}%` }}
        >
          {c.assetPath && (
            <img
              src={c.assetPath}
              alt={c.caption}
              draggable={false}
              className="w-full h-full object-cover"
              style={{ filter: `blur(${[1.6, 0.9, 0.2][zoom.level]}px) contrast(${[1, 1.15, 1.3][zoom.level]})`, transition: 'filter 0.8s' }}
            />
          )}
          {/* The plate becomes legible only at full enhancement */}
          <span
            className="absolute font-inter font-bold text-obsidian"
            style={{
              left: `${PHOTO_TARGETS.plate.x}%`, top: `${PHOTO_TARGETS.plate.y}%`,
              transform: 'translate(-50%, -50%)', fontSize: 5, letterSpacing: 0.3,
              opacity: zoom.level === 2 ? 0.9 : 0, transition: 'opacity 1s 0.6s',
            }}
          >
            J4 ASH
          </span>
        </motion.div>
        <AnimatePresence>
          {scanning && (
            <motion.div
              className="absolute inset-x-0 h-10 pointer-events-none"
              initial={{ top: '-10%' }}
              animate={{ top: '100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'linear' }}
              style={{ background: 'linear-gradient(180deg, transparent, rgba(232,177,93,0.35), transparent)' }}
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, rgba(14,12,16,0.18) 0 1px, transparent 1px 3px)' }} />
      </div>
      <div className="flex items-center gap-3 min-h-8">
        <ScanSearch size={16} color="var(--gold)" aria-hidden="true" />
        {zoom.level === 2 ? (
          <p role="status" className="font-inter text-sm text-parchment">Registration <strong>J4 ASH</strong>. The car Julian Ashworth drove.</p>
        ) : (
          <p className="font-inter text-xs text-parchment-dark">{note ?? 'The picture is dark and grainy. Click a spot to enhance it.'}</p>
        )}
        {stepHint && zoom.level < 2 && (
          <Button variant="ghost" className="text-xs ml-auto" onClick={() => enhanceTo(zoom.level === 0 ? 1 : 2)}>{stepHint}</Button>
        )}
      </div>
    </div>
  )
}
