# Spec 03 — AI Witnesses and Entity: Requirements

## Scope

Witness API route (prompt builder, validator, fallback, rate limit), interrogation
UI, entity rule engine with actions (message, disturb, plant, lockout, overlay,
apparition), and the entity attention/stage system. The MockProvider is built here
so all AI tests can run without a real key.

---

## US-17 · AI provider interface and MockProvider

**As a developer,** I want a thin provider interface and a deterministic mock,
so that all tests run without network calls and the real provider is swappable.

- AC-17-1: `src/lib/ai/witness/provider.ts` exports interface `AIProvider`
  with `complete(prompt, options): Promise<string>`.
- AC-17-2: `MockProvider` returns a valid witness JSON reply using the first
  `allowedFact` from the prompt; it never makes a network call.
- AC-17-3: `GeminiProvider` calls `https://generativelanguage.googleapis.com`
  using plain `fetch` with `AI_API_KEY`. It is never imported in client code.
- AC-17-4: `getProvider()` reads `process.env.AI_MOCK === '1'` and
  `process.env.AI_PROVIDER` and returns the correct instance. Only call this
  from server routes.
- AC-17-5: `GroqProvider` is implemented as an alternative (calls
  `https://api.groq.com/openai/v1/chat/completions`).

---

## US-18 · Witness fact resolver (pure, deterministic)

**As a developer,** I want pure functions that determine which facts a witness
may reveal and how trust changes, so that the AI model never controls game state.

- AC-18-1: `src/lib/ai/witness/resolver.ts` exports `resolveWitnessTurn(input,
  witness, caseData)` → `{ allowedFacts, trustDelta, revealGuarantee }`.
- AC-18-2: `allowedFacts` contains only facts whose `revealWhen` condition is
  satisfied given the snapshot state.
- AC-18-3: `revealGuarantee` is the array of facts whose `revealWhen` is met
  but which have not yet appeared in `revealedFactIds` — these must be appended
  to the response regardless of model output.
- AC-18-4: Trust changes come from `trustRules` matched against the event
  string (e.g. `'presented-EV-11'`). No model involvement.
- AC-18-5: Vitest tests verify: locked facts excluded, trust delta correct,
  reveal guarantee fires when condition is met.

---

## US-19 · Witness reply validator

**As a developer,** I want a reply validator that rejects any model output
containing locked facts, meta words or structural problems, so that a successful
prompt injection still cannot reveal hidden information.

- AC-19-1: `src/lib/ai/witness/validator.ts` exports `validateReply(raw,
  allowedFactIds, lockedFacts)` → `{ ok: boolean; reply?: WitnessReply;
  reason?: string }`.
- AC-19-2: Rejects if JSON does not parse.
- AC-19-3: Rejects if `usedFactIds` contains IDs not in `allowedFactIds`.
- AC-19-4: Rejects if the reply text contains any `forbiddenTokens` from locked
  facts (case-insensitive substring match).
- AC-19-5: Rejects if the reply contains meta words: `AI`, `model`, `prompt`,
  `game`, `instructions`.
- AC-19-6: Rejects if reply is empty or exceeds 70 words.
- AC-19-7: Vitest tests cover all six rejection cases plus a valid pass.

---

## US-20 · Witness API route (`/api/witness`)

**As a developer,** I want a secure server route that orchestrates the witness
pipeline and never exposes provider errors to the client.

- AC-20-1: `POST /api/witness` accepts the request schema from §ai-guardrails.
- AC-20-2: Input validated with Zod; unknown witness IDs, oversized messages
  and missing fields return HTTP 400.
- AC-20-3: In-memory rate limit: 12 requests/minute per IP. Excess returns HTTP
  429 with a scripted cooldown message in the response body (not an error).
- AC-20-4: Pipeline: validate → resolve facts → build prompt → call provider
  (12 s timeout) → validate reply → retry once → reveal guarantee → return.
- AC-20-5: On provider timeout, 429, or double validation failure: return HTTP
  200 with a scripted fallback line and `fallback: true`.
- AC-20-6: Response body: `{ reply, usedFactIds, newlyRevealed, trustDelta,
  mood, fallback? }`. Never includes provider errors or raw model output.
- AC-20-7: Vitest tests (using MockProvider via `AI_MOCK=1`): timeout fallback,
  reveal guarantee, forbidden-token rejection, prompt injection produces no
  locked fact.

---

## US-21 · Witness interrogation UI

**As a player,** I want to interrogate witnesses through a chat interface where
I can present evidence and see trust change, so the investigation feels like a
real conversation.

