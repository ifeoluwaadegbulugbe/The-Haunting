/**
 * Motion tokens. Every animation in the game takes its timing and easing from here,
 * so the whole experience moves with one rhythm.
 */
export const ease = {
  // settling into place (panels, cards, cameras)
  settle: [0.22, 0.61, 0.36, 1] as const,
  // leaving or snapping away
  exit: [0.55, 0, 1, 0.45] as const,
  // gentle in-out for slow cinematic moves
  drift: [0.45, 0, 0.55, 1] as const,
}

export const dur = {
  tap: 0.12,
  quick: 0.25,
  base: 0.45,
  slow: 0.7,
  scene: 1.1,
  cinematic: 2.4,
}

export const spring = {
  card: { type: 'spring' as const, stiffness: 320, damping: 28 },
  panel: { type: 'spring' as const, stiffness: 300, damping: 30 },
  soft: { type: 'spring' as const, stiffness: 140, damping: 22 },
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
