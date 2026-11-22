'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, FlaskConical, HelpCircle, Lock, Star, X } from 'lucide-react'
import { Button, ParchmentCard, Stamp } from '@/components/ui'
import { TopBar } from '@/components/archive/TopBar'
import { BrushSurface, Fingerprint, Jigsaw, UvSweep } from '@/components/forensics/Bench'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore, starsAvailable } from '@/store/gameStore'
import { selectUnlockedSections, selectProgress, selectRank } from '@/store/selectors'
import { taskStatus, labSecondsLeft, traitKnown, suspectMatches } from '@/lib/case/forensics'
import { audio } from '@/lib/audio/engine'
import { FORENSIC_TASKS, PROFILE_TRAITS, type ForensicTask } from '@/data/case001/forensics'
import { CASE_001 } from '@/data/case001'

export default function LabPage() {
  const hydrated = useHydrated()
  const state = useGameStore((s) => s)
  const { completeForensic, queueLab, spendStars, setLastRoute } = state
  const [now, setNow] = useState(() => Date.now())
  const [bench, setBench] = useState<ForensicTask | null>(null)
  const [report, setReport] = useState<ForensicTask | null>(null)

  useEffect(() => { setLastRoute('/case/001/lab') }, [setLastRoute])
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!hydrated) return null

  const unlocked = selectUnlockedSections(state)
  const progress = selectProgress(state, CASE_001)
  const { rank, title: rankTitle } = selectRank(progress)
  const stars = starsAvailable(state)

  const benchDone = (t: ForensicTask) => {
    setBench(null)
    if (t.labSeconds) {
      queueLab(t.id, Date.now() + t.labSeconds * 1000)
      audio.sfx('folder', 0.7)
    } else {
      completeForensic(t.id)
      setReport(t)
    }
  }

  const collect = (t: ForensicTask) => {
    completeForensic(t.id)
    audio.sfx('stamp', 0.8)
    setTimeout(() => audio.sfx('sting', 0.7), 300)
    setReport(t)
  }

  const speedUp = (t: ForensicTask) => {
    if (spendStars(1)) { audio.sfx('chime'); queueLab(t.id, Date.now()); setNow(Date.now()) }
  }

  const matches = suspectMatches(state)

  return (
    <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
      <TopBar investigatorName={state.investigator.name} rankTitle={rankTitle} rankNumber={rank} unlockedSections={unlocked} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 pl-0 md:pl-72">
          <Link href="/hq" className="inline-flex items-center gap-2 font-inter text-sm text-parchment-dark hover:text-parchment"><ArrowLeft size={14} /> Back to HQ</Link>
          <span className="flex items-center gap-1.5 font-inter text-sm text-parchment" aria-label="Stars to spend"><Star size={15} color="var(--candle)" fill="var(--candle)" /> {stars} to spend</span>
        </div>
        <h1 className="font-cormorant font-bold text-parchment text-3xl mb-1">Forensics Lab</h1>
        <p className="font-inter text-base text-parchment-dark mb-6 max-w-2xl">Work the evidence by hand, then send it to the lab. Results build a profile of the killer. None of this is required, but it shows you who did it.</p>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* The bench and the lab queue */}
          <ul className="grid sm:grid-cols-2 gap-4" aria-label="Forensic tasks">
            {FORENSIC_TASKS.map((t) => {
              const st = taskStatus(t, state, now)
              const left = labSecondsLeft(t.id, state, now)
              return (
                <motion.li key={t.id} layout className="rounded-sm p-4 flex flex-col gap-3" style={{ background: st === 'locked' ? 'rgba(81,65,61,0.25)' : 'linear-gradient(160deg, var(--parchment-light), var(--parchment-dark))', boxShadow: '0 10px 22px rgba(14,12,16,0.5)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className={`font-cormorant font-bold text-xl leading-tight ${st === 'locked' ? 'text-parchment-dark' : 'text-obsidian'}`}>{t.name}</h2>
                    {st === 'done' && <Check size={18} color="var(--verdigris)" aria-label="Done" />}
                    {st === 'locked' && <Lock size={16} color="var(--parchment-dark)" aria-label="Locked" />}
                  </div>
                  <p className={`font-inter text-sm ${st === 'locked' ? 'text-parchment-dark' : 'text-brown'}`}>
                    {st === 'locked'
                      ? `Needs: ${t.needs.map((id) => CASE_001.evidence.find((e) => e.id === id)?.name ?? id).join(' and ')}.`
                      : t.instruction}
                  </p>
                  <div className="mt-auto flex items-center gap-2 flex-wrap">
                    {st === 'open' && <Button variant="primary" className="px-4 py-1.5" onClick={() => { audio.sfx('drawer', 0.6); if (t.bench === 'none') benchDone(t); else setBench(t) }}>{t.bench === 'none' ? 'Send to the lab' : 'Start'}</Button>}
                    {st === 'in-lab' && (
                      <>
                        <span className="flex items-center gap-1.5 font-inter text-sm text-brown" role="status"><FlaskConical size={15} /> {t.labName}: {left}s</span>
                        <Button variant="secondary" className="px-3 py-1 text-xs text-obsidian" onClick={() => speedUp(t)} disabled={stars < 1} tooltip="Earn stars by searching rooms">
                          <Star size={12} className="mr-1" /> Speed up (1)
                        </Button>
                      </>
                    )}
                    {st === 'ready' && <Button variant="primary" className="px-4 py-1.5" onClick={() => collect(t)}>Read the report</Button>}
                    {st === 'done' && <button className="font-inter text-sm text-brown underline" onClick={() => setReport(t)}>Read the report again</button>}
                  </div>
                  {st === 'in-lab' && (
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(81,65,61,0.35)' }} aria-hidden="true">
                      <div className="h-full transition-all duration-1000" style={{ width: `${100 - (left / (t.labSeconds ?? 1)) * 100}%`, background: 'var(--verdigris)' }} />
                    </div>
                  )}
                </motion.li>
              )
            })}
          </ul>

          {/* The killer profile */}
          <aside className="rounded-sm p-5 border border-gold self-start" style={{ background: 'rgba(14,12,16,0.85)' }} aria-label="Killer profile">
            <p className="font-cinzel text-xs tracking-[0.25em] text-parchment-dark">KILLER PROFILE</p>
            <ul className="mt-3 space-y-2">
              {PROFILE_TRAITS.map((t) => {
                const known = traitKnown(t.id, state)
                return (
                  <li key={t.id} className="flex items-start gap-2">
                    {known ? <Check size={16} color="var(--verdigris)" className="mt-0.5 flex-shrink-0" /> : <HelpCircle size={16} color="var(--parchment-dark)" className="mt-0.5 flex-shrink-0" />}
                    <span className={`font-inter text-sm ${known ? 'text-parchment' : 'text-parchment-dark'}`}>{known ? t.text : 'Unknown'}</span>
                  </li>
                )
              })}
            </ul>
            <p className="font-cinzel text-xs tracking-[0.25em] text-parchment-dark mt-6">SUSPECTS</p>
            <ul className="mt-3 space-y-3">
              {matches.map((m) => {
                const w = CASE_001.witnesses.find((x) => x.id === m.id)!
                return (
                  <li key={m.id} className="flex items-center gap-3">
                    <img src={w.portrait} alt="" className="w-11 h-11 rounded-full object-cover object-top border" style={{ borderColor: m.fits ? 'var(--thread)' : 'var(--brown)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-cormorant font-semibold text-parchment text-lg leading-tight">{w.name}</p>
                        <span className="font-inter text-xs text-parchment-dark tabular-nums">{m.matches} / {m.known}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(81,65,61,0.5)' }}>
                        <motion.div className="h-full" style={{ background: m.fits ? 'var(--thread)' : 'var(--parchment-dark)' }} animate={{ width: `${m.known ? (m.matches / m.known) * 100 : 0}%` }} />
                      </div>
                      {m.fits && m.known >= 3 && <p className="font-inter text-xs mt-1" style={{ color: 'var(--thread)' }}>Fits every trait so far</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>
      </main>

      {/* The bench */}
      <AnimatePresence>
        {bench && (
          <motion.div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 40, background: 'rgba(14,12,16,0.85)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="dialog" aria-modal="true" aria-label={bench.name} className="w-full max-w-2xl space-y-4" initial={{ y: 30 }} animate={{ y: 0 }}>
              <div className="flex items-center justify-between">
                <h2 className="font-cormorant font-bold text-parchment text-2xl">{bench.name}</h2>
                <button onClick={() => setBench(null)} aria-label="Leave the bench" className="p-1"><X size={18} color="var(--parchment)" /></button>
              </div>
              <p className="font-inter text-base text-parchment-dark">{bench.instruction}</p>
              {bench.bench === 'dust' && (
                <BrushSurface
                  label="Dust the telephone"
                  stroke="rgba(185,169,140,0.28)"
                  onDone={() => benchDone(bench)}
                  base={<div className="w-full h-full flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, var(--brown), var(--ink))' }}><img src="/assets/evidence/telephone.png" alt="The telephone" className="w-4/5 object-contain" draggable={false} /></div>}
                  reveal={<><Fingerprint x={40} y={30} size={9} rotate={-20} /><Fingerprint x={58} y={70} size={11} rotate={12} /><Fingerprint x={66} y={66} size={6} rotate={30} /></>}
                />
              )}
              {bench.bench === 'rubbing' && (
                <BrushSurface
                  label="Rub the pencil over the page"
                  stroke="rgba(23,20,25,0.55)"
                  aspect="3 / 4"
                  onDone={() => benchDone(bench)}
                  base={<div className="w-full h-full" style={{ background: 'linear-gradient(160deg, var(--parchment-light), var(--parchment))' }} />}
                  reveal={<p className="absolute inset-[12%] font-caveat text-2xl leading-relaxed" style={{ color: 'var(--parchment-light)', textShadow: '0 0 1px var(--parchment-light)' }}>{bench.result}</p>}
                />
              )}
              {bench.bench === 'jigsaw' && <Jigsaw src="/assets/evidence/photo-family-torn.jpg" onDone={() => benchDone(bench)} />}
              {bench.bench === 'uv' && <UvSweep onDone={() => benchDone(bench)} />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* A finished report */}
      <AnimatePresence>
        {report && (
          <motion.div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 41, background: 'rgba(14,12,16,0.75)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { if (e.target === e.currentTarget) setReport(null) }}>
            <motion.div role="dialog" aria-modal="true" aria-label="Lab report" initial={{ y: 40, rotate: -2 }} animate={{ y: 0, rotate: 0 }} className="w-full max-w-lg">
              <ParchmentCard className="p-6 space-y-4 relative">
                <div className="absolute top-4 right-4 rotate-6"><Stamp label="ANALYSED" variant="solved" /></div>
                <p className="font-cinzel text-xs tracking-[0.25em] text-brown">{report.labName ? report.labName.toUpperCase() : 'BENCH NOTES'}</p>
                <h2 className="font-cormorant font-bold text-obsidian text-2xl pr-28">{report.name}</h2>
                {report.bench === 'jigsaw' && <img src="/assets/evidence/photo-strip.jpg" alt="The torn strip back in place" className="w-full rounded-sm" />}
                <p className={report.bench === 'rubbing' ? 'font-caveat text-2xl text-obsidian leading-snug' : 'font-cormorant text-lg text-obsidian leading-relaxed'}>{report.result}</p>
                <p className="font-inter text-sm text-brown">— Archivist Reed</p>
                <div className="flex justify-end"><Button variant="primary" onClick={() => setReport(null)}>File it</Button></div>
              </ParchmentCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
