import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { GameState, Theory, AudioSettings } from '@/types'
import { migrateState, CURRENT_VERSION, DEFAULT_AUDIO } from './migrations'
import { useFxStore } from './fxStore'

// ── Initial state ──────────────────────────────────────────────────────────

export const INITIAL_STATE: GameState = {
  version: 2,
  audio: { ...DEFAULT_AUDIO },
  seenCinematics: [],
  achievements: [],
  investigator: { name: '', startedAt: 0 },
  discoveredObjects: [],
  inspectedObjects: [],
  collectedEvidence: {},
  recoveredRecords: [],
  witnessChats: {},
  witnessTrust: {},
  revealedFacts: [],
  presentedEvidence: {},
  contradictionsFlagged: [],
  links: [],
  boardPositions: {},
  timelinePlacement: {},
  entity: {
    attention: 0,
    stage: 0,
    firedRules: [],
    disturbed: [],
    lockedObjects: [],
    locks: {},
    messages: [],
  },
  theory: undefined,
  verdict: undefined,
  ui: {
    lastRoute: '',
    muted: false,
    seenIntro: false,
  },
}

// ── Store definition ───────────────────────────────────────────────────────

interface GameStore extends GameState {
  // Investigation
  startInvestigation: (name: string) => void
  discoverObject: (id: string) => void
  inspectObject: (id: string) => void
  collectEvidence: (id: string) => void

  // Digital Archives
  recoverRecord: (id: string) => void

  // Witness
  addChatTurn: (witnessId: string, turn: { role: 'player' | 'witness'; text: string; at: number }) => void
  setTrust: (witnessId: string, value: number) => void
  revealFact: (factId: string) => void
  markEvidencePresented: (witnessId: string, evidenceId: string) => void

  // Board
  addLink: (a: string, b: string, verdict: 'valid' | 'invalid' | 'contradiction') => void
  setCardPosition: (id: string, pos: { x: number; y: number }) => void
  placeTimelineEvent: (slot: string, eventId: string) => void
  flagContradiction: (id: string) => void

  // Entity
  addAttention: (delta: number) => void
  fireRule: (ruleId: string) => void
  disturbEvidence: (id: string) => void
  lockObject: (id: string, durationMs?: number) => void
  unlockObject: (id: string) => void
  expireLocks: (now?: number) => void
  reverifyEvidence: (id: string) => void
  addEntityMessage: (msg: { id: string; text: string; at: number }) => void
  plantEvidence: (id: string) => void

  // Theory & verdict
  setTheory: (theory: Theory) => void
  setVerdict: (verdict: { score: number; breakdown: Record<string, number>; rank: string }) => void

  // UI
  setLastRoute: (route: string) => void
  toggleMute: () => void
  markIntroSeen: () => void
  setAudio: (patch: Partial<AudioSettings>) => void
  markCinematicSeen: (id: string) => void
  unlockAchievement: (id: string) => void

  // Meta
  resetStore: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      // ── Investigation ──────────────────────────────────────────────────
      startInvestigation: (name) =>
        set({ investigator: { name, startedAt: Date.now() } }),

      discoverObject: (id) =>
        set((s) =>
          s.discoveredObjects.includes(id)
            ? {}
            : { discoveredObjects: [...s.discoveredObjects, id] }
        ),

      inspectObject: (id) =>
        set((s) =>
          s.inspectedObjects.includes(id)
            ? {}
            : { inspectedObjects: [...s.inspectedObjects, id] }
        ),

      collectEvidence: (id) =>
        set((s) =>
          s.collectedEvidence[id]
            ? {}
            : {
              collectedEvidence: {
                ...s.collectedEvidence,
                [id]: { at: Date.now(), flags: [] },
              },
            }
        ),

      // ── Digital ───────────────────────────────────────────────────────
      recoverRecord: (id) =>
        set((s) =>
          s.recoveredRecords.includes(id)
            ? {}
            : { recoveredRecords: [...s.recoveredRecords, id] }
        ),

