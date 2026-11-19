'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/archive/TopBar'
import { EvidenceCard } from '@/components/board/EvidenceCard'
import { ThreadLayer } from '@/components/board/ThreadLayer'
import { ContradictionBadge } from '@/components/board/ContradictionBadge'
import { TimelineSlot } from '@/components/board/TimelineSlot'
import { TheoryForm } from '@/components/board/TheoryForm'
import { EntityOverlay } from '@/components/entity/EntityOverlay'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { selectUnlockedSections, selectProgress, selectRank } from '@/store/selectors'
import { evaluateLink } from '@/lib/evidence/links'
import { getAvailableContradictions } from '@/lib/evidence/contradictions'
import { validateTimelinePlacement } from '@/lib/evidence/timeline'
import { evaluateEntityRules, dispatchEntityActions } from '@/lib/entity'
import { CASE_001 } from '@/data/case001'
import type { Theory } from '@/types'

type Tab = 'connections' | 'timeline' | 'theories'

// Default spread positions for evidence cards
function defaultPosition(index: number): { x: number; y: number } {
  const cols = 5
  const col = index % cols
  const row = Math.floor(index / cols)
  return { x: 40 + col * 150, y: 60 + row * 170 }
}

const ANCHOR_ID = '__anchor__'
const ANCHOR_POS = { x: 400, y: 280 }

