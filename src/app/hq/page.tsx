'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, X, FolderOpen, Star } from 'lucide-react'
import { Button, ParchmentCard, CaseFolder, Stamp } from '@/components/ui'
import { TopBar } from '@/components/archive/TopBar'
import { RoomStage } from '@/components/room/RoomStage'
import { Hotspot } from '@/components/scene/Hotspot'
import { CaseAssignment } from '@/components/cinematic/CaseAssignment'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { selectProgress, selectRank, selectUnlockedSections } from '@/store/selectors'
import { CASE_001 } from '@/data/case001'
import { HQ_ROOM, HQ_OBJECTS, CASE_ARCHIVE, clockTime, type HqObject, type HqObjectId } from '@/data/hq'
import { audio } from '@/lib/audio/engine'
import { spring } from '@/lib/motion'
import type { SceneObject } from '@/types'

type Panel = 'desk' | 'archive' | 'note' | null

// Hotspot draws a SceneObject; the HQ objects only need its shape
const asSceneObject = (o: HqObject) => ({ ...o, description: o.hint, locationId: 'hq', yieldsEvidence: [], relatedCharacters: [], storyRelevance: '' }) as SceneObject

export default function HQPage() {
  const router = useRouter()
  const hydrated = useHydrated()
  const state = useGameStore((s) => s)
  const { investigator, collectedEvidence, contradictionsFlagged, witnessChats, verdict, ui, entity, seenCinematics } = state
  const markCinematicSeen = useGameStore((s) => s.markCinematicSeen)

  const [panel, setPanel] = useState<Panel>(null)
  const [note, setNote] = useState<{ title: string; text: string } | null>(null)
  const [cinematic, setCinematic] = useState(false)

  const assigned = (seenCinematics ?? []).includes('assignment')
  const ringing = hydrated && !assigned && !verdict && Boolean(investigator.name) && !cinematic

  // The telephone rings when a new case is waiting
  useEffect(() => {
    if (!ringing) return
    const t = setInterval(() => audio.sfx('phone-ring', 0.45), 4000)
    const first = setTimeout(() => audio.sfx('phone-ring', 0.45), 1200)
    return () => { clearInterval(t); clearTimeout(first) }
  }, [ringing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanel(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!hydrated) return null

  const progress = selectProgress(state, CASE_001)
  const { rank, title: rankTitle } = selectRank(progress)
  const unlockedSections = selectUnlockedSections(state)

  const keyEvidence = Object.entries(collectedEvidence)
    .sort(([, a], [, b]) => b.at - a.at)
    .slice(0, 6)
    .map(([id]) => CASE_001.evidence.find((e) => e.id === id)?.name ?? id)
  const evidenceCount = Object.keys(collectedEvidence).length
  const witnessesQuestioned = Object.values(witnessChats).filter((t) => t.length > 0).length
  const minutesPlayed = investigator.startedAt ? Math.floor((Date.now() - investigator.startedAt) / 60000) : 0

  const allowedRoutes = ['/case/001/scene', '/case/001/archive', '/case/001/witnesses', '/case/001/evidence', '/case/001/conclusion']
  const destination = ui.lastRoute && allowedRoutes.some((r) => ui.lastRoute.startsWith(r)) ? ui.lastRoute : '/case/001/scene'

  const openObject = (id: HqObjectId) => {
    switch (id) {
      case 'desk': audio.sfx('folder'); setPanel('desk'); break
      case 'cabinet': audio.sfx('drawer'); setPanel('archive'); break
      case 'wall': audio.sfx('whoosh', 0.6); router.push('/case/001/evidence'); break
      case 'telephone':
        if (!assigned) { audio.sfx('pickup'); setCinematic(true) }
        else { audio.sfx('pickup', 0.6); setNote({ title: 'Telephone', text: 'Only a low hiss on the line. Somewhere under it, very faintly, another phone is ringing.' }); setPanel('note') }
        break
      case 'clock':
        audio.sfx('drone', 0.5)
        setNote({ title: 'Grandfather Clock', text: `The hands read ${clockTime(entity.stage, Boolean(verdict))} It was 10:40 when you arrived.` })
        setPanel('note'); break
      case 'door':
        audio.sfx('drawer', 0.6); audio.sfx('stamp', 0.5)
        setNote({ title: 'Locked Door', text: 'The door will not move. A brass plate reads: CASE 002 — SEALED. Something on the other side knocks twice, then stops.' })
        setPanel('note'); break
    }
  }

  const endCinematic = (enter: boolean) => {
    markCinematicSeen('assignment')
    setCinematic(false)
    if (enter) router.push('/case/001/scene')
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-obsidian">
      <TopBar investigatorName={investigator.name} rankTitle={rankTitle} rankNumber={rank} unlockedSections={unlockedSections} />

      <RoomStage
        src={HQ_ROOM.src}
        fallbackSrc={HQ_ROOM.fallbackSrc}
        fallbackFilter="sepia(0.45) saturate(0.8) brightness(0.8) hue-rotate(-8deg)"
        alt="The investigation headquarters"
        ratio={HQ_ROOM.ratio}
        glows={HQ_ROOM.glows}
      >
        {HQ_OBJECTS.map((o) => (
          <div key={o.id}>
            <Hotspot object={asSceneObject(o)} state="undiscovered" onClick={() => openObject(o.id)} />
            {o.id === 'telephone' && ringing && (
              <motion.span
                aria-hidden="true"
                className="absolute rounded-full pointer-events-none"
                style={{ left: `${o.hotspot.x}%`, top: `${o.hotspot.y}%`, width: 70, height: 70, x: '-50%', y: '-50%', border: '2px solid var(--candle)' }}
                animate={{ scale: [1, 1.9], opacity: [0.9, 0] }}
                transition={{ repeat: Infinity, duration: 1.1 }}
              />
            )}
          </div>
        ))}
      </RoomStage>

      {/* Prompt for what to do next */}
      <div className="absolute left-0 right-0 flex justify-center pointer-events-none" style={{ top: 72, zIndex: 8 }}>
        <motion.p
          key={ringing ? 'ring' : 'idle'}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-cormorant italic text-parchment text-lg px-4 py-1 rounded"
          style={{ background: 'rgba(14,12,16,0.55)' }}
        >
          {ringing ? 'The telephone is ringing.' : verdict ? 'Case 001 is closed. The house is quiet.' : 'The case file is on your desk.'}
        </motion.p>
      </div>

      {/* Always-available way back into the case */}
      <div className="absolute left-4 flex items-center gap-3" style={{ bottom: 20, zIndex: 8 }}>
        <Button variant="primary" onClick={() => router.push(destination)} className="px-6 py-2.5">
          {investigator.name ? 'Continue Investigation' : 'Begin Investigation'}
        </Button>
        <span className="font-inter text-xs text-parchment-dark px-2 py-1 rounded" style={{ background: 'rgba(14,12,16,0.6)' }}>
          Case 001 · {progress}%
        </span>
        {verdict && <Stamp label="SOLVED" variant="solved" />}
      </div>

      {/* ── Panels ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {panel && (
          <motion.div
            key="scrim"
            className="fixed inset-0"
            style={{ zIndex: 25, background: 'rgba(14,12,16,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPanel(null)}
          />
        )}

        {panel === 'desk' && (
          <motion.div
            key="desk"
            role="dialog"
            aria-label="Case file"
            className="fixed inset-x-4 top-20 bottom-6 md:inset-x-auto md:left-1/2 md:w-[880px] md:-ml-[440px] overflow-y-auto"
            style={{ zIndex: 26 }}
            initial={{ y: 80, opacity: 0, rotate: -2 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 60, opacity: 0 }}
            transition={spring.panel}
          >
            <div className="flex flex-col lg:flex-row gap-6 p-2">
              <div className="flex-1 space-y-5">
                <CaseFolder caseNumber="CASE 001" title="The House That Calls Back" teaser={CASE_001.truth.caseTeaser} status={verdict ? 'solved' : 'unresolved'} progress={progress} />
                <ParchmentCard className="p-5">
                  <h3 className="font-cormorant font-semibold text-obsidian text-lg mb-4">Investigator Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Stat label="Evidence found" value={evidenceCount} />
                    <Stat label="Contradictions flagged" value={contradictionsFlagged.length} />
                    <Stat label="Witnesses questioned" value={witnessesQuestioned} />
                    <Stat label="Time played" value={`${minutesPlayed}m`} />
                  </div>
                </ParchmentCard>
              </div>
              <div className="lg:w-72 space-y-5">
                <ParchmentCard className="p-5">
                  <h3 className="font-cormorant font-semibold text-obsidian text-lg mb-3">Key Evidence</h3>
                  {keyEvidence.length === 0 ? (
                    <p className="font-caveat text-brown text-base">Nothing recovered yet</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {keyEvidence.map((n, i) => (
                        <li key={i} className="font-inter text-xs text-brown flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--gold)' }} />{n}
                        </li>
                      ))}
                    </ul>
                  )}
                </ParchmentCard>
                <div className="flex flex-col gap-2">
                  <Button variant="primary" onClick={() => router.push(destination)}>Continue Investigation</Button>
                  <Button variant="secondary" onClick={() => { setPanel(null); setCinematic(true) }}>Replay the briefing</Button>
                  <Button variant="ghost" onClick={() => setPanel(null)}>Close the file</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {panel === 'archive' && (
          <motion.div
            key="archive"
            role="dialog"
            aria-label="Case archive"
            className="fixed inset-x-4 top-20 bottom-6 md:inset-x-auto md:left-1/2 md:w-[900px] md:-ml-[450px] overflow-y-auto rounded-lg p-6 border border-gold"
            style={{ zIndex: 26, background: 'linear-gradient(160deg, rgba(81,65,61,0.97), rgba(23,20,25,0.98))' }}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={spring.panel}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-cinzel text-xs tracking-[0.3em] text-parchment-dark">THE ARCHIVE</p>
                <h2 className="font-cormorant font-bold text-parchment text-3xl">Case Files</h2>
              </div>
              <button aria-label="Close the archive" onClick={() => setPanel(null)} className="p-2"><X size={20} color="var(--parchment)" /></button>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {CASE_ARCHIVE.map((c, i) => (
                <motion.div
                  key={c.number}
                  initial={{ opacity: 0, y: 30, rotate: (i - 1) * 2 }}
                  animate={{ opacity: 1, y: 0, rotate: (i - 1) * 1.2 }}
                  transition={{ delay: 0.1 + i * 0.12, ...spring.card }}
                  whileHover={c.playable ? { y: -8, rotate: 0 } : undefined}
                  className="relative rounded-sm p-5 pt-8"
                  style={{
                    background: 'linear-gradient(160deg, var(--parchment-light), var(--parchment-dark))',
                    boxShadow: '0 14px 30px rgba(0,0,0,0.5)',
                    filter: c.playable ? undefined : 'grayscale(0.7) brightness(0.7)',
                  }}
                >
                  <span className="absolute -top-3 left-5 px-3 py-1 rounded-t font-cinzel text-[10px] tracking-[0.2em]" style={{ background: 'var(--parchment-dark)', color: 'var(--obsidian)' }}>
                    {c.number}
                  </span>
                  <h3 className="font-cormorant font-bold text-obsidian text-xl leading-tight">{c.title}</h3>
                  <p className="font-inter text-xs text-brown mt-1">{c.location} · {c.date}</p>
                  <p className="font-inter text-xs text-brown">{c.classification}</p>
                  <div className="flex gap-0.5 my-2" aria-label={`Difficulty ${c.difficulty} of 5`}>
                    {Array.from({ length: 5 }, (_, s) => <Star key={s} size={12} color="var(--brown)" fill={s < c.difficulty ? 'var(--brown)' : 'none'} />)}
                  </div>
                  <p className="font-cormorant text-obsidian text-base leading-snug min-h-12">{c.summary}</p>
                  <div className="mt-4 flex items-center justify-between">
                    {c.playable ? (
                      <>
                        <Stamp label={verdict ? 'SOLVED' : 'OPEN'} variant={verdict ? 'solved' : 'unresolved'} />
                        <Button variant="primary" onClick={() => { setPanel(null); if (!assigned) setCinematic(true); else setPanel('desk') }}>
                          <FolderOpen size={14} className="mr-2" />Open
                        </Button>
                      </>
                    ) : (
                      <span className="flex items-center gap-2 font-inter text-xs text-brown"><Lock size={14} /> Sealed</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {panel === 'note' && note && (
          <motion.div
            key="note"
            role="dialog"
            aria-label={note.title}
            className="fixed left-1/2 top-1/2 w-[min(440px,90vw)] -translate-x-1/2 -translate-y-1/2"
            style={{ zIndex: 26 }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={spring.panel}
          >
            <ParchmentCard className="p-6 space-y-3">
              <h3 className="font-cormorant font-bold text-obsidian text-2xl">{note.title}</h3>
              <p className="font-cormorant text-obsidian text-lg leading-relaxed">{note.text}</p>
              <Button variant="secondary" onClick={() => setPanel(null)}>Close</Button>
            </ParchmentCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cinematic && (
          <CaseAssignment
            investigatorName={investigator.name}
            onEnter={() => endCinematic(true)}
            onSkip={() => endCinematic(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-inter text-xs text-brown uppercase tracking-wide">{label}</p>
      <p className="font-inter font-semibold text-obsidian text-xl tabular-nums">{value}</p>
    </div>
  )
}
