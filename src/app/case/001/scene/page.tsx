'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Hotspot } from '@/components/scene/Hotspot'
import { ObjectPanel } from '@/components/scene/ObjectPanel'
import { EvidenceTray } from '@/components/scene/EvidenceTray'
import { EntityOverlay } from '@/components/entity/EntityOverlay'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { evaluateCondition, conditionMessage } from '@/lib/engine/conditions'
import { evaluateEntityRules, dispatchEntityActions } from '@/lib/entity'
import { playSound } from '@/lib/audio'
import { CASE_001 } from '@/data/case001'
import type { SceneObject } from '@/types'
import type { HotspotState } from '@/components/scene/Hotspot'

export default function ScenePage() {
  const hydrated = useHydrated()

  const state = useGameStore((s) => s)
  const {
    inspectedObjects,
    collectedEvidence,
    contradictionsFlagged,
    entity,
    investigator,
    setLastRoute,
    discoverObject,
    inspectObject,
    collectEvidence,
    addAttention,
    addEntityMessage,
    disturbEvidence,
    plantEvidence,
    lockObject,
    unlockObject,
    expireLocks,
    reverifyEvidence,
    fireRule,
  } = state

  const [selectedObject, setSelectedObject] = useState<SceneObject | null>(null)
  const [showPhoneOverlay, setShowPhoneOverlay] = useState(false)
  const [entityOverlayText, setEntityOverlayText] = useState<string | null>(null)
  const [lockNotice, setLockNotice] = useState<string | null>(null)

  useEffect(() => {
    setLastRoute('/case/001/scene')
  }, [setLastRoute])

  // Entity lockouts end after their time or after two more inspections
  useEffect(() => {
    expireLocks()
    const t = setInterval(() => expireLocks(), 5000)
    return () => clearInterval(t)
  }, [expireLocks])

  // Handle keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedObject(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const getHotspotState = useCallback(
    (obj: SceneObject): HotspotState => {
      if (entity.disturbed.includes(obj.id) || entity.lockedObjects.includes(obj.id)) return 'disturbed'
      if (inspectedObjects.includes(obj.id)) return 'inspected'
      if (obj.discoveryCondition && !evaluateCondition(obj.discoveryCondition, state)) {
        return 'locked'
      }
      return 'undiscovered'
    },
    [entity.disturbed, entity.lockedObjects, inspectedObjects, state]
  )

  const handleHotspotClick = (obj: SceneObject) => {
    const hs = getHotspotState(obj)
    if (hs === 'locked') return
    if (entity.lockedObjects.includes(obj.id)) {
      setLockNotice('Something is holding it shut. Try again shortly, or look elsewhere first.')
      setTimeout(() => setLockNotice(null), 3500)
      return
    }
    setSelectedObject(obj)
  }

  const handleInspect = (obj: SceneObject) => {
    // ER-01: telephone first inspection
    if (obj.id === 'OBJ-telephone' && !entity.firedRules.includes('ER-01')) {
      fireRule('ER-01')
      playSound('phone-ring', useGameStore.getState().ui.muted)
      setShowPhoneOverlay(true)
      // Collect after overlay dismisses (handled in onDismiss)
      return
    }
    doCollect(obj)
  }

  const dispatchStore = {
    addEntityMessage, disturbEvidence, plantEvidence,
    lockObject, unlockObject, fireRule, addAttention,
  }

  const doCollect = (obj: SceneObject) => {
    discoverObject(obj.id)
    inspectObject(obj.id)
    // Add attention for inspecting
    addAttention(2)

    for (const evId of obj.yieldsEvidence) {
      if (!collectedEvidence[evId]) {
        collectEvidence(evId)
        const ev = CASE_001.evidence.find((e) => e.id === evId)
        if (ev) {
          addAttention(ev.relevance === 'core' ? 6 : 3)
          // Fire entity rules for evidence collected
          const currentState = useGameStore.getState()
          const actions = evaluateEntityRules(
            currentState,
            { type: 'evidenceCollected', ref: evId },
            CASE_001
          )
          dispatchEntityActions(actions, dispatchStore, investigator.name, (line) => {
            playSound('heartbeat', useGameStore.getState().ui.muted)
            setEntityOverlayText(line)
          })
        }
      }
    }

    expireLocks()
    setSelectedObject(null)
  }

  const handleOverlayDismiss = () => {
    setShowPhoneOverlay(false)
    // Now collect the telephone evidence
    const telephoneObj = CASE_001.scene.find((o) => o.id === 'OBJ-telephone')
    if (telephoneObj) doCollect(telephoneObj)
  }

  if (!hydrated) return null

  const collectedIds = Object.keys(collectedEvidence)

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-obsidian">
      {/* Scene background */}
      <Image
        src="/assets/scene/study-scene.jpg"
        alt="Ashworth House study"
        fill
        priority
        className="object-cover object-center"
        style={{ zIndex: 1 }}
      />

      {/* Dark overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          zIndex: 2,
          background: 'linear-gradient(to top, rgba(14,12,16,0.5) 0%, rgba(14,12,16,0.1) 60%)',
        }}
      />

      {/* Top bar */}
      <div
        className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3"
        style={{ zIndex: 10 }}
      >
        <Link
          href="/hq"
          className="flex items-center gap-2 font-inter text-xs text-parchment-dark hover:text-parchment transition-colors"
        >
          <ArrowLeft size={16} />
          Back to HQ
        </Link>
        <span className="font-cinzel text-xs tracking-widest text-parchment-dark uppercase">
          Explore the Scene
        </span>
        <button
          onClick={() => setSelectedObject(null)}
          aria-label="Close panel"
          className="font-inter text-xs text-parchment-dark hover:text-parchment transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {selectedObject ? '✕' : ''}
        </button>
      </div>

      {/* Hotspots */}
      <div className="absolute inset-0" style={{ zIndex: 5 }}>
        {CASE_001.scene.map((obj) => {
          const hs = getHotspotState(obj)
          return (
            <Hotspot
              key={obj.id}
              object={obj}
              state={hs}
              onClick={() => handleHotspotClick(obj)}
              lockedMessage={conditionMessage(obj.id)}
            />
          )
        })}
      </div>

      {/* Object panel */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
        <div className="pointer-events-auto h-full">
          <ObjectPanel
            object={selectedObject}
            collectedEvidenceIds={collectedIds}
            allEvidence={CASE_001.evidence}
            isLocked={
              selectedObject
                ? getHotspotState(selectedObject) === 'locked'
                : false
            }
            lockedMessage={
              selectedObject ? conditionMessage(selectedObject.id) : ''
            }
            onInspect={handleInspect}
            onClose={() => setSelectedObject(null)}
          />
        </div>
      </div>

      {/* Evidence tray */}
      <div style={{ zIndex: 10, position: 'relative' }}>
        <EvidenceTray
          collectedIds={collectedIds}
          allEvidence={CASE_001.evidence}
          confirmedContradictions={contradictionsFlagged}
          disturbedIds={entity.disturbed}
          onReverify={reverifyEvidence}
        />
      </div>

      {lockNotice && (
        <div
          role="status"
          className="absolute left-1/2 -translate-x-1/2 font-caveat text-sm px-4 py-2 rounded"
          style={{ top: '64px', zIndex: 20, background: 'var(--ink)', color: 'var(--parchment)', border: '1px solid var(--gold)' }}
        >
          {lockNotice}
        </div>
      )}

      {/* ER-08 / other entity overlays */}
      {entityOverlayText && (
        <EntityOverlay
          open={!!entityOverlayText}
          text={entityOverlayText}
          onDismiss={() => setEntityOverlayText(null)}
        />
      )}

      {/* ER-01 entity overlay */}
      <EntityOverlay
        open={showPhoneOverlay}
        text="11:13"
        duration={3500}
        onDismiss={handleOverlayDismiss}
      />
    </div>
  )
}
