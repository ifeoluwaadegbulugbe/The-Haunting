import type { GameState, SceneObject } from '@/types'
import type { Case001 } from '@/data/case001'
import { evaluateCondition } from '@/lib/engine/conditions'

/**
 * Returns the scene objects whose discoveryCondition is currently met.
 * Objects with no discoveryCondition are always collectable.
 */
export function getCollectableObjects(
  state: GameState,
  caseData: Case001
): SceneObject[] {
  return caseData.scene.filter((obj) => {
    if (!obj.discoveryCondition) return true
    return evaluateCondition(obj.discoveryCondition, state)
  })
}
