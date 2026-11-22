'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import { ParchmentCard } from '@/components/ui'
import { TopBar } from '@/components/archive/TopBar'
import { DeviceFrame } from '@/components/digital/DeviceFrame'
import { RecordWrapper } from '@/components/digital/RecordWrapper'
import { LaptopLock, VoicemailRestore, PhotoEnhance } from '@/components/digital/DevicePuzzles'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { selectUnlockedSections, selectProgress, selectRank } from '@/store/selectors'
import { evaluateCondition } from '@/lib/engine/conditions'
import { evaluateEntityRules, dispatchEntityActions } from '@/lib/entity'
import { audio } from '@/lib/audio/engine'
import { useFxStore } from '@/store/fxStore'
import { CASE_001 } from '@/data/case001'
import type { DigitalRecord } from '@/types'

type DeviceTab = 'mobile' | 'laptop' | 'telco'

const TAB_LABELS: Record<DeviceTab, string> = {
  mobile: "Edmund's Mobile",
  laptop: "Clara's Laptop",
  telco: 'Telephone Records',
}

export default function ArchivePage() {
  const hydrated = useHydrated()
  const state = useGameStore((s) => s)
  const {
    collectedEvidence,
    recoveredRecords,
    setLastRoute,
    recoverRecord,
    collectEvidence,
    addAttention,
    unlockDevice,
  } = state
  const deviceUnlocks = state.deviceUnlocks ?? []
  // Saves from before the lock screen existed may already hold laptop evidence
  const laptopOpen = deviceUnlocks.includes('laptop') || Boolean(collectedEvidence['EV-12'] || collectedEvidence['EV-13'])

  const [activeTab, setActiveTab] = useState<DeviceTab>('telco')

  useEffect(() => {
    setLastRoute('/case/001/archive')
  }, [setLastRoute])

  if (!hydrated) return null

  const unlocked = selectUnlockedSections(state)
  const progress = selectProgress(state, CASE_001)
  const { rank, title: rankTitle } = selectRank(progress)

  // ── Locked state ─────────────────────────────────────────────────────────
  if (!unlocked.archive) {
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
            <Lock size={32} className="mx-auto text-brown opacity-60" />
            <h2 className="font-cormorant font-bold text-obsidian text-xl">
              Digital Archives — Locked
            </h2>
            <p className="font-caveat text-brown text-sm leading-relaxed whitespace-pre-line">
              {'You need:\n· Rotary Telephone (EV-01)\n  — inspect the telephone in the study.\n\n· Final Night Recording (EV-07)\n  — inspect the study recorder.'}
            </p>
            <Link
              href="/case/001/scene"
              className="font-inter text-xs text-gold underline hover:text-parchment"
            >
              Return to the scene →
            </Link>
          </ParchmentCard>
        </main>
      </div>
    )
  }

  // ── Records for the active tab ────────────────────────────────────────────
  const deviceRecords: Record<DeviceTab, DigitalRecord[]> = {
    telco: CASE_001.digital.filter((r) => r.device === 'telco'),
    mobile: CASE_001.digital.filter((r) => r.device === 'mobile'),
    laptop: CASE_001.digital.filter((r) => r.device === 'laptop'),
  }

  const handleRecover = (record: DigitalRecord) => {
    if (record.deleted) audio.sfx('static', 0.8)
    recoverRecord(record.id)
    if (record.yieldsEvidence && !useGameStore.getState().collectedEvidence[record.yieldsEvidence]) {
      collectEvidence(record.yieldsEvidence)
      const ev = CASE_001.evidence.find((e) => e.id === record.yieldsEvidence)
      // Attention table (§9.10): core +6, supporting +3; red herrings do not interest her
      if (ev && (ev.relevance === 'core' || ev.relevance === 'supporting')) addAttention(ev.relevance === 'core' ? 6 : 3)
      setTimeout(() => audio.sfx(ev?.relevance === 'core' ? 'sting' : 'chime', 0.8), record.deleted ? 450 : 0)
      useFxStore.getState().fly(record.yieldsEvidence, { x: window.innerWidth / 2, y: window.innerHeight / 2 })
      const s = useGameStore.getState()
      dispatchEntityActions(
        evaluateEntityRules(s, { type: 'evidenceCollected', ref: record.yieldsEvidence }, CASE_001),
        s,
        s.investigator.name
      )
    }
  }

  return (
    <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
      <TopBar
        investigatorName={state.investigator.name}
        rankTitle={rankTitle}
        rankNumber={rank}
        unlockedSections={unlocked}
      />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/hq"
          className="inline-flex items-center gap-2 font-inter text-xs text-parchment-dark hover:text-parchment mb-6"
        >
          <ArrowLeft size={14} />
          Back to HQ
        </Link>

        <h1 className="font-cormorant font-bold text-parchment text-2xl mb-6">
          Digital Archives
        </h1>

        {/* Device tabs */}
        <div className="flex gap-1 mb-6 border-b border-gold pb-0">
          {(Object.keys(TAB_LABELS) as DeviceTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="font-inter text-xs px-4 py-2 cursor-pointer transition-colors"
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab ? 'var(--parchment)' : 'var(--parchment-dark)',
                borderBottom: activeTab === tab ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Device frame + records */}
        <DeviceFrame device={activeTab} className="max-w-lg mx-auto">
          {activeTab === 'laptop' && !laptopOpen ? (
            <LaptopLock onUnlock={() => unlockDevice('laptop')} hasDiary={Boolean(collectedEvidence['EV-03'])} />
          ) : (
            <div className="space-y-4">
              {deviceRecords[activeTab].map((record) => {
                const isRecovered = recoveredRecords.includes(record.id)
                const conditionMet = record.recoveryCondition
                  ? evaluateCondition(record.recoveryCondition, state)
                  : true
                const isCollected = Boolean(record.yieldsEvidence && collectedEvidence[record.yieldsEvidence])

                // Damaged audio is rebuilt by scrubbing the tape
                if (record.id === 'DR-voicemail' && !isRecovered && conditionMet) {
                  return <VoicemailRestore key={record.id} record={record} onRestored={() => handleRecover(record)} />
                }
                // The photo is enhanced until the car can be identified, then logged
                if (record.id === 'DR-photo' && !isCollected && !deviceUnlocks.includes('photo-enhanced')) {
                  return <PhotoEnhance key={record.id} record={record} onEnhanced={() => unlockDevice('photo-enhanced')} />
                }

                return (
                  <RecordWrapper
                    key={record.id}
                    record={record}
                    isRecovered={isRecovered}
                    conditionMet={conditionMet}
                    isCollected={Boolean(record.yieldsEvidence && collectedEvidence[record.yieldsEvidence])}
                    onRecover={() => handleRecover(record)}
                  />
                )
              })}
            </div>
          )}
        </DeviceFrame>
      </main>
    </div>
  )
}
