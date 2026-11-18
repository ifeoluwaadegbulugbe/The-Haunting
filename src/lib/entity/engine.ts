import type { GameState } from '@/types'
import type { Case001 } from '@/data/case001'

export interface EntityEvent {
  type: 'objectInspected' | 'evidenceCollected' | 'contradictionConfirmed'
      | 'factRevealed' | 'stageReached' | 'linksReached' | 'conclusionOpened'
  ref?:   string
  count?: number
}

export interface EntityAction {
  ruleId:         string
  action:         'message' | 'disturb' | 'plant' | 'lockout' | 'overlay' | 'apparition'
  targetRef?:     string
  line:           string
  attentionDelta: number
}

export function evaluateEntityRules(
  state: GameState,
  event: EntityEvent,
  caseData: Case001
): EntityAction[] {
  const actions: EntityAction[] = []

  for (const rule of caseData.entityRules) {
    const trigger = rule.trigger

    // Type must match
    if (trigger.type !== event.type) continue

    // Ref must match if trigger has one
    if (trigger.ref !== undefined && trigger.ref !== event.ref) continue

    // For linksReached: count valid links
    if (trigger.type === 'linksReached' && trigger.count !== undefined) {
      const validLinkCount = state.links.filter((l) => l.verdict === 'valid').length
      if (validLinkCount < trigger.count) continue
    }

    // Min stage check
    if (rule.minStage > state.entity.stage) continue

    // Once-only check
    if (rule.once && state.entity.firedRules.includes(rule.id)) continue

    // Interpolate {name} in line
    const line = (rule.lines[0] ?? '').replace(
      /\{name\}/g,
      state.investigator.name || 'Investigator'
    )

    actions.push({
      ruleId:         rule.id,
      action:         rule.action,
      targetRef:      rule.targetRef,
      line,
      attentionDelta: rule.attentionDelta,
    })
  }

  return actions
}
