'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Send, Package, ScrollText, X } from 'lucide-react'
import { Button, Stamp } from '@/components/ui'
import { TopBar } from '@/components/archive/TopBar'
import { WitnessPortrait, type WitnessMood } from '@/components/witness/WitnessPortrait'
import { ChatBubble } from '@/components/witness/ChatBubble'
import { TypingDots } from '@/components/witness/TypingDots'
import { EvidencePicker } from '@/components/witness/EvidencePicker'
import { EntityOverlay } from '@/components/entity/EntityOverlay'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { selectUnlockedSections, selectProgress, selectRank } from '@/store/selectors'
import { evaluateEntityRules, dispatchEntityActions } from '@/lib/entity'
import { playSound } from '@/lib/audio'
import { audio } from '@/lib/audio/engine'
import { useAsset } from '@/lib/useAsset'
import { pickFallback } from '@/lib/ai/witness/fallback'
import { CASE_001 } from '@/data/case001'
import { SUGGESTED_QUESTIONS } from '@/data/case001/questions'
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
    presentedEvidence, investigator,
    setLastRoute, addChatTurn, setTrust, revealFact,
    markEvidencePresented, addAttention, addEntityMessage,
    disturbEvidence, plantEvidence, lockObject, unlockObject, fireRule,
  } = state

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [overlayText, setOverlayText] = useState<string | null>(null)
  const [flickering, setFlickering] = useState(false)
  const [mood, setMood] = useState<WitnessMood>('calm')
  const [cornered, setCornered] = useState(false)
  const [lieBroken, setLieBroken] = useState(false)
  const [typingAt, setTypingAt] = useState<number | null>(null)
  const [showStatements, setShowStatements] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const roomArt = useAsset('/assets/ui/interview-room.jpg')

  // A new witness starts composed
  useEffect(() => { setMood('calm'); setCornered(false); setLieBroken(false) }, [witnessId])

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
  const pressured = cornered || trust < 25
  const asked = new Set(turns.filter((t) => t.role === 'player').map((t) => t.text))
  const suggestions = (SUGGESTED_QUESTIONS[witnessId] ?? []).filter((q) => !asked.has(q)).slice(0, 3)
  const statements = witness.facts.filter((f) => revealedFacts.includes(f.id))

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
        text: String(t.text ?? '').slice(0, 300),
      }))
        .filter((t) => t.text.length > 0),
    }

    try {
      const post = () => fetch('/api/witness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ witnessId, message, presentedEvidenceId: evidenceId, snapshot }),
      })
      // A cold start or a slow model can time out once; try a second time before giving up
      let res = await post().catch(() => null)
      if (!res || res.status >= 500) res = await post()
      if (!res.ok) console.warn(`[witness] request failed with status ${res.status}`)

      const data = (await res.json().catch(() => ({}))) as {
        reply?: unknown
        newlyRevealed?: Array<{ factId: string; statement: string }>
        trustDelta?: number
        mood?: string
      }
      if (!res.ok || typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('bad witness response')
      }

      // People hesitate, longer when shown something they hoped you wouldn't find
      await new Promise((r) => setTimeout(r, evidenceId ? 1300 : 600))

      const at = Date.now()
      setTypingAt(at)
      addChatTurn(witnessId, { role: 'witness', text: data.reply as string, at })
      if (data.mood === 'calm' || data.mood === 'afraid' || data.mood === 'defensive' || data.mood === 'cold') setMood(data.mood)

      // Evidence that forces a new admission breaks the witness's story
      if (evidenceId && data.newlyRevealed && data.newlyRevealed.length > 0) {
        audio.sfx('sting', 0.9)
        setTimeout(() => audio.sfx('stamp', 0.9), 450)
        setLieBroken(true)
        setCornered(true)
        setMood((m) => (m === 'calm' ? 'afraid' : m))
        setTimeout(() => setLieBroken(false), 2600)
      }

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
      // Network error: a scripted line that fits the moment, rotating so it does not repeat
      const { line } = pickFallback(witness.fallbackLines, {
        turns: turns.filter((t) => t.role === 'player').length + 1,
        presented: Boolean(evidenceId),
        trust,
      })
      addChatTurn(witnessId, { role: 'witness', text: line, at: Date.now() })
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
    <div className="relative min-h-dvh bg-obsidian overflow-hidden" style={{ paddingTop: '56px' }}>
      <TopBar investigatorName={investigator.name} rankTitle={rankTitle} rankNumber={rank} unlockedSections={unlocked} />

      {/* The interview room */}
      <div aria-hidden="true" className="fixed inset-0 room-push" style={{ zIndex: 0 }}>
        {roomArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/assets/ui/interview-room.jpg" alt="" className="w-full h-full object-cover" style={{ filter: pressured ? 'brightness(0.55)' : 'brightness(0.7)', transition: 'filter 1s' }} />
        ) : (
          <div className="w-full h-full" style={{ background: 'radial-gradient(ellipse at 30% 35%, rgba(81,65,61,0.55), transparent 55%), linear-gradient(180deg, rgba(23,20,25,1) 0%, rgba(14,12,16,1) 100%)' }} />
        )}
        <div className="absolute glow-flicker rounded-full" style={{ left: '28%', top: '18%', width: '38vw', aspectRatio: '1', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(232,177,93,0.22), transparent 60%)', mixBlendMode: 'screen' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(14,12,16,0.85) 100%)' }} />
      </div>

      <main className="relative max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4" style={{ zIndex: 1 }}>
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
                  className="relative w-12 h-12 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer"
                  style={{ borderColor: id === witnessId ? 'var(--gold)' : 'var(--brown)', background: 'none', padding: 0 }}
                  title={w.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.portrait} alt={w.name} className="w-full h-full object-cover object-top" />
                  <span
                    className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-obsidian"
                    style={{ background: t >= 67 ? 'var(--verdigris)' : t >= 34 ? 'var(--gold)' : 'var(--thread)' }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-start">
          <motion.div key={witnessId} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <WitnessPortrait witness={witness} trust={trust} mood={mood} pressured={pressured} flickering={flickering} />
          </motion.div>

          <div className="relative flex-1 flex flex-col rounded-sm overflow-hidden border border-gold" style={{ background: 'rgba(14,12,16,0.88)', minHeight: '520px' }}>
            <div className="px-4 py-3 border-b border-gold flex items-center gap-3" style={{ background: 'rgba(66,29,41,0.92)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--thread)', boxShadow: '0 0 8px var(--thread)' }} aria-hidden="true" />
              <span className="font-inter text-[10px] tracking-[0.2em] text-parchment-dark">RECORDING</span>
              <span className="font-cormorant font-semibold text-parchment text-sm">{witness.name}</span>
              <button
                onClick={() => { audio.sfx('page'); setShowStatements((v) => !v) }}
                className="ml-auto inline-flex items-center gap-1.5 font-inter text-xs text-parchment-dark hover:text-parchment"
                aria-expanded={showStatements}
              >
                <ScrollText size={14} /> Statements ({statements.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {turns.length === 0 && (
                <p className="font-caveat text-parchment-dark text-lg text-center pt-8">
                  {witness.fallbackLines.greeting[0]}
                </p>
              )}
              {turns.map((turn, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  {turn.role === 'witness' && turn.at === typingAt ? (
                    <ChatBubble role="witness" text={<Typewriter text={turn.text} onDone={() => setTypingAt(null)} />} />
                  ) : (
                    <ChatBubble role={turn.role} text={turn.text} />
                  )}
                </motion.div>
              ))}
              {isLoading && <TypingDots />}
              <div ref={chatEndRef} />
            </div>

            {suggestions.length > 0 && (
              <div className="px-3 pt-2 flex flex-wrap gap-2 border-t border-brown">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    disabled={isLoading}
                    onClick={() => sendMessage(q)}
                    className="font-inter text-xs px-3 py-1.5 rounded-full border border-brown text-parchment-dark hover:text-parchment hover:border-gold transition-colors disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } else audio.sfx('type', 0.35) }}
                placeholder="Ask a question…"
                maxLength={300}
                disabled={isLoading}
                className="flex-1 bg-transparent font-inter text-sm text-parchment placeholder-parchment-dark outline-none border-b border-brown focus:border-gold py-1"
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
              <Button variant="secondary" onClick={() => setShowPicker(true)} disabled={isLoading} className="text-xs py-1 px-3 flex items-center gap-1">
                <Package size={12} /> Present
              </Button>
            </div>

            <AnimatePresence>
              {showStatements && (
                <motion.aside
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                  className="absolute inset-y-0 right-0 w-full sm:w-80 overflow-y-auto p-4 border-l border-gold"
                  style={{ background: 'rgba(23,20,25,0.98)', zIndex: 2 }}
                  aria-label="Statements"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-cinzel text-xs tracking-[0.25em] text-parchment-dark">ON THE RECORD</p>
                    <button aria-label="Close statements" onClick={() => setShowStatements(false)}><X size={16} color="var(--parchment)" /></button>
                  </div>
                  {statements.length === 0 && <p className="font-caveat text-parchment-dark text-lg">Nothing on the record yet.</p>}
                  <ul className="space-y-3">
                    {statements.map((f) => (
                      <li key={f.id} className="rounded-sm p-3" style={{ background: 'linear-gradient(160deg, var(--parchment-light), var(--parchment))' }}>
                        <p className="font-cormorant text-obsidian text-base leading-snug">&ldquo;{f.statement}&rdquo;</p>
                        {f.yieldsStatementId && <p className="font-inter text-[10px] tracking-wide text-brown mt-1 uppercase">Claim on record · compare it with the evidence</p>}
                      </li>
                    ))}
                  </ul>
                </motion.aside>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {lieBroken && (
                <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 3 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div initial={{ scale: 2.6, rotate: -18, opacity: 0 }} animate={{ scale: 1.4, rotate: -8, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.35 }}>
                    <Stamp label="STORY CHANGED" variant="unresolved" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
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
        <EntityOverlay open={!!overlayText} text={overlayText} onDismiss={() => setOverlayText(null)} />
      )}
    </div>
  )
}

/** Types a witness's reply out, with a soft tick, as if they are choosing their words. */
function Typewriter({ text, onDone }: { text: string; onDone: () => void }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const t = setInterval(() => {
      setN((v) => {
        if (v >= text.length) { clearInterval(t); setTimeout(onDone, 0); return v }
        if (v % 4 === 0) audio.sfx('type', 0.2)
        return v + 2
      })
    }, 22)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  return <span className={n < text.length ? 'caret' : ''}>{text.slice(0, n)}</span>
}