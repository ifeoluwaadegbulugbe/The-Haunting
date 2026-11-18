'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { ParchmentCard, Button } from '@/components/ui'
import { TopBar } from '@/components/archive/TopBar'
import { RevealSequence } from '@/components/conclusion/RevealSequence'
import { ReportCard } from '@/components/conclusion/ReportCard'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { selectUnlockedSections, selectProgress, selectRank } from '@/store/selectors'
import { scoreTheory } from '@/lib/scoring'
import { evaluateEntityRules, dispatchEntityActions } from '@/lib/entity'
import { CASE_001 } from '@/data/case001'

type Phase = 'submission' | 'reveal' | 'report'

export default function ConclusionPage() {
  const router = useRouter()
  const hydrated = useHydrated()
  const state = useGameStore((s) => s)
  const { theory, verdict, setLastRoute, setVerdict, plantEvidence, collectedEvidence, resetStore } = state

  const [phase, setPhase] = useState<Phase>(verdict ? 'report' : 'submission')
  const [narration, setNarration] = useState<string>(CASE_001.truth.revealNarrationFallback)

  useEffect(() => { setLastRoute('/case/001/conclusion') }, [setLastRoute])

  // ER-06b fail-safe: plant EV-X1 whenever the Conclusion is opened without it
  useEffect(() => {
    if (!hydrated || collectedEvidence['EV-X1']) return
    const s = useGameStore.getState()
    const actions = evaluateEntityRules(s, { type: 'conclusionOpened' }, CASE_001)
    dispatchEntityActions(actions, s, s.investigator.name)
    // Belt and braces: the false lead must always exist so it can be disproved
    if (!useGameStore.getState().collectedEvidence['EV-X1']) plantEvidence('EV-X1')
  }, [hydrated, collectedEvidence, plantEvidence])

  // Optional AI narration of the (already scored) result; the static text stays on any failure
  useEffect(() => {
    if (phase !== 'report' || !verdict) return
    let cancelled = false
    fetch('/api/verdict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: verdict.score, breakdown: verdict.breakdown }),
    })
      .then((r) => r.json())
      .then((d: { narration?: string }) => { if (!cancelled && d.narration) setNarration(d.narration) })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [phase, verdict])

  const result = useMemo(
    () => (theory ? scoreTheory(theory, state, CASE_001) : null),
    [theory, state]
  )

  if (!hydrated) return null

  const unlocked = selectUnlockedSections(state)
  const progress = selectProgress(state, CASE_001)
  const { rank, title: rankTitle } = selectRank(progress)

  const topBar = (
    <TopBar
      investigatorName={state.investigator.name}
      rankTitle={rankTitle}
      rankNumber={rank}
      unlockedSections={unlocked}
    />
  )

  // Locked: show the three requirements
  if (!unlocked.conclusion && !verdict) {
    return (
      <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
        {topBar}
        <main className="flex items-center justify-center min-h-[calc(100dvh-56px)] px-4">
          <ParchmentCard className="p-8 max-w-sm w-full text-center space-y-4">
            <Lock size={32} className="mx-auto text-brown opacity-60" />
            <h2 className="font-cormorant font-bold text-obsidian text-xl">Case Conclusion — Locked</h2>
            <p className="font-caveat text-brown text-sm">You need all three before submitting your theory:</p>
            <ul className="font-caveat text-brown text-sm text-left space-y-1">
              <li>· At least 10 pieces of evidence</li>
              <li>· At least 3 confirmed contradictions</li>
              <li>· At least 6 witness facts revealed</li>
            </ul>
            <Link href="/case/001/evidence" className="font-inter text-xs text-gold underline">
              Return to Evidence Board →
            </Link>
          </ParchmentCard>
        </main>
      </div>
    )
  }

  // No theory yet: send the player to the form
  if (!theory) {
    return (
      <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
        {topBar}
        <main className="flex items-center justify-center min-h-[calc(100dvh-56px)] px-4">
          <ParchmentCard className="p-8 max-w-sm w-full text-center space-y-4">
            <h2 className="font-cormorant font-bold text-obsidian text-xl">Ready to conclude?</h2>
            <p className="font-caveat text-brown text-sm">Record your theory on the Evidence Board first.</p>
            <Button variant="primary" onClick={() => router.push('/case/001/evidence')}>
              Open Theories
            </Button>
          </ParchmentCard>
        </main>
      </div>
    )
  }

  const startReveal = () => {
    if (result) {
      setVerdict({
        score: result.score,
        breakdown: { ...result.breakdown },
        rank: result.rank,
      })
    }
    setPhase('reveal')
  }

  if (phase === 'reveal') {
    return <RevealSequence theorySummary={theory.summary} onComplete={() => setPhase('report')} />
  }

  if (phase === 'report' && result) {
    return (
      <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
        {topBar}
        <main className="flex items-center justify-center py-10 px-4">
          <ReportCard
            result={result}
            narration={narration}
            onReplay={() => { resetStore(); router.push('/') }}
            onHQ={() => router.push('/hq')}
          />
        </main>
      </div>
    )
  }

  // Submission phase
  return (
    <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
      {topBar}
      <main className="flex items-center justify-center min-h-[calc(100dvh-56px)] px-4">
        <ParchmentCard className="p-8 max-w-md w-full space-y-4">
          <h2 className="font-cormorant font-bold text-obsidian text-2xl text-center">Your Theory</h2>
          <dl className="font-inter text-sm text-brown space-y-2">
            <div><dt className="font-medium">Culprit</dt><dd>{theory.culprit}</dd></div>
            <div><dt className="font-medium">What happened</dt><dd>{theory.whatHappened}</dd></div>
            <div><dt className="font-medium">Why the calls continue</dt><dd>{theory.whyCallsContinue}</dd></div>
          </dl>
          <Button variant="primary" onClick={startReveal} className="w-full py-3">
            Reveal the Truth
          </Button>
        </ParchmentCard>
      </main>
    </div>
  )
}
