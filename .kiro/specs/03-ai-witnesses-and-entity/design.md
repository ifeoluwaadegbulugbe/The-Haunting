# Spec 03 — AI Witnesses and Entity: Design

---

## 1. AI provider layer (`src/lib/ai/witness/`)

### 1.1 `provider.ts`

```ts
export interface AIProvider {
  complete(prompt: string, options: { temperature: number; maxTokens: number }): Promise<string>
}
```

**MockProvider** — used in all tests (`AI_MOCK=1`):
- Parses `ALLOWED FACTS:` block from the prompt.
- Returns the first allowed fact as a valid JSON witness reply.
- Never makes a network call; always resolves synchronously via `Promise.resolve`.

**GeminiProvider** — `generateContent` REST endpoint:
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
Authorization: Bearer {AI_API_KEY}
```
Wraps `AbortController` for 12-second timeout.

**GroqProvider** — OpenAI-compatible endpoint:
```
POST https://api.groq.com/openai/v1/chat/completions
Authorization: Bearer {AI_API_KEY}
```

**`getProvider()`** — reads env, returns the right instance. Called only from
server routes; never imported in client bundles.

### 1.2 `resolver.ts`

Input type (matches the API request snapshot):
```ts
interface ResolverInput {
  witnessId: string
  presentedEvidenceId?: string
  snapshot: {
    collectedEvidenceIds: string[]
    revealedFactIds: string[]
    trust: number
    recentTurns: ChatTurn[]
  }
}
```

Output:
```ts
interface ResolverOutput {
  allowedFacts: WitnessFact[]
  lockedFacts:  WitnessFact[]
  activeLieLines: string[]      // permitted lie lines currently applicable
  trustDelta: number
  revealGuarantee: WitnessFact[] // facts that must appear in the reply
}
```

Logic:
1. `allowedFacts` = facts where `evaluateCondition(fact.revealWhen, snapshotState)` is true.
2. `lockedFacts`  = the rest.
3. `activeLieLines`: for each fact in `allowedFacts` with `lieAllowedUntil`, check if the condition is still unmet — if so, include `deniedLine`.
4. `trustDelta`: sum `trustRule.delta` for every `trustRule` whose `on` matches `'presented-' + presentedEvidenceId` (if provided).
5. `revealGuarantee`: `allowedFacts` whose `id` is not in `revealedFactIds`.

### 1.3 `prompt-builder.ts`

```ts
export function buildWitnessPrompt(
  witness: Witness,
  output: ResolverOutput,
  recentTurns: ChatTurn[],
  presentedEvidence?: Evidence
): string
```

Assembles the prompt template from `ai-guardrails.md §1`. Formats
`allowedFacts` as `{id}: {statement}` lines. Caps `recentTurns` at 8.

### 1.4 `validator.ts`

```ts
export const WitnessReplySchema = z.object({
  reply:        z.string(),
  usedFactIds:  z.array(z.string()),
  mood:         MoodSchema,
})
export type WitnessReply = z.infer<typeof WitnessReplySchema>

export function validateReply(
  raw: string,
  allowedFactIds: string[],
  lockedFacts: WitnessFact[]
): { ok: boolean; reply?: WitnessReply; reason?: string }
```

Runs all six checks from §ai-guardrails §2 in order. Short-circuits on first
failure, returns `{ ok: false, reason }`.

Word count: `raw.split(/\s+/).filter(Boolean).length`.

Forbidden-token check: for each locked fact, for each token in
`fact.forbiddenTokens`, test `reply.toLowerCase().includes(token.toLowerCase())`.

---

## 2. Witness API route (`src/app/api/witness/route.ts`)

### 2.1 Request schema (Zod)

```ts
const WitnessRequestSchema = z.object({
  witnessId:          z.enum(['julian', 'margaret', 'dorothea']),
  message:            z.string().min(1).max(300),
  presentedEvidenceId: z.string().optional(),
  snapshot: z.object({
    collectedEvidenceIds: z.array(z.string()).max(50),
    revealedFactIds:      z.array(z.string()).max(50),
    trust:                z.number().min(0).max(100),
    recentTurns: z.array(z.object({
      role: z.enum(['player', 'witness']),
      text: z.string().max(400),
    })).max(8),
  }),
})
```

### 2.2 Rate limiter

```ts
// In-memory map: IP → { count, resetAt }
const rateLimits = new Map<string, { count: number; resetAt: number }>()
```

Per-request: if `count >= 12` and `Date.now() < resetAt`, return a 200 with a
scripted cooldown reply (`witness.fallbackLines.pressure[0]`) and `fallback: true`.
Reset window: 60 seconds.

IP from `request.headers.get('x-forwarded-for') ?? '0.0.0.0'`.

### 2.3 Pipeline (in route handler)

```
1. Parse + validate body → 400 on failure
2. Rate limit check → 200 with fallback if exceeded
3. Find witness in CASE_001.witnesses
4. resolveWitnessTurn(input, witness, CASE_001)
5. buildWitnessPrompt(witness, resolverOutput, recentTurns, presentedEvidence)
6. provider.complete(prompt, { temperature: 0.6, maxTokens: 300 })
   with 12s AbortController timeout → catch → fallback
7. validateReply(raw, allowedFactIds, lockedFacts)
   → on fail: retry once with stricter suffix
   → on second fail: fallback
