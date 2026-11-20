import { create } from 'zustand'

/**
 * Short-lived presentation events (never saved): entity manifestations,
 * evidence cards flying to the inventory, achievement toasts.
 * Game rules never read this store.
 */

export interface Manifestation { id: number; ruleId: string; at: number }
export interface FlyingCard { id: number; evidenceId: string; from: { x: number; y: number } }
export interface AchievementToast { id: number; achievementId: string }

interface FxStore {
  manifestations: Manifestation[]
  flying: FlyingCard[]
  toasts: AchievementToast[]
  manifest: (ruleId: string) => void
  clearManifestation: (id: number) => void
  fly: (evidenceId: string, from: { x: number; y: number }) => void
  landed: (id: number) => void
  toast: (achievementId: string) => void
  dismissToast: (id: number) => void
}

let seq = 0

export const useFxStore = create<FxStore>()((set) => ({
  manifestations: [],
  flying: [],
  toasts: [],
  manifest: (ruleId) =>
    set((s) => ({ manifestations: [...s.manifestations, { id: ++seq, ruleId, at: Date.now() }] })),
  clearManifestation: (id) =>
    set((s) => ({ manifestations: s.manifestations.filter((m) => m.id !== id) })),
  fly: (evidenceId, from) =>
    set((s) => ({ flying: [...s.flying, { id: ++seq, evidenceId, from }] })),
  landed: (id) => set((s) => ({ flying: s.flying.filter((f) => f.id !== id) })),
  toast: (achievementId) =>
    set((s) => ({ toasts: [...s.toasts, { id: ++seq, achievementId }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
