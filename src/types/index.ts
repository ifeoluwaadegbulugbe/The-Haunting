import { z } from 'zod'

// ── Primitives ──────────────────────────────────────────────────────────────

export const AuthenticitySchema = z.enum(['genuine', 'misleading', 'manipulated'])
export const ReliabilitySchema = z.enum(['high', 'medium', 'low'])
export const EvidenceKindSchema = z.enum([
  'physical', 'document', 'photo', 'audio', 'message',
  'email', 'callRecord', 'profile', 'statement',
])
// 'optional' = hidden extra clues: they reward thoroughness but never gate progress or score
export const RelevanceSchema = z.enum(['core', 'supporting', 'red-herring', 'optional'])
export const DeceptionSchema = z.enum(['cooperative', 'evasive', 'deceptive'])
export const MoodSchema = z.enum(['calm', 'afraid', 'defensive', 'cold'])
export const DeviceSchema = z.enum(['mobile', 'laptop', 'telco'])
export const DigitalKindSchema = z.enum([
  'sms', 'email', 'call', 'voicemail', 'photo', 'profile', 'note',
])
export const LinkTypeSchema = z.enum(['supports', 'contradicts', 'timeline'])
export const ContradictionSeveritySchema = z.enum(['minor', 'major'])
export const EntityActionSchema = z.enum([
  'message', 'disturb', 'plant', 'lockout', 'overlay', 'apparition',
])
export const ConditionCheckTypeSchema = z.enum([
  'hasEvidence', 'hasFact', 'hasContradiction', 'presentedEvidence', 'stageAtLeast',
  'trustAtLeast', 'trustBelow',
])

// ── Condition (recursive) ───────────────────────────────────────────────────
// z.lazy() is required for recursive schemas; we write one manual type alias.

const ConditionCheckSchema = z.object({
  type: ConditionCheckTypeSchema,
  ref: z.union([z.string(), z.number()]),
})

// Manual type alias (the one permitted exception to the z.infer rule)
export type Condition = {
  allOf?: Array<z.infer<typeof ConditionCheckSchema>>
  anyOf?: Array<z.infer<typeof ConditionCheckSchema>>
}

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.object({
    allOf: z.array(ConditionCheckSchema).optional(),
    anyOf: z.array(ConditionCheckSchema).optional(),
  })
)

// ── Evidence ────────────────────────────────────────────────────────────────

export const EvidenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  kind: EvidenceKindSchema,
  source: z.string(),
  location: z.string(),
  reliability: ReliabilitySchema,
  authenticity: AuthenticitySchema.default('genuine'),
  relevance: RelevanceSchema,
  relatedCharacters: z.array(z.string()),
  relatedEvents: z.array(z.string()),
  refutedBy: z.array(z.string()).optional(),
  assetPath: z.string().optional(),
})

export type Evidence = z.infer<typeof EvidenceSchema>

// ── SceneObject ─────────────────────────────────────────────────────────────

export const SceneObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  hotspot: z.object({
    x: z.number(), // percentage 0–100
    y: z.number(),
    r: z.number(), // radius in percentage units
  }),
  locationId: z.string(),
  yieldsEvidence: z.array(z.string()),
  discoveryCondition: ConditionSchema.optional(),
  relatedCharacters: z.array(z.string()),
  storyRelevance: z.string(),
})

export type SceneObject = z.infer<typeof SceneObjectSchema>

// ── DigitalRecord ───────────────────────────────────────────────────────────

export const DigitalRecordSchema = z.object({
  id: z.string(),
  device: DeviceSchema,
  kind: DigitalKindSchema,
  timestamp: z.string(), // ISO or display string
  content: z.unknown(),
  deleted: z.boolean(),
  recoveryCondition: ConditionSchema.optional(),
  yieldsEvidence: z.string().optional(),
})

export type DigitalRecord = z.infer<typeof DigitalRecordSchema>

// ── WitnessFact ─────────────────────────────────────────────────────────────

export const WitnessFactSchema = z.object({
  id: z.string(),
  truth: z.string(),
  statement: z.string(),
  revealWhen: ConditionSchema,
  lieAllowedUntil: ConditionSchema.optional(),
  deniedLine: z.string().optional(),
  forbiddenTokens: z.array(z.string()),
  yieldsStatementId: z.string().optional(),
})

export type WitnessFact = z.infer<typeof WitnessFactSchema>

// ── Witness ─────────────────────────────────────────────────────────────────

export const WitnessSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  portrait: z.string(),
  background: z.string(),
  relationship: z.string(),
  personality: z.string(),
  motive: z.string(),
  deception: DeceptionSchema,
  speechStyle: z.string(),
  facts: z.array(WitnessFactSchema),
  forbiddenTopics: z.array(z.string()),
  fallbackLines: z.object({
    greeting: z.array(z.string()),
    unknown: z.array(z.string()),
    evasive: z.array(z.string()),
    pressure: z.array(z.string()),
  }),
  trustRules: z.array(z.object({
    on: z.string(),
    delta: z.number(),
  })),
})

export type Witness = z.infer<typeof WitnessSchema>

// ── TimelineEvent ───────────────────────────────────────────────────────────

export const TimelineEventSchema = z.object({
  id: z.string(),
  label: z.string(),
  time: z.string(),
  order: z.number(),
  requires: z.array(z.string()).optional(),
})

