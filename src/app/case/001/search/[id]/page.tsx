'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Lightbulb, Lock, Star, Timer } from 'lucide-react'
import { Button, ParchmentCard } from '@/components/ui'
import { EntityTint } from '@/components/entity/EntityTint'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore, starsAvailable } from '@/store/gameStore'
import { audio } from '@/lib/audio/engine'
import { evaluateCondition } from '@/lib/engine/conditions'
import { findPoints, nextCombo, finalScore, searchStars, modeUnlocked, pickItems, scramble, hits } from '@/lib/engine/search'
import { SEARCH_SCENES, SEARCH_MODES, type SearchMode, type SearchItem } from '@/data/case001/search'
import { LILY_ROOM_UNLOCK } from '@/data/case001/lily-room'

const HINT_COOLDOWN = 30

type Run = { mode: SearchMode; items: SearchItem[]; found: string[]; left: number; points: number; combo: number; lastAt: number | null; misses: number }

export default function SearchPage() {
  const params = useParams()
  const hydrated = useHydrated()
  const scene = SEARCH_SCENES.find((s) => s.id === params?.id) ?? SEARCH_SCENES[0]
  const state = useGameStore((s) => s)
  const recordSearch = useGameStore((s) => s.recordSearch)
  const results = state.search ?? {}

  const [run, setRun] = useState<Run | null>(null)
  const [done, setDone] = useState<{ score: number; stars: number; completed: boolean } | null>(null)
  const [hintAt, setHintAt] = useState(-HINT_COOLDOWN)
  const [hinted, setHinted] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ x: number; y: number; ok: boolean; key: number; text?: string } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const torchRef = useRef<HTMLDivElement>(null)
  const plays = useRef(0)

  const start = (mode: SearchMode) => {
    const m = SEARCH_MODES.find((x) => x.id === mode)!
    plays.current += 1
    audio.sfx(mode === '1113' ? 'drone' : 'whoosh', 0.7)
    setDone(null)
    setHinted(null)
    setHintAt(-HINT_COOLDOWN)
    setRun({ mode, items: pickItems(scene, mode, Date.now() % 997 + plays.current), found: [], left: m.seconds, points: 0, combo: 0, lastAt: null, misses: 0 })
  }

  // The clock
  const running = Boolean(run && !done)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setRun((r) => (r ? { ...r, left: r.left - 1 } : r)), 1000)
    return () => clearInterval(t)
  }, [running])

  // Out of time, or everything found
  useEffect(() => {
    if (!run || done) return
    const completed = run.found.length === run.items.length
    if (run.left > 0 && !completed) return
    const score = completed ? finalScore(run.points, Math.max(0, run.left), run.misses) : 0
    const stars = searchStars(score, completed)
    if (completed) recordSearch(`${scene.id}:${run.mode}`, score, stars)
    audio.sfx(completed ? 'sting' : 'deny', 0.9)
    if (completed) setTimeout(() => audio.sfx('stamp', 0.8), 500)
    setDone({ score, stars, completed })
  }, [run, done, recordSearch, scene.id])

  // Heartbeat in the last ten seconds
  useEffect(() => {
    if (running && run && run.left <= 10 && run.left > 0) audio.sfx('heartbeat', 0.35)
  }, [running, run?.left]) // eslint-disable-line react-hooks/exhaustive-deps

  const onBoardClick = (e: React.MouseEvent) => {
    if (!run || done) return
    const r = boardRef.current!.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    const target = run.items.find((it) => !run.found.includes(it.id) && hits(it, x, y, scene.ratio))
    if (target) return find(target)
    audio.sfx('deny', 0.4)
    setFlash({ x, y, ok: false, key: Date.now() })
    setRun({ ...run, misses: run.misses + 1, combo: 0 })
  }

  const find = (item: SearchItem) => {
    if (!run || done || run.found.includes(item.id)) return
    const now = Date.now()
    const combo = nextCombo(run.combo, run.lastAt === null ? null : now - run.lastAt)
    const pts = findPoints(combo)
    audio.sfx(combo > 1 ? 'chime' : 'click', combo > 1 ? 0.6 : 0.8)
    setFlash({ x: item.x, y: item.y, ok: true, key: now, text: `+${pts}${combo > 1 ? ` \u00d7${combo}` : ''}` })
    if (hinted === item.id) setHinted(null)
    setRun({ ...run, found: [...run.found, item.id], points: run.points + pts, combo, lastAt: now })
  }

  const hint = () => {
    if (!run || done) return
    const elapsed = SEARCH_MODES.find((m) => m.id === run.mode)!.seconds - run.left
    if (elapsed - hintAt < HINT_COOLDOWN) return
    const next = run.items.find((it) => !run.found.includes(it.id))
    if (!next) return
    audio.sfx('chime', 0.5)
    setHintAt(elapsed)
    setHinted(next.id)
    setTimeout(() => setHinted(null), 2500)
  }

  const moveTorch = (e: React.PointerEvent) => {
    const r = boardRef.current?.getBoundingClientRect()
    if (!r || !torchRef.current) return
    torchRef.current.style.setProperty('--tx', `${e.clientX - r.left}px`)
    torchRef.current.style.setProperty('--ty', `${e.clientY - r.top}px`)
  }

  const label = useMemo(() => (it: SearchItem) => (run?.mode === 'scrambled' ? scramble(it.name, it.id.length) : it.name), [run?.mode])

  if (!hydrated) return null

  if (scene.id === 'lily-room' && !evaluateCondition(LILY_ROOM_UNLOCK, state)) {
    return (
      <main className="min-h-dvh bg-obsidian flex items-center justify-center px-4">
        <ParchmentCard className="p-8 max-w-sm text-center space-y-4">
          <p className="font-inter text-base text-brown">Lily&rsquo;s room is not open yet.</p>
          <Link href="/case/001/scene" className="font-inter text-sm text-brown underline">Back to the study</Link>
        </ParchmentCard>
      </main>
    )
  }

  const mode = run ? SEARCH_MODES.find((m) => m.id === run.mode)! : null
  const elapsed = run && mode ? mode.seconds - run.left : 0
  const hintReady = run ? elapsed - hintAt >= HINT_COOLDOWN : false

  return (
    <div className="fixed inset-0 bg-ink flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 gap-3" style={{ background: 'rgba(14,12,16,0.92)', zIndex: 10 }}>
        <Link href={scene.back} className="flex items-center gap-2 font-inter text-sm text-parchment-dark hover:text-parchment">
          <ArrowLeft size={16} /> Leave
        </Link>
        <span className="font-cinzel text-xs tracking-widest text-parchment-dark uppercase">{scene.name}{mode ? ` \u00b7 ${mode.name}` : ''}</span>
        <div className="flex items-center gap-4">
          {run && !done && (
            <>
              <span className="flex items-center gap-1.5 font-inter text-sm tabular-nums" style={{ color: run.left <= 10 ? 'var(--thread)' : 'var(--parchment)' }} aria-label={`${run.left} seconds left`}>
                <Timer size={16} /> {Math.max(0, run.left)}s
              </span>
              <span className="font-inter text-sm text-parchment tabular-nums" aria-label="Score">{run.points}</span>
              <button onClick={hint} disabled={!hintReady} className="flex items-center gap-1.5 font-inter text-sm text-parchment disabled:opacity-40" aria-label="Hint">
                <Lightbulb size={16} color="var(--candle)" /> {hintReady ? 'Hint' : `${HINT_COOLDOWN - (elapsed - hintAt)}s`}
              </button>
            </>
          )}
          <span className="flex items-center gap-1 font-inter text-sm text-parchment" aria-label="Stars to spend"><Star size={15} color="var(--candle)" fill="var(--candle)" /> {starsAvailable(state)}</span>
        </div>
      </div>

      {/* The room, fitted whole so every item can be reached */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <div
          ref={boardRef}
          onClick={onBoardClick}
          onPointerMove={moveTorch}
          className="relative cursor-crosshair select-none"
          style={{ aspectRatio: String(scene.ratio), width: `min(100%, calc((100dvh - 140px) * ${scene.ratio}))` }}
        >
          <img src={scene.src} alt={scene.name} draggable={false} className="absolute inset-0 w-full h-full object-cover" style={{ filter: run?.mode === '1113' ? 'saturate(0.6) contrast(1.1)' : undefined }} />
          {run?.mode === '1113' && <EntityTint />}

          {/* Objects the entity has moved */}
          {run?.items.filter((it) => it.moved).map((it) => (
            <img
              key={it.id}
              src={it.moved!.src}
              alt=""
              draggable={false}
              className="absolute pointer-events-none"
              style={{
                left: `${it.x}%`, top: `${it.y}%`, width: `${it.moved!.w}%`,
                transform: `translate(-50%, -50%) rotate(${it.moved!.rotate ?? 0}deg)`,
                filter: 'brightness(0.75) drop-shadow(0 6px 6px rgba(14,12,16,0.8))',
                opacity: run.found.includes(it.id) ? 0.45 : 1,
              }}
            />
          ))}

          {/* Invisible targets (named for screen readers and keyboard players) */}
          {run && !done && run.items.filter((it) => !run.found.includes(it.id)).map((it) => (
            <button
              key={it.id}
              aria-label={`Find: ${it.name}`}
              onClick={(e) => { e.stopPropagation(); find(it) }}
              className="absolute rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={{
                left: `${it.x}%`, top: `${it.y}%`, width: `${it.r * 2}%`, aspectRatio: '1',
                transform: 'translate(-50%, -50%)', background: 'transparent',
              }}
            />
          ))}

          {/* Found items are circled */}
          {run?.items.filter((it) => run.found.includes(it.id)).map((it) => (
            <motion.span
              key={`f-${it.id}`}
              aria-hidden="true"
              className="absolute rounded-full pointer-events-none"
              style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.r * 2}%`, aspectRatio: '1', x: '-50%', y: '-50%', border: '2px solid var(--verdigris)' }}
              initial={{ scale: 1.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.9 }}
            />
          ))}

          {/* Hint pulse */}
          {hinted && run && (() => {
            const it = run.items.find((i) => i.id === hinted)!
            return (
              <motion.span aria-hidden="true" className="absolute rounded-full pointer-events-none" style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.r * 5}%`, aspectRatio: '1', x: '-50%', y: '-50%', border: '2px solid var(--candle)' }} animate={{ scale: [1.4, 0.5], opacity: [0.2, 1] }} transition={{ repeat: Infinity, duration: 0.9 }} />
            )
          })()}

          <AnimatePresence>
            {flash && (
              <motion.span
                key={flash.key}
                aria-hidden="true"
                className="absolute pointer-events-none font-inter font-semibold text-sm"
                style={{ left: `${flash.x}%`, top: `${flash.y}%`, color: flash.ok ? 'var(--candle)' : 'var(--thread)', x: '-50%' }}
                initial={{ opacity: 1, y: '-50%' }}
                animate={{ opacity: 0, y: '-180%' }}
                transition={{ duration: 0.9 }}
                onAnimationComplete={() => setFlash(null)}
              >
                {flash.ok ? flash.text : '\u2715'}
              </motion.span>
            )}
          </AnimatePresence>

          {run?.mode === 'candle' && !done && (
            <div
              ref={torchRef}
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle 120px at var(--tx, 50%) var(--ty, 50%), rgba(14,12,16,0) 0%, rgba(14,12,16,0.5) 55%, rgba(8,7,9,0.97) 100%)' }}
            />
          )}
        </div>
      </div>

      {/* The list */}
      {run && (
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 px-4 py-3" style={{ background: 'rgba(14,12,16,0.95)', minHeight: 64 }} aria-label="Items to find">
          {run.items.map((it) => {
            const got = run.found.includes(it.id)
            return (
              <li key={it.id} className={`font-cormorant text-lg ${got ? 'line-through text-parchment-dark' : 'text-parchment'}`}>
                {label(it)}
              </li>
            )
          })}
        </ul>
      )}

      {/* Choose a mode / results */}
      <AnimatePresence>
        {(!run || done) && (
          <motion.div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 20, background: 'rgba(14,12,16,0.75)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} className="w-full max-w-lg" role="dialog" aria-label={done ? 'Search results' : 'Choose a search'}>
              <ParchmentCard className="p-6 space-y-4">
                {done ? (
                  <div className="text-center space-y-3">
                    <h2 className="font-cormorant font-bold text-obsidian text-3xl">{done.completed ? 'Search complete' : 'Out of time'}</h2>
                    <div className="flex justify-center gap-1" aria-label={`${done.stars} of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.span key={i} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 400, damping: 14 }}>
                          <Star size={30} color="var(--brown)" fill={i <= done.stars ? 'var(--gold)' : 'none'} />
                        </motion.span>
                      ))}
                    </div>
                    <p className="font-inter text-base text-brown">Score {done.score}{run && run.misses > 0 ? ` \u00b7 ${run.misses} wrong ${run.misses === 1 ? 'click' : 'clicks'}` : ''}</p>
                    {!done.completed && <p className="font-inter text-sm text-brown">Find everything before the clock runs out to earn stars.</p>}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h2 className="font-cormorant font-bold text-obsidian text-3xl">Search {scene.name.replace('The ', 'the ')}</h2>
                    <p className="font-inter text-base text-brown">Find each item on the list. Quick finds in a row score more; wrong clicks cost points. Stars buy lab speed-ups and hints from your partner.</p>
                  </div>
                )}
                <ul className="space-y-2">
                  {SEARCH_MODES.map((m) => {
                    const open = modeUnlocked(scene.id, m.id, results)
                    const best = results[`${scene.id}:${m.id}`]
                    return (
                      <li key={m.id} className="flex items-center justify-between gap-3 rounded-sm px-3 py-2" style={{ background: 'rgba(81,65,61,0.12)' }}>
                        <div className="min-w-0">
                          <p className="font-cormorant font-semibold text-obsidian text-lg leading-tight">{m.name}</p>
                          <p className="font-inter text-sm text-brown">{open ? m.text : 'Earn a star in the mode above to open this.'}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {best && <span className="flex items-center gap-0.5 font-inter text-sm text-brown"><Star size={14} fill="var(--gold)" color="var(--brown)" /> {best.stars}</span>}
                          <Button variant="primary" onClick={() => start(m.id)} disabled={!open} tooltip="Locked" className="px-4 py-1.5" aria-label={`Play ${m.name}`}>
                            {open ? 'Play' : <Lock size={14} />}
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <div className="flex justify-end">
                  <Link href={scene.back} className="font-inter text-sm text-brown underline">Back to the room</Link>
                </div>
              </ParchmentCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
