'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { audio } from '@/lib/audio/engine'

// ── Brushing: dust for prints, or rub a pencil over a pressed page ───────

const COLS = 12
const ROWS = 8
export const BRUSH_DONE = 0.6

/**
 * A surface the player brushes with the pointer (or Enter, one row at a time).
 * `reveal` fades in as more of the surface is covered.
 */
export function BrushSurface({
  base, reveal, stroke, label, onDone, aspect = '4 / 3',
}: { base: ReactNode; reveal: ReactNode; stroke: string; label: string; onDone: () => void; aspect?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cells = useRef(new Set<number>())
  const last = useRef<{ x: number; y: number } | null>(null)
  const lastSound = useRef(0)
  const [coverage, setCoverage] = useState(0)
  const [finished, setFinished] = useState(false)
  const row = useRef(0)

  useEffect(() => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    c.width = r.width
    c.height = r.height
  }, [])

  const paint = (x: number, y: number) => {
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    ctx.strokeStyle = stroke
    ctx.lineWidth = Math.max(18, c.width / 14)
    ctx.lineCap = 'round'
    ctx.beginPath()
    const from = last.current ?? { x, y }
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    last.current = { x, y }
    const col = Math.min(COLS - 1, Math.max(0, Math.floor((x / c.width) * COLS)))
    const rw = Math.min(ROWS - 1, Math.max(0, Math.floor((y / c.height) * ROWS)))
    // the brush is wide: mark the neighbours too
    for (const dc of [-1, 0, 1]) for (const dr of [-1, 0, 1]) {
      const cc = col + dc, rr = rw + dr
      if (cc >= 0 && cc < COLS && rr >= 0 && rr < ROWS) cells.current.add(rr * COLS + cc)
    }
    const now = Date.now()
    if (now - lastSound.current > 160) { audio.sfx('page', 0.15); lastSound.current = now }
    const cov = cells.current.size / (COLS * ROWS)
    setCoverage(cov)
    if (cov >= BRUSH_DONE && !finished) {
      setFinished(true)
      audio.sfx('chime', 0.8)
      setTimeout(onDone, 900)
    }
  }

  const at = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const sweepRow = () => {
    const c = canvasRef.current!
    const y = ((row.current % ROWS) + 0.5) * (c.height / ROWS)
    last.current = null
    for (let i = 0; i <= COLS; i++) paint((i / COLS) * c.width, y)
    row.current += 2
    last.current = null
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label}: drag across the surface, or press Enter to work row by row`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sweepRow() } }}
        className="relative w-full max-w-xl mx-auto rounded-sm overflow-hidden select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        style={{ aspectRatio: aspect, cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); last.current = null; paint(at(e).x, at(e).y) }}
        onPointerMove={(e) => { if (e.buttons) paint(at(e).x, at(e).y) }}
        onPointerUp={() => { last.current = null }}
      >
        <div className="absolute inset-0">{base}</div>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ opacity: Math.min(1, coverage / BRUSH_DONE) }}>{reveal}</div>
      </div>
      <div className="max-w-xl mx-auto h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(81,65,61,0.4)' }} aria-hidden="true">
        <div className="h-full transition-all" style={{ width: `${Math.min(100, (coverage / BRUSH_DONE) * 100)}%`, background: 'var(--gold)' }} />
      </div>
    </div>
  )
}

/** Swirled ridges of a fingerprint, drawn. */
export function Fingerprint({ x, y, size, rotate = 0 }: { x: number; y: number; size: number; rotate?: number }) {
  return (
    <svg viewBox="0 0 40 50" className="absolute" style={{ left: `${x}%`, top: `${y}%`, width: `${size}%`, transform: `translate(-50%,-50%) rotate(${rotate}deg)` }} aria-hidden="true">
      {[4, 7, 10, 13, 16, 19].map((r, i) => (
        <ellipse key={i} cx="20" cy="26" rx={r * 0.8} ry={r} fill="none" stroke="rgba(234,223,201,0.85)" strokeWidth="1.1" strokeDasharray={i % 2 ? '6 2' : '9 3'} />
      ))}
    </svg>
  )
}

// ── Jigsaw: swap pieces of the torn photograph back into place ───────────

const START = [4, 0, 5, 2, 1, 3]

export function Jigsaw({ src, onDone }: { src: string; onDone: () => void }) {
  const [order, setOrder] = useState(START)
  const [picked, setPicked] = useState<number | null>(null)
  const solved = order.every((p, i) => p === i)

  useEffect(() => {
    if (!solved) return
    audio.sfx('sting', 0.8)
    const t = setTimeout(onDone, 1200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved])

  const tap = (pos: number) => {
    if (solved) return
    if (picked === null) { audio.sfx('click'); setPicked(pos); return }
    if (picked === pos) { setPicked(null); return }
    const next = [...order]
      ;[next[picked], next[pos]] = [next[pos], next[picked]]
    audio.sfx(next[pos] === pos || next[picked] === picked ? 'pin' : 'page', 0.7)
    setOrder(next)
    setPicked(null)
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="grid grid-cols-3 gap-1 rounded-sm p-1" style={{ background: 'var(--ink)', aspectRatio: '3 / 2' }}>
        {order.map((piece, pos) => (
          <motion.button
            key={piece}
            layout
            onClick={() => tap(pos)}
            aria-label={`Piece ${piece + 1}${picked === pos ? ', picked up' : ''}`}
            aria-pressed={picked === pos}
            className="relative rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: '300% 200%',
              backgroundPosition: `${(piece % 3) * 50}% ${Math.floor(piece / 3) * 100}%`,
              outline: picked === pos ? '2px solid var(--candle)' : undefined,
              filter: solved ? 'none' : 'sepia(0.3)',
            }}
            animate={{ scale: picked === pos ? 0.94 : 1, rotate: solved ? 0 : ((piece * 37) % 5) - 2 }}
          />
        ))}
      </div>
      <p className="font-inter text-sm text-parchment-dark text-center mt-2">{solved ? 'The photograph is whole.' : 'Pick up a piece, then the piece to swap it with.'}</p>
    </div>
  )
}

// ── UV light: sweep the lamp and mark what glows ─────────────────────────

const MARKS = [
  { x: 28, y: 64, rotate: -6 },
  { x: 62, y: 38, rotate: 4 },
  { x: 70, y: 78, rotate: -2 },
]

export function UvSweep({ onDone }: { onDone: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [found, setFound] = useState<number[]>([])

  useEffect(() => {
    if (found.length !== MARKS.length) return
    audio.sfx('sting', 0.8)
    const t = setTimeout(onDone, 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found.length])

  const move = (e: React.PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect()
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }

  return (
    <div className="space-y-2">
      <div
        ref={boxRef}
        onPointerMove={move}
        className="relative w-full max-w-xl mx-auto rounded-sm overflow-hidden"
        style={{ aspectRatio: '3 / 4', maxHeight: '60dvh', background: 'linear-gradient(160deg, var(--parchment-dark), var(--brown))', cursor: 'none' }}
      >
        {/* back of the will: faint typed lines from the front showing through */}
        <div aria-hidden="true" className="absolute inset-[10%] space-y-3 opacity-30">
          {Array.from({ length: 12 }, (_, i) => <div key={i} className="h-1 rounded" style={{ width: `${88 - ((i * 17) % 30)}%`, background: 'var(--obsidian)', transform: 'scaleX(-1)' }} />)}
        </div>
        <div aria-hidden="true" className="absolute inset-0" style={{ background: 'rgba(14,12,16,0.78)' }} />
        {/* the lamp */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle 90px at ${pos.x}% ${pos.y}%, rgba(150,120,240,0.45), rgba(150,120,240,0.12) 60%, transparent 75%)` }}
        />
        {MARKS.map((m, i) => {
          const lit = Math.hypot(pos.x - m.x, (pos.y - m.y) * 0.75) < 16
          const got = found.includes(i)
          return (
            <button
              key={i}
              onClick={() => { if (!got) { audio.sfx('pin', 0.8); setFound((f) => [...f, i]) } }}
              onFocus={() => setPos({ x: m.x, y: m.y })}
              aria-label={got ? `Pencil mark ${i + 1}, marked` : `Pencil mark ${i + 1}`}
              className="absolute font-caveat text-2xl whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={{
                left: `${m.x}%`, top: `${m.y}%`, transform: `translate(-50%,-50%) rotate(${m.rotate}deg)`,
                color: 'rgba(220,210,255,0.95)', textShadow: '0 0 10px rgba(150,120,240,0.9)',
                opacity: got ? 1 : lit ? 0.85 : 0, transition: 'opacity 0.3s',
                outline: got ? '1px dashed var(--parchment-light)' : undefined, padding: '0 6px',
              }}
            >
              E. Ashworth
            </button>
          )
        })}
      </div>
      <p className="font-inter text-sm text-parchment-dark text-center">Marked {found.length} of {MARKS.length}. Click a mark when the lamp shows it.</p>
    </div>
  )
}
