'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, RotateCcw, ZoomIn, ZoomOut, Search } from 'lucide-react'
import { Button } from '@/components/ui'
import { EvidenceVisual, Clipping, RECORDING_LINES } from './EvidenceVisual'
import { audio, type SfxName } from '@/lib/audio/engine'
import { prefersReducedMotion } from '@/lib/motion'
import { useAsset } from '@/lib/useAsset'
import type { Evidence, SceneObject } from '@/types'

function Hero({ src, alt }: { src: string; alt: string }) {
  return (
    <motion.img
      src={src}
      alt={alt}
      draggable={false}
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="block mx-auto max-h-[46dvh] max-w-full rounded-sm object-contain"
      style={{ boxShadow: '0 14px 40px rgba(14,12,16,0.7)' }}
    />
  )
}

// ── Gate: the object is closed until the player opens it ─────────────────

type GateKind = 'doors' | 'cover' | 'lift' | 'back'

const wood = 'linear-gradient(135deg, var(--brown) 0%, rgba(66,29,41,0.95) 55%, var(--brown) 100%)'
const leather = 'linear-gradient(160deg, rgba(81,65,61,1) 0%, rgba(66,29,41,1) 100%)'

function Gate({
  kind, label, sound, children, cover,
}: { kind: GateKind; label: string; sound: SfxName; children: ReactNode; cover?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const reduced = prefersReducedMotion()
  const d = reduced ? 0.01 : 0.9

  const openIt = () => {
    audio.sfx(sound)
    setOpen(true)
  }

  return (
    <div className="relative mx-auto w-full max-w-xl" style={{ perspective: '1400px', minHeight: 300 }}>
      <motion.div
        initial={false}
        animate={open ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 10, filter: 'blur(4px)' }}
        transition={{ duration: 0.6, delay: open ? d * 0.55 : 0 }}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {!open && (
          <motion.div key="closed" className="absolute inset-0 flex items-center justify-center" exit={{ opacity: 0, transition: { delay: d, duration: 0.3 } }}>
            {kind === 'doors' && (
              <div className="relative w-72 h-80" style={{ transformStyle: 'preserve-3d' }}>
                {[0, 1].map((side) => (
                  <motion.div
                    key={side}
                    className="absolute top-0 h-full w-1/2 rounded-sm"
                    style={{
                      [side === 0 ? 'left' : 'right']: 0,
                      background: wood,
                      border: '2px solid rgba(14,12,16,0.6)',
                      transformOrigin: side === 0 ? 'left center' : 'right center',
                      boxShadow: 'inset 0 0 0 10px rgba(14,12,16,0.25)',
                    }}
                    exit={{ rotateY: side === 0 ? -110 : 110, transition: { duration: d, ease: [0.22, 0.61, 0.36, 1] } }}
                  >
                    <span className="absolute top-1/2 w-2 h-2 rounded-full" style={{ [side === 0 ? 'right' : 'left']: 10, background: 'var(--gold)' }} />
                  </motion.div>
                ))}
              </div>
            )}
            {(kind === 'cover' || kind === 'back') && (
              <motion.div
                className="w-72 h-80 rounded-sm flex items-center justify-center"
                style={{
                  background: kind === 'cover' ? leather : wood,
                  border: '2px solid rgba(14,12,16,0.6)',
                  transformOrigin: 'left center',
                  boxShadow: '0 16px 40px rgba(14,12,16,0.7), inset 0 0 0 8px rgba(14,12,16,0.25)',
                }}
                exit={{ rotateY: -165, transition: { duration: d, ease: [0.22, 0.61, 0.36, 1] } }}
              >
                {cover}
              </motion.div>
            )}
            {kind === 'lift' && (
              <motion.div
                className="w-full max-w-md h-64 rounded-sm"
                style={{
                  background:
                    'repeating-linear-gradient(45deg, rgba(66,29,41,1) 0 14px, rgba(81,65,61,1) 14px 28px)',
                  border: '6px solid rgba(165,138,96,0.6)',
                  transformOrigin: 'top center',
                }}
                exit={{ rotateX: 75, y: -40, transition: { duration: d, ease: [0.22, 0.61, 0.36, 1] } }}
              />
            )}
            <motion.div
              className="absolute bottom-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ delay: 0.35 }}
            >
              <Button variant="primary" onClick={openIt}>{label}</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Flip: turn a document or photograph over ─────────────────────────────

function Flip({
  front, back, label, onFlip,
}: { front: ReactNode; back: ReactNode; label: string; onFlip?: () => void }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ perspective: '1600px' }}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: prefersReducedMotion() ? 0.01 : 0.8, ease: [0.22, 0.61, 0.36, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative"
        >
          <div style={{ backfaceVisibility: 'hidden' }}>{front}</div>
          <div className="absolute inset-0 flex items-center justify-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            {back}
          </div>
        </motion.div>
      </div>
      <Button
        variant="secondary"
        onClick={() => {
          audio.sfx('page')
          setFlipped((f) => !f)
          if (!flipped) onFlip?.()
        }}
      >
        <RotateCcw size={14} className="mr-2" />{flipped ? 'Turn it back' : label}
      </Button>
    </div>
  )
}

function BackOfPaper({ children }: { children: ReactNode }) {
  return (
    <div
      className="w-full h-full min-h-48 flex items-center justify-center p-6 rounded-sm"
      style={{ background: 'linear-gradient(160deg, var(--parchment) 0%, var(--parchment-dark) 100%)', boxShadow: '0 10px 30px rgba(14,12,16,0.55)' }}
    >
      {children}
    </div>
  )
}

// ── Photograph under a magnifier, with a detail hidden at high zoom ──────

interface Secret { x: number; y: number; clueId: string }

function PhotoInspector({
  src, alt, caption, secret, found, onFind,
}: { src: string; alt: string; caption?: string; secret?: Secret; found: boolean; onFind: (id: string, at: { x: number; y: number }) => void }) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  const zoomTo = (s: number) => {
    const next = Math.min(3.5, Math.max(1, s))
    if (next === 1) setPan({ x: 0, y: 0 })
    setScale(next)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative overflow-hidden rounded-sm p-3 pb-5 select-none"
        style={{ background: 'var(--parchment-light)', boxShadow: '0 10px 30px rgba(14,12,16,0.55)', touchAction: 'none', cursor: scale > 1 ? 'grab' : 'zoom-in' }}
        onWheel={(e) => zoomTo(scale + (e.deltaY < 0 ? 0.35 : -0.35))}
        onPointerDown={(e) => {
          if (scale === 1) return zoomTo(2)
            ; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          const lim = 160 * (scale - 1)
          setPan({
            x: Math.max(-lim, Math.min(lim, drag.current.px + (e.clientX - drag.current.x))),
            y: Math.max(-lim, Math.min(lim, drag.current.py + (e.clientY - drag.current.y))),
          })
        }}
        onPointerUp={() => { drag.current = null }}
      >
        <div className="overflow-hidden">
          <motion.div animate={{ scale, x: pan.x, y: pan.y }} transition={{ type: 'spring', stiffness: 220, damping: 26 }} className="relative">
            <img src={src} alt={alt} draggable={false} className="block max-h-[48dvh] max-w-full object-contain pointer-events-none" />
            {secret && scale >= 2 && (
              <button
                aria-label={found ? 'Detail already noted' : 'A detail at the torn edge'}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { if (!found) onFind(secret.clueId, { x: e.clientX, y: e.clientY }) }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full"
                style={{
                  left: `${secret.x}%`, top: `${secret.y}%`,
                  background: found ? 'transparent' : 'radial-gradient(circle, rgba(232,177,93,0.45), transparent 65%)',
                  border: found ? '1px dashed var(--verdigris)' : 'none',
                }}
              >
                {!found && <span className="glow-flicker absolute inset-2 rounded-full" style={{ boxShadow: '0 0 12px rgba(232,177,93,0.9)' }} />}
              </button>
            )}
          </motion.div>
        </div>
        {caption && <p className="font-caveat text-lg text-obsidian text-center mt-2">{caption}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button aria-label="Magnify less" onClick={() => zoomTo(scale - 0.5)} className="p-2 rounded border border-gold"><ZoomOut size={16} color="var(--parchment)" /></button>
        <span className="font-inter text-xs text-parchment-dark w-28 text-center">
          <Search size={12} className="inline mr-1" />Magnifier {scale.toFixed(1)}×
        </span>
        <button aria-label="Magnify more" onClick={() => zoomTo(scale + 0.5)} className="p-2 rounded border border-gold"><ZoomIn size={16} color="var(--parchment)" /></button>
      </div>
      <p className="font-inter text-xs text-parchment-dark">Scroll or use + to magnify. Drag to look around.</p>
    </div>
  )
}

// ── The tape: reels, waveform, transcript in time ────────────────────────

function TapePlayer({ photo }: { photo: boolean }) {
  const [playing, setPlaying] = useState(false)
  const [shown, setShown] = useState(0)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!playing) return
    const timers = RECORDING_LINES.map((line, i) =>
      setTimeout(() => {
        setShown(i + 1)
        if (line[1].includes('falls')) { audio.sfx('stamp', 1); audio.sfx('static', 0.8) }
        if (i === RECORDING_LINES.length - 1) setTimeout(() => setPlaying(false), 1600)
      }, 900 + i * 1700)
    )
    return () => timers.forEach(clearTimeout)
  }, [playing])

  useEffect(() => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    let raf = 0, t = 0
    const draw = () => {
      t += 0.06
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.strokeStyle = 'rgba(232,177,93,0.85)'
      ctx.lineWidth = 2
      ctx.beginPath()
      const amp = playing ? 1 : 0.06
      for (let x = 0; x < c.width; x += 3) {
        const n = Math.sin(x * 0.05 + t * 3) * Math.sin(x * 0.013 + t) + Math.sin(x * 0.11 - t * 5) * 0.4
        const y = c.height / 2 + n * amp * (c.height * 0.38) * (0.6 + 0.4 * Math.sin(t + x * 0.002))
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.stroke()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {photo ? <Hero src="/assets/evidence/recorder.jpg" alt="The study cassette recorder" /> : (
        <svg viewBox="0 0 240 140" className="w-56" role="img" aria-label="Cassette tape labelled Study, 11.11.08">
          <rect x="4" y="4" width="232" height="132" rx="10" fill="var(--ink)" stroke="var(--gold)" strokeWidth="2" />
          <rect x="24" y="18" width="192" height="46" rx="3" fill="var(--parchment-light)" />
          <text x="120" y="47" textAnchor="middle" fontSize="20" fill="var(--obsidian)" fontFamily="var(--font-caveat), cursive">Study — 11.11.08</text>
          <rect x="60" y="78" width="120" height="34" rx="17" fill="var(--brown)" />
          {[84, 156].map((cx) => (
            <motion.g key={cx} animate={{ rotate: playing ? 360 : 0 }} transition={{ repeat: playing ? Infinity : 0, duration: 2, ease: 'linear' }} style={{ transformBox: 'view-box', transformOrigin: `${cx}px 95px` }}>
              <circle cx={cx} cy="95" r="12" fill="var(--parchment-dark)" />
              <path d={`M${cx - 7} 95 H${cx + 7} M${cx} 88 V102`} stroke="var(--ink)" strokeWidth="2" />
            </motion.g>
          ))}
        </svg>
      )}
      <canvas ref={canvas} width={480} height={70} className="w-full h-16 rounded" style={{ background: 'rgba(14,12,16,0.7)', border: '1px solid var(--brown)' }} aria-hidden="true" />
      <Button
        variant="primary"
        onClick={() => { audio.sfx('tape'); setShown(0); setPlaying(true) }}
        disabled={playing}
      >
        <Play size={14} className="mr-2" />{shown > 0 && !playing ? 'Play again' : 'Play the tape'}
      </Button>
      <div className="w-full rounded-sm px-5 py-4 min-h-40" style={{ background: 'linear-gradient(160deg, var(--parchment-light), var(--parchment))' }}>
        <p className="font-inter text-xs text-brown uppercase tracking-wide mb-2">Transcript</p>
        {shown === 0 && <p className="font-caveat text-lg text-brown">Press play.</p>}
        <AnimatePresence>
          {RECORDING_LINES.slice(0, shown).map(([t, text, key], i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
              <span className="font-inter text-xs text-brown w-10 pt-1">{t}</span>
              <span className={`font-cormorant text-base text-obsidian ${key ? 'font-bold' : ''}`}>{text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Clock: stopped at 11:13; the back opens ──────────────────────────────

function ClockFace() {
  const hand = (deg: number, len: number, w: number) => (
    <line x1="100" y1="100" x2={100 + Math.sin((deg * Math.PI) / 180) * len} y2={100 - Math.cos((deg * Math.PI) / 180) * len} stroke="var(--ink)" strokeWidth={w} strokeLinecap="round" />
  )
  return (
    <svg viewBox="0 0 200 200" className="w-60" role="img" aria-label="A mantel clock stopped at 11:13">
      <circle cx="100" cy="100" r="92" fill="var(--parchment-light)" stroke="var(--gold)" strokeWidth="8" />
      {['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].map((n, i) => {
        const a = (i * 30 * Math.PI) / 180
        return <text key={n} x={100 + Math.sin(a) * 70} y={104 + -Math.cos(a) * 70} textAnchor="middle" fontSize="12" fill="var(--obsidian)" fontFamily="var(--font-cormorant), serif">{n}</text>
      })}
      {hand(336.5, 46, 5)}
      {hand(78, 68, 3)}
      {/* the second hand twitches but never moves on */}
      <motion.g animate={{ rotate: [78, 81, 78] }} transition={{ repeat: Infinity, duration: 1.2 }} style={{ transformBox: 'view-box', transformOrigin: '100px 100px' }}>
        <line x1="100" y1="100" x2="100" y2="24" stroke="var(--thread)" strokeWidth="1.5" />
      </motion.g>
      <circle cx="100" cy="100" r="5" fill="var(--gold)" />
    </svg>
  )
}

// ── Router: each object's own close-up ───────────────────────────────────

interface ObjectCloseUpProps {
  object: SceneObject
  evidence: Evidence[]
  found: string[]
  onFind: (clueId: string, at: { x: number; y: number }) => void
}

export function ObjectCloseUp({ object, evidence, found, onFind }: ObjectCloseUpProps) {
  const phonePhoto = useAsset('/assets/evidence/telephone.jpg')
  const recorderPhoto = useAsset('/assets/evidence/recorder.jpg')
  const clockPhoto = useAsset('/assets/evidence/clock.jpg')
  const cabinetPhoto = useAsset('/assets/evidence/cabinet.jpg')
  const diaryPhoto = useAsset('/assets/evidence/diary.jpg')
  const rugPhoto = useAsset('/assets/evidence/rug-notice.jpg')
  const ev = (id: string) => evidence.find((e) => e.id === id)
  const centre = () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

  switch (object.id) {
    case 'OBJ-telephone':
      return (
        <motion.div
          initial={{ rotate: -2 }}
          animate={{ rotate: [-2, 2, -1.5, 1.5, 0] }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          onAnimationComplete={() => audio.sfx('pickup', 0.8)}
        >
          {phonePhoto ? <Hero src="/assets/evidence/telephone.jpg" alt="Rotary telephone labelled Ext 2, Cellar" /> : <EvidenceVisual evidenceId="EV-01" name="Rotary Telephone" />}
        </motion.div>
      )

    case 'OBJ-photograph': {
      const p = ev('EV-02')
      return (
        <PhotoInspector
          src={p?.assetPath ?? '/assets/evidence/photo-family-torn.jpg'}
          alt="Torn family photograph, Christmas 2007"
          caption="Christmas 2007"
          secret={{ x: 66, y: 42, clueId: 'OC-01' }}
          found={found.includes('OC-01')}
          onFind={onFind}
        />
      )
    }

    case 'OBJ-diary':
      return (
        <Gate kind="cover" label="Open the diary" sound="page" cover={<span className="font-cormorant italic text-parchment-dark text-xl">C. A. — 2008</span>}>
          {diaryPhoto && <div className="mb-4"><Hero src="/assets/evidence/diary.jpg" alt="Clara's open diary with a key taped inside" /></div>}
          <EvidenceVisual evidenceId="EV-03" name="Clara's Diary" />
        </Gate>
      )

    case 'OBJ-clippings':
      return (
        <div className="flex flex-wrap justify-center gap-4 py-2">
          <Clipping tilt={-3} date="13 NOV 2008" headline="Family leaves Hollow Lane home"
            body="Edmund and Clara Ashworth and their daughter Lily, 9, left Ashworth House on the afternoon of 11 November. Their housekeeper told officers the family drove away before dark." />
          <Clipping tilt={2} className="sm:mt-8" date="15 NOV 2008" headline={'Police: "no sign of foul play"'}
            body="Officers say there is no evidence of a crime and the family is believed to have travelled abroad of their own accord. The inquiry has been scaled back." />
          <Flip
            label="Turn it over"
            onFlip={() => { if (!found.includes('OC-03')) setTimeout(() => onFind('OC-03', centre()), 700) }}
            front={<Clipping tilt={-1} date="20 NOV 2008" headline="Cousin 'shocked' by departure"
              body="Julian Ashworth, Mr Ashworth's cousin, who was abroad at the time, said the couple had often spoken of emigrating. He asked for the family's privacy." />}
            back={<BackOfPaper><p className="font-caveat text-2xl text-obsidian leading-snug -rotate-2">Cousin not abroad?<br />Ask the neighbour about the car.<br /><span className="text-lg">— D.I. Hart</span></p></BackOfPaper>}
          />
        </div>
      )

    case 'OBJ-clock':
      return (
        <div className="flex flex-col items-center gap-5">
          {clockPhoto ? <Hero src="/assets/evidence/clock.jpg" alt="Mantel clock stopped at 11:13" /> : <ClockFace />}
          <Gate kind="back" label="Open the back of the clock" sound="drawer" cover={<span className="font-cinzel text-xs tracking-[0.3em] text-parchment-dark">REAR PANEL</span>}>
            <div className="space-y-5">
              <button
                onClick={(e) => { if (!found.includes('OC-02')) onFind('OC-02', { x: e.clientX, y: e.clientY }) }}
                className="block mx-auto px-6 py-4 rounded-sm text-left"
                style={{ background: 'linear-gradient(135deg, rgba(165,138,96,0.9), rgba(81,65,61,0.95))', boxShadow: 'inset 0 0 20px rgba(14,12,16,0.6)' }}
                aria-label={found.includes('OC-02') ? 'Scratches noted' : 'Look closer at the scratches inside the door'}
              >
                <span className="font-caveat text-xl text-ink" style={{ textShadow: '0 1px 0 rgba(234,223,201,0.35)', color: 'var(--ink)' }}>
                  {found.includes('OC-02') ? '11:13 — she is still calling.' : '~ scratches in the brass ~'}
                </span>
              </button>
              <EvidenceVisual evidenceId="EV-08" name="Housekeeper's Logbook" />
            </div>
          </Gate>
        </div>
      )

    case 'OBJ-recorder':
      return <TapePlayer photo={recorderPhoto} />

    case 'OBJ-cabinet':
      return (
        <Gate kind="doors" label="Open the cabinet" sound="drawer">
          {cabinetPhoto && <div className="mb-4"><Hero src="/assets/evidence/cabinet.jpg" alt="The opened cabinet" /></div>}
          <div className="space-y-6">
            <EvidenceVisual evidenceId="EV-05" assetPath={ev('EV-05')?.assetPath} name="Photograph Strip" />
            <EvidenceVisual evidenceId="EV-06" name="Unsigned Will Amendment" />
          </div>
        </Gate>
      )

    case 'OBJ-belongings': {
      const d = ev('EV-09')
      return (
        <Flip
          label="Turn the drawing over"
          onFlip={() => { if (!found.includes('OC-04')) setTimeout(() => onFind('OC-04', centre()), 700) }}
          front={<EvidenceVisual evidenceId="EV-09" assetPath={d?.assetPath} name="Lily's Drawing" />}
          back={<BackOfPaper><p className="font-caveat text-3xl leading-snug rotate-1" style={{ color: 'var(--thread)' }}>Mummy says the<br />cellar phone is<br />our secret.</p></BackOfPaper>}
        />
      )
    }

    case 'OBJ-rug':
      return (
        <Gate kind="lift" label="Lift the corner of the rug" sound="drawer">
          {rugPhoto ? <Hero src="/assets/evidence/rug-notice.jpg" alt="A letter under the rug" /> : null}
          <div className={rugPhoto ? 'mt-4' : ''}><EvidenceVisual evidenceId="EV-10" name="Creditor Final Notice" /></div>
        </Gate>
      )

    default:
      return (
        <div className="space-y-6">
          {evidence.map((e) => <EvidenceVisual key={e.id} evidenceId={e.id} assetPath={e.assetPath} name={e.name} />)}
        </div>
      )
  }
}
