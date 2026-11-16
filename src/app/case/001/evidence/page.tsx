'use client'

import { useEffect } from 'react'
import { ParchmentCard } from '@/components/ui'
import { TopBar } from '@/components/archive/TopBar'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { selectUnlockedSections, selectProgress, selectRank } from '@/store/selectors'
import { CASE_001 } from '@/data/case001'

export default function EvidenceBoardPage() {
  const hydrated = useHydrated()
  const state = useGameStore((s) => s)
  const { setLastRoute } = state

  useEffect(() => {
    setLastRoute('/case/001/evidence')
  }, [setLastRoute])

  if (!hydrated) return null

  const progress = selectProgress(state, CASE_001)
  const { rank, title: rankTitle } = selectRank(progress)
  const unlockedSections = selectUnlockedSections(state)

  return (
    <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
      <TopBar
        investigatorName={state.investigator.name}
        rankTitle={rankTitle}
        rankNumber={rank}
        unlockedSections={unlockedSections}
      />
      <main className="flex items-center justify-center min-h-[calc(100dvh-56px)] px-4">
        <ParchmentCard className="p-8 max-w-sm w-full text-center space-y-4">
          <h2 className="font-cormorant font-bold text-obsidian text-xl">
            Evidence Board
          </h2>
          <p className="font-caveat text-brown text-sm">
            Coming in Spec 04 — the evidence board, threads, contradictions
            and theory form will be built here.
          </p>
        </ParchmentCard>
      </main>
    </div>
  )
}