      // ── Witness ───────────────────────────────────────────────────────
      addChatTurn: (witnessId, turn) =>
        set((s) => ({
          witnessChats: {
            ...s.witnessChats,
            [witnessId]: [...(s.witnessChats[witnessId] ?? []), turn],
          },
        })),

      setTrust: (witnessId, value) =>
        set((s) => ({
          witnessTrust: {
            ...s.witnessTrust,
            [witnessId]: Math.min(100, Math.max(0, value)),
          },
        })),

      revealFact: (factId) =>
        set((s) =>
          s.revealedFacts.includes(factId)
            ? {}
            : { revealedFacts: [...s.revealedFacts, factId] }
        ),

      markEvidencePresented: (witnessId, evidenceId) =>
        set((s) =>
          (s.presentedEvidence[witnessId] ?? []).includes(evidenceId)
            ? {}
            : {
                presentedEvidence: {
                  ...s.presentedEvidence,
                  [witnessId]: [...(s.presentedEvidence[witnessId] ?? []), evidenceId],
                },
              }
        ),

      // ── Board ─────────────────────────────────────────────────────────
      addLink: (a, b, verdict) =>
        set((s) => {
          const exists = s.links.some(
            (l) => (l.a === a && l.b === b) || (l.a === b && l.b === a)
          )
          if (exists) return {}
          return { links: [...s.links, { a, b, verdict }] }
        }),

      setCardPosition: (id, pos) =>
        set((s) => ({
          boardPositions: { ...s.boardPositions, [id]: pos },
        })),

      placeTimelineEvent: (slot, eventId) =>
        set((s) => ({
          timelinePlacement: { ...s.timelinePlacement, [slot]: eventId },
        })),

      flagContradiction: (id) =>
        set((s) =>
          s.contradictionsFlagged.includes(id)
            ? {}
            : { contradictionsFlagged: [...s.contradictionsFlagged, id] }
        ),

      // ── Entity ────────────────────────────────────────────────────────
      addAttention: (delta) =>
        set((s) => {
          const raw = s.entity.attention + delta
          // Cap at 99 until verdict is submitted
          const capped = s.verdict ? Math.min(99, Math.max(0, raw)) : Math.min(99, Math.max(0, raw))
          const stage = attentionToStage(capped)
          return {
            entity: { ...s.entity, attention: capped, stage },
          }
        }),

      fireRule: (ruleId) =>
        set((s) => {
          if (s.entity.firedRules.includes(ruleId)) return {}
          // Presentation only: the entity shows itself in the room (never changes facts)
          useFxStore.getState().manifest(ruleId)
          return { entity: { ...s.entity, firedRules: [...s.entity.firedRules, ruleId] } }
        }),

      disturbEvidence: (id) =>
        set((s) =>
          s.entity.disturbed.includes(id)
            ? {}
            : { entity: { ...s.entity, disturbed: [...s.entity.disturbed, id] } }
        ),

      lockObject: (id, durationMs = 120_000) =>
        set((s) =>
          s.entity.lockedObjects.includes(id)
            ? {}
            : {
                entity: {
                  ...s.entity,
                  lockedObjects: [...s.entity.lockedObjects, id],
                  locks: {
                    ...(s.entity.locks ?? {}),
                    [id]: { until: Date.now() + durationMs, atInspected: s.inspectedObjects.length },
                  },
                },
              }
        ),

      unlockObject: (id) =>
        set((s) => {
          const locks = { ...(s.entity.locks ?? {}) }
          delete locks[id]
          return {
            entity: {
              ...s.entity,
              lockedObjects: s.entity.lockedObjects.filter((o) => o !== id),
              locks,
            },
          }
        }),

