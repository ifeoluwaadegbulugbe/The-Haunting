import { z } from 'zod'
import { EntityRuleSchema } from '@/types'
import type { EntityRule } from '@/types'

export const ENTITY_RULES: EntityRule[] = [
  {
    id: 'ER-01',
    trigger: { type: 'objectInspected', ref: 'OBJ-telephone' },
    minStage: 0,
    once: true,
    action: 'overlay',
    lines: [],
    attentionDelta: 0,
    // Overlay: the phone rings once, the clock snaps to 11:13.
    // No text. The action speaks for itself.
  },
  {
    id: 'ER-02',
    trigger: { type: 'evidenceCollected', ref: 'EV-07' },
    minStage: 0,
    once: true,
    action: 'disturb',
    targetRef: 'EV-07',
    lines: ['You were not supposed to hear that.'],
    attentionDelta: 0,
    // Disturbs EV-07 (transcript garbled until re-verified) and sends a message.
  },
  {
    id: 'ER-03',
    trigger: { type: 'contradictionConfirmed' },
    minStage: 1,
    once: true,
    action: 'message',
    lines: ['Careful. Some doors are closed for a reason.'],
    attentionDelta: 0,
  },
  {
    id: 'ER-04',
    trigger: { type: 'evidenceCollected', ref: 'EV-14' },
    minStage: 2,
    once: true,
    action: 'lockout',
    targetRef: 'OBJ-rug',
    lines: [],
    attentionDelta: 0,
    // Locks OBJ-rug for 120 seconds or two discoveries. No text — hotspot flickers crimson.
  },
  {
    id: 'ER-05',
    trigger: { type: 'factRevealed', ref: 'M4' },
    minStage: 1,
    once: true,
    action: 'apparition',
    lines: ['She never picked up.'],
    attentionDelta: 0,
    // Portrait flickers; phone rings in the chat panel.
  },
  {
    id: 'ER-06',
    trigger: { type: 'linksReached', count: 3 },
    minStage: 2,
    once: true,
    action: 'plant',
    targetRef: 'EV-X1',
    lines: ['You were not supposed to find that.'],
    attentionDelta: 0,
  },
  {
    id: 'ER-06b',
    trigger: { type: 'conclusionOpened' },
    minStage: 0,
    once: true,
    action: 'plant',
    targetRef: 'EV-X1',
    lines: ['You were not supposed to find that.'],
    attentionDelta: 0,
    // Fail-safe: plants EV-X1 if the player reaches the Conclusion without it.
  },
  {
    id: 'ER-07',
    trigger: { type: 'contradictionConfirmed', ref: 'CX-07' },
    minStage: 0,
    once: true,
    action: 'message',
    lines: ['You looked. No one ever looks.'],
    attentionDelta: -30,
    // Drops attention by 30 — the entity retreats when found out.
  },
  {
    id: 'ER-08',
    trigger: { type: 'stageReached', ref: '3' },
    minStage: 3,
    once: true,
    action: 'overlay',
    lines: ['I know you, {name}. You are standing where she stood.'],
    attentionDelta: 0,
    // {name} is replaced at runtime with the investigator's name.
  },
]

// Validate at import time
z.array(EntityRuleSchema).parse(ENTITY_RULES)
