'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { ParchmentCard } from '@/components/ui'
import { TopBar } from '@/components/archive/TopBar'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { selectUnlockedSections, selectProgress, selectRank } from '@/store/selectors'
import { CASE_001 } from '@/data/case001'

export default function WitnessPage() {
  const hydrated = useHydrated()
  const state = useGameStore((s) => s)
  const { setLastRoute } = state

  useEffect(() => {
    setLastRoute('/case/001/witnesses/margaret')
  }, [setLastRoute])

  if (!hydrated) return null

  const unlocked = selectUnlockedSections(state)
  const progress = selectProgress(state, CASE_001)
  const { rank, title: rankTitle } = selectRank(progress)

  return (
    <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
      <TopBar
        investigatorName={state.investigator.name}
        rankTitle={rankTitle}
        rankNumber={rank}
        unlockedSections={unlocked}
      />
      <main className="flex items-center justify-center min-h-[calc(100dvh-56px)] px-4">
        <ParchmentCard className="p-8 max-w-sm w-full text-center space-y-4">
          {!unlocked.witnesses ? (
            <>
              <Lock size={32} className="mx-auto text-brown opacity-60" />
              <h2 className="font-cormorant font-bold text-obsidian text-xl">
                Witness Interviews — Locked
              </h2>
              <p className="font-caveat text-brown text-sm leading-relaxed">
                You need at least 3 items from the Digital Archives before the
                witnesses will speak to you.
              </p>
              <Link href="/case/001/archive" className="font-inter text-xs text-gold underline">
                Open Digital Archives →
              </Link>
            </>
          ) : (
            <>
              <h2 className="font-cormorant font-bold text-obsidian text-xl">
                Witness Interrogation
              </h2>
              <p className="font-caveat text-brown text-sm">
                Coming in Spec 03 — AI witnesses will be wired up here.
              </p>
            </>
          )}
        </ParchmentCard>
      </main>
    </div>
  )
}