export type TimelineEvent = z.infer<typeof TimelineEventSchema>

// ── ContradictionRule ───────────────────────────────────────────────────────

export const ContradictionRuleSchema = z.object({
  id: z.string(),
  a: z.string(),
  b: z.string(),
  explanation: z.string(),
  severity: ContradictionSeveritySchema,
})

export type ContradictionRule = z.infer<typeof ContradictionRuleSchema>

// ── LinkRule ────────────────────────────────────────────────────────────────

export const LinkRuleSchema = z.object({
  a: z.string(),
  b: z.string(),
  type: LinkTypeSchema,
  explanation: z.string(),
})

export type LinkRule = z.infer<typeof LinkRuleSchema>

// ── EntityTrigger ───────────────────────────────────────────────────────────

export const EntityTriggerSchema = z.object({
  type: z.enum(['objectInspected', 'evidenceCollected', 'contradictionConfirmed',
    'factRevealed', 'stageReached', 'linksReached', 'conclusionOpened']),
  ref: z.string().optional(),
  count: z.number().optional(),
})

export type EntityTrigger = z.infer<typeof EntityTriggerSchema>

// ── EntityRule ──────────────────────────────────────────────────────────────

export const EntityRuleSchema = z.object({
  id: z.string(),
  trigger: EntityTriggerSchema,
  minStage: z.number().int().min(0).max(4),
  once: z.boolean(),
  action: EntityActionSchema,
  targetRef: z.string().optional(),
  lines: z.array(z.string()),
  attentionDelta: z.number(),
})

export type EntityRule = z.infer<typeof EntityRuleSchema>

// ── Theory ──────────────────────────────────────────────────────────────────

export const TheorySchema = z.object({
  culprit: z.enum(['Julian', 'Margaret', 'Dorothea', 'The entity', 'Unknown']),
  whatHappened: z.string(),
  whyCallsContinue: z.string(),
  timelinePlacement: z.record(z.string()),  // slotId -> eventId
  witnessReliability: z.record(
    z.enum(['Honest', 'Concealing', 'Lying'])
  ),
  manipulatedEvidence: z.string(),
  supportingEvidence: z.object({
    culpritAndMotive: z.array(z.string()),
    timeline: z.array(z.string()),
    coverUp: z.array(z.string()),
  }),
  summary: z.string().max(400).optional(),
})

export type Theory = z.infer<typeof TheorySchema>

// ── EntityMessageRecord ─────────────────────────────────────────────────────

export const EntityMessageRecordSchema = z.object({
  id: z.string(),
  text: z.string(),
  at: z.number(),
})

export type EntityMessageRecord = z.infer<typeof EntityMessageRecordSchema>

// ── GameState ────────────────────────────────────────────────────────────────

export const AudioSettingsSchema = z.object({
  master: z.number().min(0).max(1),
  music: z.number().min(0).max(1),
  ambient: z.number().min(0).max(1),
  sfx: z.number().min(0).max(1),
  muted: z.boolean(),
})

export type AudioSettings = z.infer<typeof AudioSettingsSchema>

export const GameStateSchema = z.object({
  // v1 saves are upgraded in place (see store/migrations.ts)
  version: z.union([z.literal(1), z.literal(2)]),
  audio: AudioSettingsSchema,
  seenCinematics: z.array(z.string()),
  achievements: z.array(z.string()),
  // Device puzzles solved in the Digital Archives (presentation gates only; never change unlock rules)
  deviceUnlocks: z.array(z.string()).default([]),
  // The 11:13 calls the player answered or let ring
  calls: z.record(z.enum(['answered', 'ignored'])).default({}),
  investigator: z.object({
    name: z.string(),
    startedAt: z.number(),
  }),
  discoveredObjects: z.array(z.string()),
  inspectedObjects: z.array(z.string()),
  collectedEvidence: z.record(z.object({
    at: z.number(),
    flags: z.array(z.string()),
  })),
  recoveredRecords: z.array(z.string()),
  witnessChats: z.record(
    z.array(z.object({
      role: z.enum(['player', 'witness']),
      text: z.string(),
      at: z.number(),
    }))
  ),
  witnessTrust: z.record(z.number()),
  revealedFacts: z.array(z.string()),
  presentedEvidence: z.record(z.array(z.string())),
  contradictionsFlagged: z.array(z.string()),
  links: z.array(z.object({
    a: z.string(),
    b: z.string(),
    verdict: z.enum(['valid', 'invalid', 'contradiction']),
  })),
  boardPositions: z.record(z.object({
    x: z.number(),
    y: z.number(),
  })),
  timelinePlacement: z.record(z.string()),
  entity: z.object({
    attention: z.number().min(0).max(99),
    stage: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    firedRules: z.array(z.string()),
    disturbed: z.array(z.string()),
    lockedObjects: z.array(z.string()),
    // Lockouts expire after a time or after N further inspections (never permanent)
    locks: z.record(z.object({ until: z.number(), atInspected: z.number() })).default({}),
    messages: z.array(EntityMessageRecordSchema),
  }),
  theory: TheorySchema.optional(),
  verdict: z.object({
    score: z.number(),
    breakdown: z.record(z.number()),
    rank: z.string(),
  }).optional(),
  ui: z.object({
    lastRoute: z.string(),
    muted: z.boolean(),
    seenIntro: z.boolean(),
  }),
})

export type GameState = z.infer<typeof GameStateSchema>
