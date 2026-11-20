'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, DoorOpen } from 'lucide-react'
import { Hotspot } from '@/components/scene/Hotspot'
import { ObjectPanel } from '@/components/scene/ObjectPanel'
import { EvidenceTray } from '@/components/scene/EvidenceTray'
import { EntityOverlay } from '@/components/entity/EntityOverlay'
import { ItemCloseUp } from '@/components/scene/ItemCloseUp'
import { RoomStage } from '@/components/room/RoomStage'
import { useFxStore } from '@/store/fxStore'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { evaluateCondition, conditionMessage } from '@/lib/engine/conditions'
import { evaluateEntityRules, dispatchEntityActions } from '@/lib/entity'
import { playSound } from '@/lib/audio'
import { audio } from '@/lib/audio/engine'
import { CASE_001 } from '@/data/case001'
import type { SceneObject } from '@/types'
import type { HotspotState } from '@/components/scene/Hotspot'

// study-scene.jpg is 1376 x 768
const SCENE_RATIO = 1376 / 768
const ZOOM_SCALE = 2.4
const ZOOM_MS = 700

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function ScenePage() {
  const hydrated = useHydrated()
  const sceneRef = useRef<HTMLDivElement>(null)

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
  // Camera push-in towards the object being examined, then the close-up
  const [zoomObject, setZoomObject] = useState<SceneObject | null>(null)
  const [closeUp, setCloseUp] = useState<{ object: SceneObject; newlyFound: boolean } | null>(null)

  // Start narrow screens centred on the desk
  useEffect(() => {
    const el = sceneRef.current
    if (hydrated && el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [hydrated])

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

  // Zoom into an object, then run the next step once the camera has arrived
  const zoomThen = (obj: SceneObject, next: () => void) => {
    setSelectedObject(null)
    setZoomObject(obj)
    playSound('page-rustle', useGameStore.getState().ui.muted, 0.4)
    setTimeout(next, prefersReducedMotion() ? 0 : ZOOM_MS)
  }

  const handleInspect = (obj: SceneObject) => {
    zoomThen(obj, () => {
      // ER-01: telephone first inspection rings before the close-up
      if (obj.id === 'OBJ-telephone' && !useGameStore.getState().entity.firedRules.includes('ER-01')) {
        fireRule('ER-01')
        playSound('phone-ring', useGameStore.getState().ui.muted)
        setShowPhoneOverlay(true)
        return // collected when the overlay is dismissed
      }
      const newlyFound = doCollect(obj)
      setCloseUp({ object: obj, newlyFound })
    })
  }

  // Look again at something already collected
  const handleExamine = (obj: SceneObject) => {
    zoomThen(obj, () => setCloseUp({ object: obj, newlyFound: false }))
  }

  // Leaving a close-up: newly found evidence flies into the inventory as the camera pulls back
  const closeCloseUp = () => {
    if (closeUp?.newlyFound) {
      const from = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      closeUp.object.yieldsEvidence.forEach((id, i) =>
        setTimeout(() => useFxStore.getState().fly(id, from), i * 180)
      )
    }
    setCloseUp(null)
    setZoomObject(null)
  }

  const dispatchStore = {
    addEntityMessage, disturbEvidence, plantEvidence,
    lockObject, unlockObject, fireRule, addAttention,
  }

  const doCollect = (obj: SceneObject): boolean => {
    let newlyFound = false
    discoverObject(obj.id)
    inspectObject(obj.id)
    // Add attention for inspecting
    addAttention(2)

    for (const evId of obj.yieldsEvidence) {
      if (!useGameStore.getState().collectedEvidence[evId]) {
        newlyFound = true
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
    return newlyFound
  }

  const handleOverlayDismiss = () => {
    setShowPhoneOverlay(false)
    // Now collect the telephone evidence
    const telephoneObj = CASE_001.scene.find((o) => o.id === 'OBJ-telephone')
    if (telephoneObj) setCloseUp({ object: telephoneObj, newlyFound: doCollect(telephoneObj) })
  }

  if (!hydrated) return null

  const collectedIds = Object.keys(collectedEvidence)

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-obsidian">
      {/* The study: picture, rings, zoom, depth, candle glow, dust */}
      <RoomStage
        src="/assets/scene/study-scene.jpg"
        alt="Ashworth House study"
        ratio={SCENE_RATIO}
        zoom={zoomObject ? zoomObject.hotspot : null}
        zoomScale={ZOOM_SCALE}
        zoomMs={ZOOM_MS}
        scrollRef={sceneRef}
        glows={[{ x: 40, y: 53, size: 8 }, { x: 84, y: 24, size: 6 }]}
      >
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: zoomObject ? 0 : 1, pointerEvents: zoomObject ? 'none' : undefined }}
        >
          {CASE_001.scene.map((obj) => (
            <Hotspot
              key={obj.id}
              object={obj}
              state={getHotspotState(obj)}
              onClick={() => handleHotspotClick(obj)}
              lockedMessage={conditionMessage(obj.id)}
            />
          ))}
        </div>
      </RoomStage>

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
        {/* Lily's things lead upstairs to her room (optional, explored by torchlight) */}
        {collectedEvidence['EV-09'] && !selectedObject && (
          <Link
            href="/case/001/lily-room"
            onClick={() => audio.sfx('drawer', 0.6)}
            className="flex items-center gap-2 font-inter text-xs px-3 py-1.5 rounded border border-gold text-parchment hover:border-parchment-light"
            style={{ background: 'rgba(14,12,16,0.75)' }}
          >
            <DoorOpen size={14} color="var(--gold)" aria-hidden="true" /> Go upstairs: Lily&rsquo;s room
          </Link>
        )}
        <button
          onClick={() => setSelectedObject(null)}
          aria-label="Close panel"
          className="font-inter text-xs text-parchment-dark hover:text-parchment transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {selectedObject ? '✕' : ''}
        </button>
      </div>

      {/* Object panel */}
      {/* The layer ignores clicks; only the panel itself receives them */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
        <div className="h-full">
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
            onExamine={handleExamine}
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

      <ItemCloseUp
        object={closeUp?.object ?? null}
        evidence={(closeUp?.object.yieldsEvidence ?? [])
          .map((id) => CASE_001.evidence.find((e) => e.id === id))
          .filter((e): e is NonNullable<typeof e> => Boolean(e))}
        newlyFound={closeUp?.newlyFound ?? false}
        onClose={closeCloseUp}
      />

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