- AC-21-1: `/case/001/witnesses/[id]` renders the full interrogation screen.
- AC-21-2: Left: `WitnessPortrait` (large portrait image, name, role, trust
  meter). Right: chat panel with header and scrolling turns.
- AC-21-3: Player bubbles right-aligned, parchment-dark. Witness bubbles
  left-aligned, brown. Serif body, 16 px min.
- AC-21-4: Input: `Ask a question…` text field (max 300 chars) with send icon.
  Disabled while a response is in-flight.
- AC-21-5: **Present Evidence** button opens a picker of collected evidence.
  Selecting an item sends a turn with `presentedEvidenceId` and marks it in the
  store via `markEvidencePresented`.
- AC-21-6: Witness switcher: three portrait thumbnails across the top.
  Switching preserves each witness's chat history.
- AC-21-7: `TypingDots` indicator while awaiting the server response.
- AC-21-8: On AI failure the player sees the scripted fallback line, never an
  error message.
- AC-21-9: Newly revealed facts are added to `revealedFacts` in the store;
  `setTrust` is called with the new value.
- AC-21-10: `TrustMeter` shows Low / Guarded / Open based on numeric trust
  (0–33 Low, 34–66 Guarded, 67–100 Open), with burgundy fill.
- AC-21-11: Entity moment ER-05: when M4 is newly revealed, the portrait
  flickers (CSS animation) and an entity message "She never picked up." is
  added to the store.
- AC-21-12: Navigating here calls `setLastRoute`.

---

## US-22 · Entity rule engine

**As a developer,** I want a pure function that evaluates entity rules against
game state and returns the actions to fire, so the entity never makes
non-deterministic decisions.

- AC-22-1: `src/lib/entity/engine.ts` exports `evaluateEntityRules(state,
  event, caseData)` → `EntityAction[]`.
- AC-22-2: An `EntityAction` is `{ ruleId, action, targetRef?, line }`.
- AC-22-3: A rule fires only if: its trigger matches the event, `minStage` is
  met, and (if `once: true`) its `ruleId` is not in `state.entity.firedRules`.
- AC-22-4: `attentionDelta` from fired rules is included in the return; the
  store applies it.
- AC-22-5: Hard limits: the engine never returns an action of type `remove`,
  `edit` or `block`; these would violate the entity contract.
- AC-22-6: Vitest tests: ER-01 fires once on telephone inspect; ER-02 fires on
  EV-07 collect; ER-04 fires only at stage ≥ 2; ER-07 returns attentionDelta
  -30; a rule with `once: true` does not fire twice.

---

## US-23 · Entity action dispatcher

**As a developer,** I want a dispatcher that translates `EntityAction` objects
into store mutations, so the UI never makes entity decisions.

- AC-23-1: `src/lib/entity/dispatcher.ts` exports `dispatchEntityActions(
  actions, storeActions, investigatorName)`.
- AC-23-2: `message` → `addEntityMessage({ id, text, at })`.
- AC-23-3: `disturb` → `disturbEvidence(targetRef)`.
- AC-23-4: `plant` → `plantEvidence(targetRef)` (adds to `collectedEvidence`
  with flag `entity-planted`).
- AC-23-5: `lockout` → `lockObject(targetRef)` and schedules
  `unlockObject(targetRef)` after 120 s via `setTimeout`.
- AC-23-6: `overlay` and `apparition` → set a local UI flag via a callback
  (not store state); the calling component decides rendering.
- AC-23-7: `fireRule(ruleId)` is always called after dispatch.

---

## US-24 · Entity integration in scene and witness pages

**As a player,** I want the entity to react visibly when I discover key
evidence or reveal important witness facts, so the investigation feels watched.

- AC-24-1: Scene page evaluates entity rules on every evidence collect and
  dispatches actions immediately.
- AC-24-2: ER-02 (EV-07 collected): entity message fires, EV-07 is marked
  disturbed in the store.
- AC-24-3: ER-04 (EV-14 collected, stage ≥ 2): OBJ-rug hotspot locks for 120 s;
  the locked hotspot shows the crimson disturbed ring.
- AC-24-4: ER-08 (stage 3 reached): `EntityOverlay` appears with the
  investigator's name interpolated.
- AC-24-5: Witness page evaluates entity rules on `factRevealed` events and
  dispatches ER-05 when M4 is newly revealed.
- AC-24-6: `--haunt-level` CSS variable on `<html>` is updated whenever the
  entity stage changes (0 = stage 0, through 4 = stage 4).
