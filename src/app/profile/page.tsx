'use client'

import { motion } from 'framer-motion'
import { Award, Lock } from 'lucide-react'
import { ParchmentCard, Stamp, ProgressBar } from '@/components/ui'
import { TopBar } from '@/components/archive/TopBar'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { selectProgress, selectRank, selectUnlockedSections } from '@/store/selectors'
import { ACHIEVEMENTS, thoroughness, OPTIONAL_TOTAL } from '@/data/achievements'
import { CASE_001 } from '@/data/case001'
import { spring } from '@/lib/motion'

export default function ProfilePage() {
  const hydrated = useHydrated()
  const state = useGameStore((s) => s)
  if (!hydrated) return null

  const progress = selectProgress(state, CASE_001)
  // Rank follows the best closed case; until then, the investigation in progress
  const { rank, title } = selectRank(state.verdict?.score ?? progress)
  const earned = new Set(state.achievements ?? [])
  const minutes = state.investigator.startedAt ? Math.floor((Date.now() - state.investigator.startedAt) / 60000) : 0

  return (
    <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
      <TopBar investigatorName={state.investigator.name} rankTitle={title} rankNumber={rank} unlockedSections={selectUnlockedSections(state)} />
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="font-cinzel text-xs tracking-[0.35em] text-parchment-dark">INVESTIGATOR FILE</p>
          <h1 className="font-cormorant font-bold text-parchment text-4xl">{state.investigator.name || 'Unnamed investigator'}</h1>
          <p className="font-inter text-sm text-parchment-dark">Rank {rank} · {title}</p>
        </motion.header>

        <div className="grid md:grid-cols-3 gap-5">
          <ParchmentCard tilt={-0.6} className="p-5 md:col-span-2 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-cinzel text-xs tracking-[0.25em] text-brown">CASE 001</p>
                <h2 className="font-cormorant font-bold text-obsidian text-2xl">The House That Calls Back</h2>
              </div>
              <Stamp label={state.verdict ? 'SOLVED' : 'OPEN'} variant={state.verdict ? 'solved' : 'unresolved'} />
            </div>
            <ProgressBar value={progress} label={`Investigation ${progress}%`} />
            <dl className="grid grid-cols-2 gap-3 font-inter text-sm text-brown">
              <div><dt className="text-xs uppercase tracking-wide">Final score</dt><dd className="text-obsidian font-semibold text-lg tabular-nums">{state.verdict ? `${state.verdict.score} / 100` : '—'}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide">Hidden details</dt><dd className="text-obsidian font-semibold text-lg tabular-nums">{thoroughness(state)} / {OPTIONAL_TOTAL}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide">Evidence</dt><dd className="text-obsidian font-semibold text-lg tabular-nums">{Object.keys(state.collectedEvidence).length}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide">Time in the field</dt><dd className="text-obsidian font-semibold text-lg tabular-nums">{minutes}m</dd></div>
            </dl>
          </ParchmentCard>
          <ParchmentCard tilt={0.8} className="p-5 space-y-2 opacity-70">
            <p className="font-cinzel text-xs tracking-[0.25em] text-brown">CASE 002</p>
            <h2 className="font-cormorant font-bold text-obsidian text-xl">The Drowned Choir</h2>
            <p className="font-inter text-xs text-brown flex items-center gap-1"><Lock size={12} /> Sealed by the Archive</p>
          </ParchmentCard>
        </div>

        <section>
          <h2 className="font-cormorant font-bold text-parchment text-2xl mb-4">Commendations <span className="font-inter text-sm text-parchment-dark">({earned.size} / {ACHIEVEMENTS.length})</span></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACHIEVEMENTS.map((a, i) => {
              const got = earned.has(a.id)
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, ...spring.card }}
                  className="flex items-start gap-3 p-4 rounded border"
                  style={{
                    borderColor: got ? 'var(--gold)' : 'var(--brown)',
                    background: got ? 'rgba(165,138,96,0.12)' : 'rgba(14,12,16,0.5)',
                    opacity: got ? 1 : 0.6,
                  }}
                >
                  {got ? <Award size={22} color="var(--candle)" className="flex-shrink-0" /> : <Lock size={20} color="var(--parchment-dark)" className="flex-shrink-0" />}
                  <div>
                    <p className="font-cormorant font-bold text-parchment text-lg leading-tight">{a.title}</p>
                    <p className="font-inter text-xs text-parchment-dark">{a.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