export default function EvidenceBoardPage() {
  const router = useRouter()
  const hydrated = useHydrated()
  const boardRef = useRef<HTMLDivElement>(null)

  const state = useGameStore((s) => s)
  const {
    collectedEvidence, boardPositions, links, contradictionsFlagged,
    timelinePlacement, investigator, entity,
    setLastRoute, setCardPosition, addLink, flagContradiction,
    placeTimelineEvent, setTheory, addAttention, addEntityMessage,
    disturbEvidence, plantEvidence, lockObject, unlockObject, fireRule,
  } = state

  const [tab, setTab] = useState<Tab>('connections')
  const [overlayText, setOverlayText] = useState<string | null>(null)
  const [pendingFrom, setPendingFrom] = useState<string | null>(null)
  const [pendingTo, setPendingTo] = useState<{ x: number; y: number } | null>(null)
  const [notConclusive, setNotConclusive] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [connectFrom, setConnectFrom]     = useState<string | null>(null)

  useEffect(() => { setLastRoute('/case/001/evidence') }, [setLastRoute])

  useEffect(() => {
    if (!hydrated || tab !== 'theories') return
    const s = useGameStore.getState()
    if (s.collectedEvidence['EV-X1']) return
    const actions = evaluateEntityRules(s, { type: 'conclusionOpened' }, CASE_001)
    dispatchEntityActions(actions, s, s.investigator.name)
    if (!useGameStore.getState().collectedEvidence['EV-X1']) plantEvidence('EV-X1')
  }, [hydrated, tab, plantEvidence])

  // ER-06 needs 3 valid links AND stage 2; re-check when either changes, not only on a new link
  const validLinkCount = links.filter((l) => l.verdict === 'valid').length
  useEffect(() => {
    if (!hydrated || validLinkCount < 3) return
    const s = useGameStore.getState()
    const actions = evaluateEntityRules(s, { type: 'linksReached', count: validLinkCount }, CASE_001)
    dispatchEntityActions(actions, s, s.investigator.name, (line) => setOverlayText(line))
  }, [hydrated, validLinkCount, entity.stage])

  const dispatchStore = {
    addEntityMessage, disturbEvidence, plantEvidence,
    lockObject, unlockObject, fireRule, addAttention,
  }

  const fireEvents = useCallback((events: Parameters<typeof evaluateEntityRules>[1][]) => {
    for (const event of events) {
      const actions = evaluateEntityRules(useGameStore.getState(), event, CASE_001)
      dispatchEntityActions(actions, dispatchStore, investigator.name, (line) => setOverlayText(line))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investigator.name])

  if (!hydrated) return null

  const unlocked = selectUnlockedSections(state)
  const progress = selectProgress(state, CASE_001)
  const { rank, title: rankTitle } = selectRank(progress)

  const collectedIds = Object.keys(collectedEvidence)
  const collectedItems = CASE_001.evidence.filter((e) => collectedIds.includes(e.id))
  const availableContradictions = getAvailableContradictions(state, CASE_001)
  const timelineConflicts = validateTimelinePlacement(timelinePlacement, CASE_001)
  const conflictedEventIds = new Set(timelineConflicts.map((c) => c.eventId))

  // Positions for all cards (default if not yet moved)
  const allPositions: Record<string, { x: number; y: number }> = { [ANCHOR_ID]: ANCHOR_POS }
  collectedItems.forEach((ev, i) => {
    allPositions[ev.id] = boardPositions[ev.id] ?? defaultPosition(i)
  })

  // Shared by drag-to-connect (board) and tap-to-connect (phone list)
  function connect(a: string, b: string) {
    const alreadyLinked = links.some(
      (l) => (l.a === a && l.b === b) || (l.a === b && l.b === a)
    )
    if (alreadyLinked) return
    const verdict = evaluateLink(a, b, CASE_001)
    addLink(a, b, verdict)
    if (verdict === 'valid') {
      addAttention(5)
      fireEvents([{ type: 'linksReached', count: links.filter((l) => l.verdict === 'valid').length + 1 }])
    } else if (verdict === 'invalid') {
      const name = (id: string) => CASE_001.evidence.find((e) => e.id === id)?.name ?? id
      setNotConclusive(` and ${name(b)}: not conclusive`)
      setTimeout(() => setNotConclusive(null), 3000)
    }
  }

  // ── Thread drag handlers ─────────────────────────────────────────────────

  const handlePinDrag = (id: string, e: React.PointerEvent) => {
    setPendingFrom(id)
    const board = boardRef.current
    if (!board) return

    // Card positions are in board-content coordinates, so add the board's scroll offset
    const toBoard = (ev: PointerEvent) => {
      const rect = board.getBoundingClientRect()
      return { x: ev.clientX - rect.left + board.scrollLeft, y: ev.clientY - rect.top + board.scrollTop }
    }
    const onMove = (ev: PointerEvent) => {
      setPendingTo(toBoard(ev))
    }
    const onUp = (ev: PointerEvent) => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      setPendingFrom(null)
      setPendingTo(null)

      // Find which card (if any) the pointer ended on
      const { x: bx, y: by } = toBoard(ev)
      const target = collectedItems.find((c) => {
        const p = allPositions[c.id]
        return bx >= p.x && bx <= p.x + 120 && by >= p.y - 10 && by <= p.y + 100
      })
      if (!target || target.id === id) return
      connect(id, target.id)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    e.stopPropagation()
  }

  const handleListConnect = (id: string) => {
    if (!connectFrom) return setConnectFrom(id)
    if (connectFrom === id) return setConnectFrom(null)
    connect(connectFrom, id)
    setConnectFrom(null)
  }

  // ── Contradiction confirm ────────────────────────────────────────────────

  const handleConfirmContradiction = (id: string) => {
    flagContradiction(id)
    addAttention(10)
    fireEvents([{ type: 'contradictionConfirmed', ref: id }])
  }

  // ── Timeline handlers ────────────────────────────────────────────────────

  const handleTimelineDrop = (slotIndex: number) => {
    if (!selectedEvent) return
    placeTimelineEvent(String(slotIndex), selectedEvent)
    setSelectedEvent(null)
  }

  const handleTimelineClear = (slotIndex: number) => {
    const next = { ...timelinePlacement }
    delete next[String(slotIndex)]
    useGameStore.setState({ timelinePlacement: next })
  }

  // ── Theory submit ────────────────────────────────────────────────────────

  const handleTheorySubmit = (theory: Theory) => {
    // ER-06b fail-safe
    if (!collectedEvidence['EV-X1']) {
      plantEvidence('EV-X1')
    }
    setTheory(theory)
    useGameStore.setState({ verdict: undefined })
    router.push('/case/001/conclusion')
  }

  const usedEventIds = new Set(Object.values(timelinePlacement))
  const unusedEvents = CASE_001.timeline.filter((e) => !usedEventIds.has(e.id))

  return (
    <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
      <TopBar investigatorName={investigator.name} rankTitle={rankTitle} rankNumber={rank} unlockedSections={unlocked} />

      {/* Tabs */}
      <div className="border-b border-gold flex px-4 gap-1 bg-ink">
        {(['connections', 'timeline', 'theories'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="font-inter text-xs px-4 py-3 capitalize cursor-pointer transition-colors"
            style={{
              background: 'none', border: 'none',
              color: tab === t ? 'var(--parchment)' : 'var(--parchment-dark)',
              borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Connections tab ─────────────────────────────────────────────── */}
      {tab === 'connections' && (
        <>
        <div className="hidden md:flex gap-0">
          <div
            ref={boardRef}
            className="relative flex-1 overflow-auto"
            style={{
              minHeight: 'calc(100dvh - 112px)',
              backgroundImage: 'url(/assets/ui/board-wall.jpg)',
              backgroundSize: 'cover',
              backgroundColor: 'var(--brown)',
            }}
          >
            <ThreadLayer
              links={links}
              positions={allPositions}
              pendingFrom={pendingFrom ? { id: pendingFrom, ...allPositions[pendingFrom] } : undefined}
              pendingTo={pendingTo ?? undefined}
            />

            {/* 11:13 anchor card */}
            <div
              className="absolute flex items-center justify-center rounded-sm"
              style={{
                left: ANCHOR_POS.x, top: ANCHOR_POS.y,
                width: 120, height: 80,
                background: 'var(--ink)',
                border: '2px solid var(--gold)',
                zIndex: 5,
              }}
            >
              <span className="font-cinzel text-gold text-xl tracking-widest">11:13</span>
            </div>

            {collectedItems.map((ev, i) => (
              <EvidenceCard
                key={ev.id}
                evidence={ev}
                position={boardPositions[ev.id] ?? defaultPosition(i)}
                onMove={setCardPosition}
                onPinDrag={handlePinDrag}
                disturbed={entity.disturbed.includes(ev.id)}
              />
            ))}

            {notConclusive && (
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 font-caveat text-sm px-4 py-2 rounded"
                style={{ background: 'var(--ink)', color: 'var(--parchment-dark)', border: '1px solid var(--brown)', zIndex: 10 }}
              >
                {notConclusive}
              </div>
            )}
          </div>

          {/* Contradictions sidebar */}
          {availableContradictions.length > 0 && (
            <div className="w-60 lg:w-72 flex-shrink-0 overflow-y-auto p-3 space-y-3 border-l border-gold bg-ink" style={{ maxHeight: 'calc(100dvh - 112px)' }}>
              <h3 className="font-cormorant font-semibold text-parchment text-base">Contradictions</h3>
              {availableContradictions.map((cx) => (
                <ContradictionBadge
                  key={cx.id}
                  contradiction={cx}
                  isConfirmed={contradictionsFlagged.includes(cx.id)}
                  onConfirm={handleConfirmContradiction}
                />
              ))}
            </div>
          )}
        </div>

        {/* Phone: list view with a two-tap Connect action */}
        <div className="md:hidden p-4 space-y-3">
          <p className="font-caveat text-parchment-dark text-sm">
            {connectFrom
              ? 'Now choose the second item to connect.'
              : 'Tap Connect on one item, then on another.'}
          </p>
          {collectedItems.map((ev) => {
            const linked = links.filter((l) => l.a === ev.id || l.b === ev.id)
            return (
              <div
                key={ev.id}
                className="flex items-center justify-between gap-3 p-3 rounded border"
                style={{
                  background: 'var(--ink)',
                  borderColor: connectFrom === ev.id ? 'var(--gold)' : 'var(--brown)',
                }}
              >
                <div className="min-w-0">
                  <p className="font-inter text-sm text-parchment truncate">{ev.name}</p>
                  <p className="font-inter text-xs text-parchment-dark">
                    {linked.filter((l) => l.verdict !== 'invalid').length} connection(s)
                  </p>
                </div>
                <button
                  onClick={() => handleListConnect(ev.id)}
                  className="font-inter text-xs px-3 rounded border cursor-pointer flex-shrink-0"
                  style={{ minHeight: '44px', background: 'none', borderColor: 'var(--gold)', color: 'var(--parchment)' }}
                >
                  {connectFrom === ev.id ? 'Cancel' : 'Connect'}
                </button>
              </div>
            )
          })}
          {notConclusive && (
            <p className="font-caveat text-sm text-parchment-dark">{notConclusive}</p>
          )}
          {availableContradictions.map((cx) => (
            <ContradictionBadge
              key={cx.id}
              contradiction={cx}
              isConfirmed={contradictionsFlagged.includes(cx.id)}
              onConfirm={handleConfirmContradiction}
            />
          ))}
        </div>
        </>
      )}

      {/* ── Timeline tab ────────────────────────────────────────────────── */}
      {tab === 'timeline' && (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <p className="font-caveat text-parchment-dark text-sm">
            Select an event, then click a slot to place it. Events can be repositioned.
          </p>

          {/* Event cards */}
          <div className="flex flex-wrap gap-2">
            {unusedEvents.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEvent(selectedEvent === ev.id ? null : ev.id)}
                className="font-inter text-xs px-3 py-2 rounded border text-left cursor-pointer transition-colors"
                style={{
                  background: selectedEvent === ev.id ? 'var(--burgundy)' : 'var(--ink)',
                  borderColor: selectedEvent === ev.id ? 'var(--gold)' : 'var(--brown)',
                  color: 'var(--parchment)',
                }}
              >
                {ev.label}
              </button>
            ))}
          </div>

          {/* Slots */}
          <div className="space-y-2">
            {CASE_001.timeline.map((_, slotIdx) => {
              const eventId = timelinePlacement[String(slotIdx)]
              const event = eventId ? CASE_001.timeline.find((e) => e.id === eventId) : undefined
              return (
                <div key={slotIdx} onClick={() => handleTimelineDrop(slotIdx)}>
                  <TimelineSlot
                    slotIndex={slotIdx}
                    timeLabel={`Slot ${slotIdx + 1}`}
                    event={event}
                    hasConflict={event ? conflictedEventIds.has(event.id) : false}
                    onDrop={handleTimelineDrop}
                    onClear={handleTimelineClear}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Theories tab ────────────────────────────────────────────────── */}
      {tab === 'theories' && (
        <div className="max-w-2xl mx-auto p-6">
          <h2 className="font-cormorant font-bold text-parchment text-2xl mb-6">Form Your Theory</h2>
          <TheoryForm
            collectedEvidence={collectedItems.filter((e) => e.id !== 'EV-X1' || true)}
            timelinePlacement={timelinePlacement}
            onSubmit={handleTheorySubmit}
          />
        </div>
      )}

      {overlayText && (
        <EntityOverlay open={!!overlayText} text={overlayText} onDismiss={() => setOverlayText(null)} />
      )}
    </div>
  )
}
