export { CASE_TRUTH } from './truth'
export type { CaseTruth } from './truth'

export { TIMELINE_EVENTS } from './timeline'
export { EVIDENCE_ITEMS } from './evidence'
export { SCENE_OBJECTS } from './scene'
export { DIGITAL_RECORDS } from './digital'
export { WITNESSES } from './witnesses'
export { CONTRADICTION_RULES } from './contradictions'
export { LINK_RULES } from './links'
export { ENTITY_RULES } from './entity-rules'

import { CASE_TRUTH } from './truth'
import { TIMELINE_EVENTS } from './timeline'
import { EVIDENCE_ITEMS } from './evidence'
import { SCENE_OBJECTS } from './scene'
import { DIGITAL_RECORDS } from './digital'
import { WITNESSES } from './witnesses'
import { CONTRADICTION_RULES } from './contradictions'
import { LINK_RULES } from './links'
import { ENTITY_RULES } from './entity-rules'

export const CASE_001 = {
  truth:          CASE_TRUTH,
  timeline:       TIMELINE_EVENTS,
  evidence:       EVIDENCE_ITEMS,
  scene:          SCENE_OBJECTS,
  digital:        DIGITAL_RECORDS,
  witnesses:      WITNESSES,
  contradictions: CONTRADICTION_RULES,
  links:          LINK_RULES,
  entityRules:    ENTITY_RULES,
} as const

export type Case001 = typeof CASE_001