8. Build revealGuarantee lines
9. Return { reply, usedFactIds, newlyRevealed, trustDelta, mood, fallback? }
```

### 2.4 Response shape

```ts
{
  reply:          string   // what the player sees
  usedFactIds:    string[]
  newlyRevealed:  Array<{ factId: string; statementId?: string; statement: string }>
  trustDelta:     number
  mood:           'calm' | 'afraid' | 'defensive' | 'cold'
  fallback?:      true     // hidden flag; client logs but does not show to player
}
```

---

## 3. Witness UI components (`src/components/witness/`)

### 3.1 `WitnessPortrait.tsx`

Props: `witness: Witness`, `trust: number`

Left column layout:
- Full portrait image in `ArchiveFrame`, ~300px tall, dark vignette overlay.
- Witness name in Cormorant Garamond 700, role in Inter 12px.
- `TrustMeter` below.

### 3.2 `TrustMeter.tsx`

Props: `trust: number` (0–100)

Three states: Low (0–33), Guarded (34–66), Open (67–100).
Rendered as a narrow filled bar in `--burgundy` with label text.

### 3.3 `ChatBubble.tsx`

Props: `role: 'player' | 'witness'`, `text: string`, `mood?: string`

- Player: right-aligned, `--parchment-dark` background, Cormorant Garamond 16px.
- Witness: left-aligned, `--brown` background, Cormorant Garamond 16px.

### 3.4 `TypingDots.tsx`

Three dots with staggered scale animation (Framer Motion), `--parchment-dark`
colour. Shown while `isLoading` is true.

### 3.5 `EvidencePicker.tsx`

A `Modal` listing collected evidence items. Each row: name + kind icon.
Clicking selects the item and closes the modal.

### 3.6 Witness switcher

Three `WitnessPortrait` thumbnails (small, 48px) at the top of the page.
Clicking navigates to `/case/001/witnesses/[id]` using `router.push`. Each
shows a small trust indicator dot.

---

## 4. Witness interrogation page (`src/app/case/001/witnesses/[id]/page.tsx`)

Replace the stub with the full layout:

```
┌──────────────────────────────────────────────────────────┐
│  [← HQ]  Margaret Hale · Dorothea Pryce · Julian Ashworth│  ← switcher
├──────────────────────────────────────────────────────────┤
│  WitnessPortrait      │  Chat panel                      │
│  (portrait + trust)   │  ─────────────────               │
│                       │  [chat turns...]                 │
│                       │  [TypingDots if loading]         │
│                       │  ─────────────────               │
│                       │  [input field + send]            │
│                       │  [Present Evidence]              │
└──────────────────────────────────────────────────────────┘
```

State: `isLoading`, `input`, `showPicker`.

On send:
1. Append player turn to store (`addChatTurn`).
2. POST to `/api/witness` with snapshot from store.
3. On response: append witness turn, call `revealFact` for each newly revealed
   fact, `setTrust(witnessId, trust + trustDelta)`, dispatch entity events.
4. On network error: show scripted fallback, never an error message.

---

## 5. Entity engine (`src/lib/entity/`)

### 5.1 `engine.ts`

```ts
export interface EntityEvent {
  type: 'objectInspected' | 'evidenceCollected' | 'contradictionConfirmed'
       | 'factRevealed' | 'stageReached' | 'linksReached' | 'conclusionOpened'
  ref?: string
  count?: number
}

export interface EntityAction {
  ruleId:      string
  action:      EntityRule['action']
  targetRef?:  string
  line:        string        // interpolated (name substituted)
  attentionDelta: number
}

export function evaluateEntityRules(
  state: GameState,
  event: EntityEvent,
  caseData: Case001
): EntityAction[]
```

Rule matching logic:
- `trigger.type === event.type` — match on type first.
- `trigger.ref === event.ref` (if trigger has a ref) — match specific ref.
- `trigger.count` — for `linksReached`, count valid links in `state.links` ≥ `trigger.count`.
- `rule.minStage <= state.entity.stage`.
- `once: true` → `!state.entity.firedRules.includes(rule.id)`.
- `{name}` in `lines[0]` is replaced with the investigator name.

### 5.2 `dispatcher.ts`

```ts
export type OverlayCallback = (line: string) => void

export function dispatchEntityActions(
  actions:         EntityAction[],
  storeActions:    GameStoreActions,
  investigatorName: string,
  onOverlay?:      OverlayCallback
): void
```

Processes each action in order. `lockout` sets a 120-second `setTimeout` to
call `unlockObject`. All store mutations happen synchronously except the timer.

### 5.3 `--haunt-level` updater

A `useEffect` in `src/app/layout.tsx` (or a dedicated client component
`HauntLevelSync`) reads `entity.stage` from the store and sets:
```js
document.documentElement.style.setProperty('--haunt-level', String(stage))
```
Runs whenever `entity.stage` changes.

---

## 6. File map

```
src/lib/ai/witness/
  provider.ts        AIProvider interface + MockProvider + GeminiProvider + GroqProvider + getProvider
  resolver.ts        resolveWitnessTurn
  prompt-builder.ts  buildWitnessPrompt
  validator.ts       validateReply + WitnessReplySchema
  index.ts           re-exports

src/lib/entity/
  engine.ts          evaluateEntityRules
  dispatcher.ts      dispatchEntityActions
  index.ts           re-exports

src/app/api/witness/route.ts    POST handler
src/app/api/entity/route.ts     GET stub (P1 — entity flavour text)

src/components/witness/
  WitnessPortrait.tsx
  TrustMeter.tsx
  ChatBubble.tsx
  TypingDots.tsx
  EvidencePicker.tsx
  index.ts

src/app/case/001/witnesses/[id]/page.tsx   full implementation
```
