import type { EntityAction } from './engine'

export type OverlayCallback = (line: string) => void

// Minimal store action interface — avoids importing the full Zustand store
export interface EntityStoreActions {
  addEntityMessage: (msg: { id: string; text: string; at: number }) => void
  disturbEvidence:  (id: string) => void
  plantEvidence:    (id: string) => void
  lockObject:       (id: string) => void
  unlockObject:     (id: string) => void
  fireRule:         (ruleId: string) => void
  addAttention:     (delta: number) => void
}

let _msgCounter = 0

export function dispatchEntityActions(
  actions:         EntityAction[],
  storeActions:    EntityStoreActions,
  _investigatorName: string,
  onOverlay?:      OverlayCallback
): void {
  for (const action of actions) {
    // Always mark the rule as fired
    storeActions.fireRule(action.ruleId)

    // Apply attention delta
    if (action.attentionDelta !== 0) {
      storeActions.addAttention(action.attentionDelta)
    }

    switch (action.action) {
      case 'message':
        storeActions.addEntityMessage({
          id:   `entity-msg-${++_msgCounter}`,
          text: action.line,
          at:   Date.now(),
        })
        break

      case 'disturb':
        if (action.targetRef) {
          storeActions.disturbEvidence(action.targetRef)
        }
        // Also send message if there is a line
        if (action.line) {
          storeActions.addEntityMessage({
            id:   `entity-msg-${++_msgCounter}`,
            text: action.line,
            at:   Date.now(),
          })
        }
        break

      case 'plant':
        if (action.targetRef) {
          storeActions.plantEvidence(action.targetRef)
        }
        if (action.line) {
          storeActions.addEntityMessage({
            id:   `entity-msg-${++_msgCounter}`,
            text: action.line,
            at:   Date.now(),
          })
        }
        break

      case 'lockout':
        if (action.targetRef) {
          storeActions.lockObject(action.targetRef)
          // Auto-unlock after 120 seconds
          setTimeout(() => {
            storeActions.unlockObject(action.targetRef!)
          }, 120_000)
        }
        break

      case 'overlay':
      case 'apparition':
        if (onOverlay && action.line) {
          onOverlay(action.line)
        }
        break
    }
  }
}
