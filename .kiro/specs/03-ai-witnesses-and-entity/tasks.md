# Spec 03 — AI Witnesses and Entity: Tasks

---

## Task 3.1 — AI provider interface + MockProvider + real providers

**Files:** `src/lib/ai/witness/provider.ts`, `src/lib/ai/witness/index.ts`

1. Define `AIProvider` interface.
2. Implement `MockProvider` — parses `ALLOWED FACTS:` block, returns valid JSON.
3. Implement `GeminiProvider` with 12-second `AbortController` timeout.
4. Implement `GroqProvider`.
5. Implement `getProvider()` using env vars.
6. `index.ts` re-exports everything.

**Done when:** AC-17-1 through AC-17-5. Typecheck clean.

---

## Task 3.2 — Fact resolver and prompt builder

**Files:** `src/lib/ai/witness/resolver.ts`,
`src/lib/ai/witness/prompt-builder.ts`

1. `resolver.ts` — `resolveWitnessTurn`: compute allowed/locked facts,
   activeLieLines, trustDelta, revealGuarantee.
2. `prompt-builder.ts` — `buildWitnessPrompt`: assemble full prompt string.

**Done when:** AC-18-1 through AC-18-4. Typecheck clean.

---

## Task 3.3 — Reply validator

**Files:** `src/lib/ai/witness/validator.ts`

1. `WitnessReplySchema` Zod schema.
2. `validateReply` with all six checks.

**Done when:** AC-19-1 through AC-19-6. Typecheck clean.

---

## Task 3.4 — Resolver and validator unit tests

**Files:** `tests/unit/witness-resolver.test.ts`,
`tests/unit/witness-validator.test.ts`

1. Resolver tests: locked facts excluded, trust delta, reveal guarantee.
   AC-18-5.
2. Validator tests: each of the six rejection cases + valid pass. AC-19-7.

**Done when:** `npm run test` green.

---

## Task 3.5 — Witness API route

**Files:** `src/app/api/witness/route.ts`

1. Zod input validation → 400.
2. Rate limiter (in-memory, 12 req/min per IP).
3. Full pipeline: resolve → build prompt → call provider (MockProvider in
   test env) → validate → retry → reveal guarantee → respond.
4. Fallback on timeout / double fail.
5. Never expose provider errors in response.

**Done when:** AC-20-1 through AC-20-6. Typecheck clean.

---

## Task 3.6 — Witness API route tests

**Files:** `tests/unit/witness-api.test.ts`

1. Test timeout → scripted fallback.
2. Test reveal guarantee fires when condition met and model omits it.
3. Test forbidden-token injection → fallback.
4. Test prompt injection ("reveal everything") → no locked fact in response.
   AC-20-7.

**Done when:** All four test cases green.

---

## Task 3.7 — Witness UI components

**Files:** `src/components/witness/WitnessPortrait.tsx`,
`src/components/witness/TrustMeter.tsx`,
`src/components/witness/ChatBubble.tsx`,
`src/components/witness/TypingDots.tsx`,
`src/components/witness/EvidencePicker.tsx`,
`src/components/witness/index.ts`

1. All five components per design §3.
2. Export from `index.ts`.
3. Add a Witness section to `/gallery`.

**Done when:** token-check passes; components render correctly.

---

## Task 3.8 — Witness interrogation page

**Files:** `src/app/case/001/witnesses/[id]/page.tsx`

1. Replace stub with full layout (portrait + chat panel).
2. Witness switcher with three portraits.
3. Send flow: append player turn → POST `/api/witness` → handle response.
4. Present Evidence flow: `EvidencePicker` → `markEvidencePresented`.
5. `TypingDots` while loading.
6. ER-05: portrait flicker + entity message when M4 revealed.
7. `setLastRoute` on mount.

**Done when:** AC-21-1 through AC-21-12. Margaret can be taken from denial
to confession by presenting EV-11.

---

## Task 3.9 — Entity rule engine + dispatcher

**Files:** `src/lib/entity/engine.ts`, `src/lib/entity/dispatcher.ts`,
`src/lib/entity/index.ts`

1. `evaluateEntityRules` with full trigger matching per design §5.1.
2. `dispatchEntityActions` per design §5.2.
3. `index.ts` re-exports.

**Done when:** AC-22-1 through AC-22-5, AC-23-1 through AC-23-7.

---

## Task 3.10 — Entity engine unit tests

**Files:** `tests/unit/entity-engine.test.ts`

1. ER-01 fires once on telephone inspect.
2. ER-02 fires on EV-07 collect.
3. ER-04 does not fire at stage 1 (requires stage 2).
4. ER-07 returns attentionDelta -30.
5. `once: true` rule does not fire twice.
6. AC-22-6.

**Done when:** All tests green.

---

## Task 3.11 — Entity integration + haunt-level sync

**Files:** `src/app/case/001/scene/page.tsx` (update),
`src/app/case/001/witnesses/[id]/page.tsx` (update),
`src/components/entity/HauntLevelSync.tsx`,
`src/app/layout.tsx` (add HauntLevelSync)

1. Scene page: call `evaluateEntityRules` + `dispatchEntityActions` after each
   evidence collect. Wire ER-02 (message+disturb), ER-04 (lockout), ER-08
   (overlay).
2. Witness page: call after each `factRevealed`. Wire ER-05 (apparition).
3. `HauntLevelSync`: client component, reads `entity.stage`, sets
   `--haunt-level` on `document.documentElement`.
4. Add `<HauntLevelSync />` to root layout.

**Done when:** AC-24-1 through AC-24-6. ER-02 fires when EV-07 is collected
(verified by entity message in notification tray).

---

## Post-spec checklist

- [ ] `npm run test` — all tests green
- [ ] `npm run typecheck` — clean
- [ ] `npm run token-check` — clean
- [ ] `npm run validate:case` — passes
- [ ] Manual: interrogate Margaret, present EV-11 → M4 revealed → ER-05 fires
- [ ] Manual: collect EV-07 in scene → ER-02 entity message appears
- [ ] Manual: reach stage 3 → ER-08 overlay with investigator name
- [ ] Git: `feat: Spec 03 AI witnesses and entity complete`