      // A lock ends after its time runs out or after two more inspections.
      // Locks without a record (older saves) are released immediately.
      expireLocks: (now = Date.now()) =>
        set((s) => {
          const locks = s.entity.locks ?? {}
          const keep = s.entity.lockedObjects.filter((id) => {
            const l = locks[id]
            if (!l) return false
            return now < l.until && s.inspectedObjects.length - l.atInspected < 2
          })
          if (keep.length === s.entity.lockedObjects.length) return {}
          const nextLocks = Object.fromEntries(Object.entries(locks).filter(([id]) => keep.includes(id)))
          return { entity: { ...s.entity, lockedObjects: keep, locks: nextLocks } }
        }),

      // Clearing a disturbance is one click and never touches the evidence itself
      reverifyEvidence: (id) =>
        set((s) => ({
          entity: { ...s.entity, disturbed: s.entity.disturbed.filter((d) => d !== id) },
        })),

      addEntityMessage: (msg) =>
        set((s) => ({
          entity: { ...s.entity, messages: [...s.entity.messages, msg] },
        })),

      plantEvidence: (id) =>
        set((s) =>
          s.collectedEvidence[id]
            ? {}
            : {
              collectedEvidence: {
                ...s.collectedEvidence,
                [id]: { at: Date.now(), flags: ['entity-planted'] },
              },
            }
        ),

      // ── Theory & verdict ───────────────────────────────────────────────
      setTheory: (theory) => set({ theory }),

      setVerdict: (verdict) =>
        set((s) => ({
          verdict,
          entity: { ...s.entity, stage: 4 },
        })),

      // ── UI ─────────────────────────────────────────────────────────────
      setLastRoute: (route) =>
        set((s) => ({ ui: { ...s.ui, lastRoute: route } })),

      toggleMute: () =>
        set((s) => {
          const muted = !(s.audio ?? DEFAULT_AUDIO).muted
          return { ui: { ...s.ui, muted }, audio: { ...(s.audio ?? DEFAULT_AUDIO), muted } }
        }),

      setAudio: (patch) =>
        set((s) => ({ audio: { ...(s.audio ?? DEFAULT_AUDIO), ...patch } })),

      markCinematicSeen: (id) =>
        set((s) => (s.seenCinematics?.includes(id) ? {} : { seenCinematics: [...(s.seenCinematics ?? []), id] })),

      unlockAchievement: (id) =>
        set((s) => {
          if (s.achievements?.includes(id)) return {}
          useFxStore.getState().toast(id)
          return { achievements: [...(s.achievements ?? []), id] }
        }),

      markIntroSeen: () =>
        set((s) => ({ ui: { ...s.ui, seenIntro: true } })),

      // ── Meta ───────────────────────────────────────────────────────────
      // A new investigation keeps the player's audio settings
      resetStore: () => set((s) => ({ ...INITIAL_STATE, audio: s.audio ?? { ...DEFAULT_AUDIO } })),
    }),
    {
      name: 'haunting-save-v1',
      storage: createJSONStorage(() => {
        // Guard against SSR and test environments where localStorage may be undefined
        if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          }
        }
        return window.localStorage
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[store] save could not be read; starting fresh')
          setTimeout(() => {
            try { window.localStorage.removeItem('haunting-save-v1') } catch { /* ignore */ }
            void useGameStore.persist.rehydrate()
          }, 0)
          return
        }
        if (!state) return
        const migrated = migrateState(state as unknown as Record<string, unknown>)
        if (!migrated) {
          // Unknown version: start fresh
          state.resetStore()
        } else if (state.version !== CURRENT_VERSION) {
          // Older save: keep progress, add the new fields
          setTimeout(() => useGameStore.setState(migrated as Partial<GameStore>), 0)
        }
      },
    }
  )
)

// ── Helpers ────────────────────────────────────────────────────────────────

function attentionToStage(attention: number): 0 | 1 | 2 | 3 | 4 {
  if (attention >= 70) return 3
  if (attention >= 40) return 2
  if (attention >= 15) return 1
  return 0
}
