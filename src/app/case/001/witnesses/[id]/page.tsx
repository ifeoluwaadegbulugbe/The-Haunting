'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Package } from 'lucide-react'
import { Button } from '@/components/ui'
import { TopBar } from '@/components/archive/TopBar'
import { WitnessPortrait } from '@/components/witness/WitnessPortrait'
import { ChatBubble } from '@/components/witness/ChatBubble'
import { TypingDots } from '@/components/witness/TypingDots'
import { EvidencePicker } from '@/components/witness/EvidencePicker'
import { EntityOverlay } from '@/components/entity/EntityOverlay'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { selectUnlockedSections, selectProgress, selectRank } from '@/store/selectors'
import { evaluateEntityRules, dispatchEntityActions } from '@/lib/entity'
import { playSound } from '@/lib/audio'
import { CASE_001 } from '@/data/case001'
import type { Evidence } from '@/types'

const WITNESS_IDS = ['margaret', 'dorothea', 'julian'] as const
type WitnessId = typeof WITNESS_IDS[number]

export default function WitnessPage() {
  const params = useParams()
  const router = useRouter()
  const hydrated = useHydrated()

  const rawId = params?.id as string
  const witnessId: WitnessId = WITNESS_IDS.includes(rawId as WitnessId)
    ? (rawId as WitnessId)
    : 'margaret'

  const witness = CASE_001.witnesses.find((w) => w.id === witnessId)!

  const state = useGameStore((s) => s)
  const {
    witnessChats, witnessTrust, collectedEvidence, revealedFacts,
    presentedEvidence, investigator, entity,
    setLastRoute, addChatTurn, setTrust, revealFact,
    markEvidencePresented, addAttention, addEntityMessage,
    disturbEvidence, plantEvidence, lockObject, unlockObject, fireRule,
  } = state

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [overlayText, setOverlayText] = useState<string | null>(null)
  const [flickering, setFlickering] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLastRoute(`/case/001/witnesses/${witnessId}`)
  }, [witnessId, setLastRoute])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [witnessChats])

  const unlocked = selectUnlockedSections(state)
  const progress = selectProgress(state, CASE_001)
  const { rank, title: rankTitle } = selectRank(progress)

  const turns = witnessChats[witnessId] ?? []
  const trust = witnessTrust[witnessId] ?? 50

  const dispatchStore = {
    addEntityMessage, disturbEvidence, plantEvidence,
    lockObject, unlockObject, fireRule, addAttention,
  }

  const fireEntityEvents = useCallback((factIds: string[]) => {
    for (const factId of factIds) {
      const actions = evaluateEntityRules(
        useGameStore.getState(),
        { type: 'factRevealed', ref: factId },
        CASE_001
      )
      dispatchEntityActions(actions, dispatchStore, investigator.name, (line) => {
        // ER-05: portrait flicker + overlay
        if (actions.some((a) => a.action === 'apparition')) {
          playSound('phone-ring', useGameStore.getState().ui.muted)
          setFlickering(true)
          setTimeout(() => setFlickering(false), 2000)
        }
        setOverlayText(line)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investigator.name])

  const sendMessage = useCallback(async (message: string, evidenceId?: string) => {
    if (!message.trim() || isLoading) return
    setInput('')
    setIsLoading(true)

    addChatTurn(witnessId, { role: 'player', text: message, at: Date.now() })
    // Trust only changes the first time a given item is shown to this witness
    const firstTimePresented =
      !!evidenceId && !(presentedEvidence[witnessId] ?? []).includes(evidenceId)
    if (evidenceId) markEvidencePresented(witnessId, evidenceId)
    if (firstTimePresented) addAttention(4)

    const snapshot = {
      collectedEvidenceIds: Object.keys(collectedEvidence),
      revealedFactIds: revealedFacts,
      presentedEvidenceIds: presentedEvidence[witnessId] ?? [],
      trust,
      recentTurns: (turns.slice(-8) as Array<{ role: 'player' | 'witness'; text: string; at: number }>).map((t) => ({
        role: t.role,
        text: t.text,
      })),
    }

    try {
      const res = await fetch('/api/witness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ witnessId, message, presentedEvidenceId: evidenceId, snapshot }),
      })

      const data = await res.json() as {
        reply: string
        newlyRevealed?: Array<{ factId: string; statement: string }>
        trustDelta?: number
        mood?: string
      }

      addChatTurn(witnessId, { role: 'witness', text: data.reply, at: Date.now() })

      if (data.trustDelta && firstTimePresented) {
        setTrust(witnessId, trust + data.trustDelta)
      }

      const newFactIds: string[] = []
      if (data.newlyRevealed) {
        for (const { factId } of data.newlyRevealed) {
          revealFact(factId)
          newFactIds.push(factId)
          addAttention(4)
        }
      }

      if (newFactIds.length > 0) {
        fireEntityEvents(newFactIds)
      }

    } catch {
      // Network error — show scripted fallback
      const fallback = witness.fallbackLines.unknown[0] ?? "I cannot answer that right now."
      addChatTurn(witnessId, { role: 'witness', text: fallback, at: Date.now() })
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, witnessId, trust, turns, collectedEvidence, revealedFacts, presentedEvidence])

  const handlePresentEvidence = (evidence: Evidence) => {
    sendMessage(`I'd like to show you this: ${evidence.name}.`, evidence.id)
  }

  if (!hydrated) return null

  // Locked state
  if (!unlocked.witnesses) {
    return (
      <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
        <TopBar investigatorName={investigator.name} rankTitle={rankTitle} rankNumber={rank} unlockedSections={unlocked} />
        <main className="flex items-center justify-center min-h-[calc(100dvh-56px)] px-4">
          <div className="font-caveat text-parchment-dark text-center max-w-xs">
            <p>You need at least 3 items from the Digital Archives before the witnesses will speak to you.</p>
            <Link href="/case/001/archive" className="font-inter text-xs text-gold underline mt-4 block">Open Digital Archives →</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-obsidian" style={{ paddingTop: '56px' }}>
      <TopBar investigatorName={investigator.name} rankTitle={rankTitle} rankNumber={rank} unlockedSections={unlocked} />

      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Back + witness switcher */}
        <div className="flex items-center justify-between">
          <Link href="/hq" className="inline-flex items-center gap-2 font-inter text-xs text-parchment-dark hover:text-parchment">
            <ArrowLeft size={14} /> Back to HQ
          </Link>
          <div className="flex gap-2">
            {WITNESS_IDS.map((id) => {
              const w = CASE_001.witnesses.find((x) => x.id === id)!
              const t = witnessTrust[id] ?? 50
              return (
                <button
                  key={id}
                  onClick={() => router.push(`/case/001/witnesses/${id}`)}
                  className="relative w-12 h-12 rounded-full overflow-hidden border-2 transition-colors cursor-pointer"
                  style={{
                    borderColor: id === witnessId ? 'var(--gold)' : 'var(--brown)',
                    background: 'none', padding: 0,
                  }}
                  title={w.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.portrait} alt={w.name} className="w-full h-full object-cover object-top" />
                  {/* trust dot */}
                  <span
                    className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-obsidian"
                    style={{ background: t >= 67 ? 'var(--verdigris)' : t >= 34 ? 'var(--gold)' : 'var(--thread)' }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-start">
          {/* Portrait */}
          <WitnessPortrait witness={witness} trust={trust} flickering={flickering} />

          {/* Chat panel */}
          <div
            className="flex-1 flex flex-col rounded-sm overflow-hidden border border-gold"
            style={{ background: 'var(--ink)', minHeight: '500px' }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gold flex items-center gap-3" style={{ background: 'var(--burgundy)' }}>
              <span className="font-cormorant font-semibold text-parchment text-sm">{witness.name}</span>
              <span className="font-inter text-xs text-parchment-dark">{witness.role}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {turns.length === 0 && (
                <p className="font-caveat text-parchment-dark text-sm italic text-center pt-8">
                  Begin the interrogation…
                </p>
              )}
              {turns.map((turn, i) => (
                <ChatBubble key={i} role={turn.role} text={turn.text} />
              ))}
              {isLoading && <TypingDots />}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gold flex gap-2" style={{ background: 'var(--burgundy)' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="Ask a question…"
                maxLength={300}
                disabled={isLoading}
                className="flex-1 bg-transparent font-inter text-sm text-parchment placeholder-parchment-dark outline-none"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                aria-label="Send"
                className="p-1.5 rounded transition-opacity disabled:opacity-40 cursor-pointer"
                style={{ background: 'none', border: 'none' }}
              >
                <Send size={16} color="var(--gold)" />
              </button>
              <Button
                variant="secondary"
                onClick={() => setShowPicker(true)}
                disabled={isLoading}
                className="text-xs py-1 px-3 flex items-center gap-1"
              >
                <Package size={12} /> Present
              </Button>
            </div>
          </div>
        </div>
      </main>

      <EvidencePicker
        open={showPicker}
        collectedIds={Object.keys(collectedEvidence)}
        allEvidence={CASE_001.evidence}
        onSelect={handlePresentEvidence}
        onClose={() => setShowPicker(false)}
      />

      {overlayText && (
        <EntityOverlay
          open={!!overlayText}
          text={overlayText}
          onDismiss={() => setOverlayText(null)}
        />
      )}

      {/* ER-05 entity message is handled by NotificationTray in layout via entity.messages */}
      {entity.messages.length > 0 && (
        <div className="fixed bottom-4 left-4 z-30 max-w-xs">
          {entity.messages.slice(-1).map((msg) => (
            <p
              key={msg.id}
              className="font-caveat text-sm px-4 py-3 rounded-sm border"
              style={{ background: 'rgba(14,12,16,0.9)', borderColor: 'var(--entity)', color: 'var(--entity-glow)' }}
            >
              {msg.text}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
