'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Lamp, LampDesk, Sparkles, X } from 'lucide-react'
import { Button, ParchmentCard } from '@/components/ui'
import { Hotspot } from '@/components/scene/Hotspot'
import { Gate } from '@/components/scene/CloseUpInteractions'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { useFxStore } from '@/store/fxStore'
import { useAsset } from '@/lib/useAsset'
import { evaluateCondition } from '@/lib/engine/conditions'
import { audio } from '@/lib/audio/engine'
import { CASE_001 } from '@/data/case001'
import { LILY_ROOM_OBJECTS, LILY_ROOM_UNLOCK, type LilyRoomObject } from '@/data/case001/lily-room'
import type { SceneObject } from '@/types'

const ROOM_ART = '/assets/scene/lily-room.jpg'
const TORCH_RADIUS = 190

// Hotspot draws a SceneObject; the room's objects only need its shape
const asSceneObject = (o: LilyRoomObject) =>
  ({ id: o.id, name: o.name, description: o.text, hotspot: { ...o.hotspot, r: 4 }, locationId: 'lily-room', yieldsEvidence: o.yields ? [o.yields] : [], relatedCharacters: [], storyRelevance: '' }) as unknown as SceneObject

export default function LilyRoomPage() {
  const hydrated = useHydrated()
  const state = useGameStore((s) => s)
  const { inspectedObjects, collectedEvidence, entity, inspectObject, collectEvidence, addAttention } = state
  const art = useAsset(ROOM_ART)
  const darkRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<LilyRoomObject | null>(null)
  const [lamp, setLamp] = useState(false)
  const [whisper, setWhisper] = useState<string | null>(null)

  // The torch follows the pointer (or a finger)
  const moveTorch = (x: number, y: number) => {
    darkRef.current?.style.setProperty('--tx', `${x}px`)
    darkRef.current?.style.setProperty('--ty', `${y}px`)
  }
  useEffect(() => {
    moveTorch(window.innerWidth / 2, window.innerHeight * 0.55)
    const onMove = (e: PointerEvent) => moveTorch(e.clientX, e.clientY)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onMove)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onMove) }
  }, [hydrated])

  // Once the entity is interfering, the music box starts on its own
  useEffect(() => {
    if (!hydrated || entity.stage < 2) return
    const t = setTimeout(() => {
      playLullaby()
      setWhisper('Somewhere in the dark, the music box begins to play.')
      setTimeout(() => setWhisper(null), 4500)
    }, 3500)
    return () => clearTimeout(t)
  }, [hydrated, entity.stage])

  if (!hydrated) return null

  if (!evaluateCondition(LILY_ROOM_UNLOCK, state)) {
    return (
      <main className="min-h-dvh bg-obsidian flex items-center justify-center px-4">
        <ParchmentCard className="p-8 max-w-sm text-center space-y-4">
          <h1 className="font-cormorant font-bold text-obsidian text-xl">The upstairs door is shut</h1>
          <p className="font-inter text-base text-brown">Find something of Lily&rsquo;s in the study first.</p>
          <Link href="/case/001/scene" className="font-inter text-sm text-brown underline">Back to the study</Link>
        </ParchmentCard>
      </main>
    )
  }

  const open = (o: LilyRoomObject) => {
    audio.sfx('click')
    if (!inspectedObjects.includes(o.id)) { inspectObject(o.id); addAttention(1) }
    if (o.id === 'LR-musicbox') playLullaby()
    if (o.id === 'LR-window') audio.sfx('whoosh', 0.4)
    setSelected(o)
  }

  const take = (o: LilyRoomObject, e: React.MouseEvent) => {
    if (!o.yields || collectedEvidence[o.yields]) return
    collectEvidence(o.yields)
    audio.sfx('sting', 0.9)
    useFxStore.getState().fly(o.yields, { x: e.clientX, y: e.clientY })
  }

  const found = LILY_ROOM_OBJECTS.filter((o) => o.yields && collectedEvidence[o.yields]).length
  const total = LILY_ROOM_OBJECTS.filter((o) => o.yields).length
  const clue = selected?.yields ? CASE_001.evidence.find((e) => e.id === selected.yields) : undefined
  const clueFound = Boolean(selected?.yields && collectedEvidence[selected.yields])

  return (
    <div className="fixed inset-0 overflow-hidden bg-ink">
      {/* The room, cover-sized at the picture's own shape so hotspots stay on their objects */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 'max(100vw, 183.33dvh)', height: 'max(100dvh, 54.55vw)' }}
      >
        {art ? <img src={ROOM_ART} alt="Lily's bedroom" className="w-full h-full object-cover" draggable={false} /> : <LilyRoomDrawing />}
        {LILY_ROOM_OBJECTS.map((o) => (
          <div
            key={o.id}
            onFocus={(e) => { const r = e.currentTarget.getBoundingClientRect(); moveTorch(r.left + r.width / 2, r.top + r.height / 2) }}
          >
            <Hotspot
              object={asSceneObject(o)}
              state={inspectedObjects.includes(o.id) && (!o.yields || collectedEvidence[o.yields]) ? 'inspected' : 'undiscovered'}
              onClick={() => open(o)}
            />
          </div>
        ))}
      </div>

      {/* Darkness, with a hole where the torch points. It lets clicks through. */}
      <div
        ref={darkRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: lamp ? 0 : 1,
          background: `radial-gradient(circle ${TORCH_RADIUS}px at var(--tx, 50%) var(--ty, 55%), rgba(14,12,16,0) 0%, rgba(14,12,16,0.35) 45%, rgba(8,7,9,0.975) 100%)`,
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(14,12,16,0.75) 100%)' }} />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3" style={{ zIndex: 10 }}>
        <Link href="/case/001/scene" className="flex items-center gap-2 font-inter text-sm text-parchment-dark hover:text-parchment">
          <ArrowLeft size={16} /> Back to the study
        </Link>
        <span className="font-cinzel text-xs tracking-widest text-parchment-dark uppercase">Lily&rsquo;s Room</span>
        <button
          onClick={() => { audio.sfx('click'); setLamp((v) => !v) }}
          aria-pressed={lamp}
          className="flex items-center gap-2 font-inter text-sm text-parchment-dark hover:text-parchment"
        >
          {lamp ? <LampDesk size={16} /> : <Lamp size={16} />} {lamp ? 'Put out the lamp' : 'Light the lamp'}
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none" style={{ zIndex: 10 }}>
        <p className="font-cormorant italic text-parchment text-lg px-4 py-1 rounded" style={{ background: 'rgba(14,12,16,0.6)' }}>
          {lamp ? 'The lamp is lit.' : 'Move your torch to search the dark.'} Hidden here: {found} of {total}
        </p>
      </div>

      <AnimatePresence>
        {whisper && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 font-cormorant italic text-parchment text-lg px-4 py-1 rounded"
            style={{ zIndex: 11, background: 'rgba(14,12,16,0.7)' }}
          >
            {whisper}
          </motion.p>
        )}
      </AnimatePresence>

      {/* What you find */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
            style={{ zIndex: 30, background: 'rgba(14,12,16,0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={selected.name}
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl"
            >
              <ParchmentCard className="p-6 space-y-4 relative">
                <button aria-label="Close" onClick={() => setSelected(null)} className="absolute top-3 right-3 p-1"><X size={16} color="var(--brown)" /></button>
                <h2 className="font-cormorant font-bold text-obsidian text-2xl">{selected.name}</h2>
                <p className="font-cormorant text-obsidian text-lg leading-relaxed">{selected.text}</p>
                {clue && selected.interaction && (
                  <Gate kind={selected.interaction} label={selected.interaction === 'doors' ? 'Open the wardrobe' : 'Lift it up'} sound={selected.interaction === 'doors' ? 'drawer' : 'page'}>
                    <div className="rounded-sm p-4 space-y-3 text-center" style={{ background: 'rgba(14,12,16,0.85)' }}>
                      <p className="font-cinzel text-[10px] tracking-[0.25em] text-parchment-dark flex items-center justify-center gap-1.5"><Sparkles size={12} color="var(--candle)" /> HIDDEN DETAIL</p>
                      <p className="font-cormorant font-bold text-parchment text-xl">{clue.name}</p>
                      <p className="font-inter text-base text-parchment-dark">{clue.description}</p>
                      {clueFound
                        ? <p className="font-inter text-sm" style={{ color: 'var(--verdigris)' }}>Logged in your evidence.</p>
                        : <Button variant="primary" onClick={(e) => take(selected, e)}>Take it</Button>}
                    </div>
                  </Gate>
                )}
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={() => setSelected(null)}>Back to the room</Button>
                </div>
              </ParchmentCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Three bars of a lullaby that stops on the same note. */
function playLullaby() {
  const notes = [0, 380, 760, 1140, 1520, 1900]
  notes.forEach((t, i) => setTimeout(() => audio.sfx(i === notes.length - 1 ? 'drone' : 'chime', i === notes.length - 1 ? 0.35 : 0.35), t))
}

/** Drawn stand-in for the room until public/assets/scene/lily-room.jpg is added. */
function LilyRoomDrawing() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="w-full h-full" role="img" aria-label="A child's bedroom in the dark">
      <defs>
        <pattern id="lr-paper" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="var(--burgundy)" />
          <path d="M30 8 q6 10 0 20 q-6 10 0 20" fill="none" stroke="var(--parchment-dark)" strokeOpacity="0.12" strokeWidth="3" />
        </pattern>
        <linearGradient id="lr-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--brown)" />
          <stop offset="1" stopColor="var(--ink)" />
        </linearGradient>
      </defs>
      {/* walls and floor */}
      <rect width="1600" height="900" fill="url(#lr-paper)" />
      <rect y="640" width="1600" height="260" fill="url(#lr-floor)" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <line key={i} x1={i * 220} y1="640" x2={i * 220 - 120} y2="900" stroke="var(--ink)" strokeOpacity="0.5" strokeWidth="3" />)}
      <rect y="620" width="1600" height="22" fill="var(--brown)" />

      {/* window with moon (LR-window 62%,32%) */}
      <rect x="880" y="120" width="230" height="330" fill="var(--ink)" stroke="var(--brown)" strokeWidth="14" />
      <circle cx="1040" cy="190" r="34" fill="var(--parchment-light)" opacity="0.85" />
      <circle cx="930" cy="400" r="5" fill="var(--candle)" />
      <line x1="995" y1="120" x2="995" y2="450" stroke="var(--brown)" strokeWidth="8" />
      <line x1="880" y1="285" x2="1110" y2="285" stroke="var(--brown)" strokeWidth="8" />
      <path d="M860 110 q40 180 0 360 M1130 110 q-40 180 0 360" fill="var(--burgundy)" stroke="var(--brown)" strokeWidth="4" opacity="0.9" />

      {/* drawings pinned on the wall (LR-drawings 30%,24%) */}
      {[[400, 150, -6], [500, 175, 4], [600, 140, -2]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x + 40} ${y + 50})`}>
          <rect x={x} y={y} width="80" height="100" fill="var(--parchment-light)" />
          <circle cx={x + 40} cy={y + 4} r="4" fill="var(--thread)" />
          {i === 1 && <path d={`M${x + 40} ${y + 30} v40 q0 20 -20 24`} fill="none" stroke="var(--obsidian)" strokeWidth="3" />}
          {i === 0 && <path d={`M${x + 15} ${y + 70} l25 -25 l25 25 z`} fill="none" stroke="var(--brown)" strokeWidth="3" />}
          {i === 2 && <circle cx={x + 55} cy={y + 30} r="12" fill="var(--candle)" opacity="0.7" />}
        </g>
      ))}

      {/* toy shelf with red toy telephone (LR-toys 44%,46%) */}
      <rect x="600" y="430" width="260" height="14" fill="var(--brown)" />
      <rect x="620" y="380" width="30" height="50" rx="12" fill="var(--parchment-dark)" />
      <path d="M690 430 q30 -60 60 0 z" fill="var(--thread)" />
      <circle cx="720" cy="412" r="9" fill="var(--parchment-light)" opacity="0.8" />
      <path d="M760 430 q20 30 50 -6" fill="none" stroke="var(--thread)" strokeWidth="3" />
      <rect x="815" y="398" width="24" height="32" fill="var(--gold)" opacity="0.7" />

      {/* bedside table and music box (LR-musicbox 11%,56%) */}
      <rect x="110" y="520" width="140" height="120" fill="var(--brown)" />
      <rect x="140" y="480" width="80" height="42" fill="var(--burgundy)" stroke="var(--gold)" strokeWidth="3" />
      <rect x="140" y="462" width="80" height="20" fill="var(--gold)" opacity="0.6" transform="rotate(-12 140 482)" />

      {/* bed (LR-bed 26%,70%) */}
      <rect x="260" y="560" width="440" height="150" rx="10" fill="var(--parchment-dark)" />
      <rect x="260" y="540" width="140" height="60" rx="18" fill="var(--parchment-light)" />
      <path d="M380 580 h320 v130 h-320 z" fill="var(--burgundy)" opacity="0.9" />
      <path d="M380 580 q60 30 120 0" fill="none" stroke="var(--parchment-dark)" strokeWidth="4" />
      <rect x="250" y="470" width="24" height="250" fill="var(--brown)" />
      <rect x="690" y="560" width="22" height="160" fill="var(--brown)" />
      <ellipse cx="320" cy="545" rx="22" ry="16" fill="var(--parchment)" />
      <ellipse cx="310" cy="528" rx="6" ry="14" fill="var(--parchment)" />
      <ellipse cx="330" cy="528" rx="6" ry="14" fill="var(--parchment)" />

      {/* wardrobe (LR-wardrobe 85%,52%) */}
      <rect x="1250" y="200" width="250" height="440" fill="var(--brown)" stroke="var(--ink)" strokeWidth="6" />
      <line x1="1375" y1="210" x2="1375" y2="630" stroke="var(--ink)" strokeWidth="5" />
      <circle cx="1360" cy="430" r="6" fill="var(--gold)" />
      <circle cx="1390" cy="430" r="6" fill="var(--gold)" />
      <rect x="1240" y="180" width="270" height="26" fill="var(--brown)" />
    </svg>
  )
}
