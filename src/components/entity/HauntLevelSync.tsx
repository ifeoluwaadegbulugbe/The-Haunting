'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { evaluateEntityRules, dispatchEntityActions } from '@/lib/entity'
import { playSound } from '@/lib/audio'
import { CASE_001 } from '@/data/case001'
import { EntityOverlay } from './EntityOverlay'

/**
 * Global entity presence, rendered once in the root layout.
 * - Syncs --haunt-level with the entity stage (0 once a verdict is stored).
 * - Draws the vignette and grain for the current level.
 * - Fires stage rules (ER-08) on whichever page the player is on.
 */
export function HauntLevelSync() {
  const stage = useGameStore((s) => s.entity.stage)
  const solved = useGameStore((s) => Boolean(s.verdict))
  const [overlay, setOverlay] = useState<string | null>(null)

  // Entity effects are retired after the case is solved
  const level = solved ? 0 : stage

  useEffect(() => {
    document.documentElement.style.setProperty('--haunt-level', String(level))
  }, [level])

  useEffect(() => {
    if (solved || stage < 1) return
    const s = useGameStore.getState()
    const actions = evaluateEntityRules(s, { type: 'stageReached', ref: String(stage) }, CASE_001)
    if (actions.length === 0) return
    dispatchEntityActions(actions, s, s.investigator.name, (line) => {
      playSound('heartbeat', useGameStore.getState().ui.muted)
      setOverlay(line)
    })
  }, [stage, solved])

  // Intensity per level: vignette strength and grain opacity (text stays readable)
  const vignette = [0, 0.25, 0.4, 0.55, 0.7][level] ?? 0
  const grain = [0, 0.03, 0.05, 0.08, 0.1][level] ?? 0

  return (
    <>
      {level > 0 && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 40,
            background: `radial-gradient(ellipse at center, transparent 55%, rgba(14,12,16,${vignette}) 100%)`,
          }}
        >
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: grain }}>
            <filter id="haunt-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#haunt-grain)" />
          </svg>
        </div>
      )}
      {overlay && <EntityOverlay open text={overlay} onDismiss={() => setOverlay(null)} />}
    </>
  )
}
