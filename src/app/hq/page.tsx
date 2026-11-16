'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import { Button, ArchiveFrame, ParchmentCard, CaseFolder } from '@/components/ui'
import { TopBar } from '@/components/archive/TopBar'
import { NotificationTray } from '@/components/entity/NotificationTray'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { selectProgress, selectRank } from '@/store/selectors'
import { CASE_001 } from '@/data/case001'

// ── Candle SVG with flicker ───────────────────────────────────────────────

function Candle() {
  return (
    <svg
      viewBox="0 0 24 48"
      className="w-6 h-12"
      aria-hidden="true"
      style={{ animation: 'flicker 2s ease-in-out infinite' }}
    >
      {/* flame */}
      <path
        d="M12 2 C12 2 15 7 15 11 C15 14.3 13.7 16 12 16 C10.3 16 9 14.3 9 11 C9 7 12 2 12 2Z"
        fill="var(--candle)"
        opacity="0.9"
      />
      {/* wick */}
      <line x1="12" y1="16" x2="12" y2="20" stroke="var(--parchment-dark)" strokeWidth="1" />
      {/* body */}
      <rect x="10" y="20" width="4" height="24" rx="1" fill="var(--parchment-dark)" />
      {/* base */}
      <rect x="8" y="43" width="8" height="3" rx="1" fill="var(--brown)" />
    </svg>
  )
}

// ── HQ page ────────────────────────────────────────────────────────────────

export default function HQPage() {
  const router = useRouter()
  const hydrated = useHydrated()

  const state = useGameStore((s) => s)
  const {
    investigator,
    collectedEvidence,
    contradictionsFlagged,
    witnessChats,
    entity,
    verdict,
    ui,
  } = state

  if (!hydrated) return null

  const progress = selectProgress(state, CASE_001)
  const { rank, title: rankTitle } = selectRank(progress)

  // Key evidence — most recent 6, by collection timestamp
  const keyEvidence = Object.entries(collectedEvidence)
    .sort(([, a], [, b]) => b.at - a.at)
    .slice(0, 6)
    .map(([id]) => CASE_001.evidence.find((e) => e.id === id)?.name ?? id)

  // Stats
  const evidenceCount = Object.keys(collectedEvidence).length
  const contradictionCount = contradictionsFlagged.length
  const witnessesQuestioned = Object.values(witnessChats).filter(
    (turns) => turns.length > 0
  ).length
  const minutesPlayed = investigator.startedAt
    ? Math.floor((Date.now() - investigator.startedAt) / 60000)
    : 0

  // Continue destination
  const allowedRoutes = [
    '/case/001/scene',
    '/case/001/archive',
    '/case/001/witnesses',
    '/case/001/evidence',
  ]
  const destination =
    ui.lastRoute && allowedRoutes.some((r) => ui.lastRoute.startsWith(r))
      ? ui.lastRoute
      : '/case/001/scene'

  const handleContinue = () => {
    router.push(destination)
  }

  const isFirstPlay = !investigator.name

  return (
    <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
      <TopBar
        investigatorName={investigator.name}
        rankTitle={rankTitle}
        rankNumber={rank}
      />

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8">
        {/* ── Left column ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-8">
          <CaseFolder
            caseNumber="CASE 001"
            title="The House That Calls Back"
            teaser={CASE_001.truth.caseTeaser}
            status={verdict ? 'solved' : 'unresolved'}
            progress={progress}
          />

          {/* Stats grid */}
          <ParchmentCard className="p-5">
            <h3 className="font-cormorant font-semibold text-obsidian text-lg mb-4">
              Investigator Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Evidence found" value={evidenceCount} />
              <Stat label="Contradictions flagged" value={contradictionCount} />
              <Stat label="Witnesses questioned" value={witnessesQuestioned} />
              <Stat label="Time played" value={`${minutesPlayed}m`} />
            </div>
          </ParchmentCard>

          <Button
            variant="primary"
            onClick={handleContinue}
            className="self-start px-8 py-3 text-base"
          >
            {isFirstPlay ? 'Begin Investigation' : 'Continue Investigation'}
          </Button>
        </div>

        {/* ── Right column ─────────────────────────────────────────── */}
        <div className="lg:w-80 flex flex-col gap-6">
          {/* House photo */}
          <ArchiveFrame className="overflow-hidden rounded-sm">
            <div className="relative w-full aspect-[4/3] bg-ink">
              <Image
                src="/assets/scene/study-scene.png"
                alt="Ashworth House"
                fill
                className="object-cover"
              />
            </div>
          </ArchiveFrame>

          {/* Key Evidence panel */}
          <ParchmentCard className="p-5">
            <h3 className="font-cormorant font-semibold text-obsidian text-lg mb-3">
              Key Evidence
            </h3>
            {keyEvidence.length === 0 ? (
              <p className="font-caveat text-brown text-sm italic">
                Nothing recovered yet
              </p>
            ) : (
              <ul className="space-y-1.5">
                {keyEvidence.map((name, i) => (
                  <li
                    key={i}
                    className="font-inter text-xs text-brown flex items-center gap-2"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--gold)' }}
                    />
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </ParchmentCard>

          {/* Coming soon card */}
          <ParchmentCard className="p-5 opacity-50">
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-brown flex-shrink-0" />
              <div>
                <p className="font-cinzel text-xs tracking-widest text-brown uppercase">
                  Case 002
                </p>
                <p className="font-inter text-xs text-brown mt-0.5">
                  Coming Soon
                </p>
              </div>
            </div>
          </ParchmentCard>
        </div>
      </main>

      {/* Candle decoration */}
      <div className="fixed bottom-10 left-8 opacity-70 pointer-events-none" aria-hidden="true">
        <Candle />
      </div>

      {/* Entity notification tray */}
      <NotificationTray messages={entity.messages} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-inter text-xs text-brown uppercase tracking-wide">{label}</p>
      <p className="font-cormorant font-semibold text-obsidian text-xl">{value}</p>
    </div>
  )
}
