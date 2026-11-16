# KIRO_USAGE.md — How Kiro shaped this build

This document records how Kiro's steering, specs, hooks and vibe chat were used throughout the development of THE HAUNTING (Kiroween 2026). It is part of the hackathon submission.

---

## Overview

THE HAUNTING was built over three days with Kiro as the lead engineering assistant. Every architectural decision was made through Kiro specs. All case data was authored once and protected by a Kiro hook. The AI guardrails that keep the game's witness system honest were written as a steering file that Kiro loads whenever it touches the AI layer.

---

## Steering files

Seven steering files in `.kiro/steering/` are always loaded or conditionally loaded:

| File | Loaded when | Purpose |
|---|---|---|
| `product.md` | always | Product summary, the entity differentiator, the core "AI writes words, code decides facts" rule |
| `tech.md` | always | Stack, approved packages, environment variables, the pure-module rule |
| `structure.md` | always | Folder layout and naming conventions |
| `case-001-truth.md` | always | The complete case design — every ID, fact, contradiction and rule, verbatim |
| `design-system.md` | editing `src/components/**` or `src/styles/**` | Colour tokens, typography, component list, horror intensity scale |
| `ai-guardrails.md` | editing `src/lib/ai/**` or `src/app/api/**` | Witness pipeline, prompt template, validation checks, fallback, security controls |
| `testing.md` | editing `tests/**` | Full test list, the golden path, test commands |

---

## Specs

Kiro produced four specs, each gated by developer approval before the next file was written.

*(This section will be filled in as each spec is approved and implemented.)*

| Spec | Status | Key decisions shaped by Kiro |
|---|---|---|
| 01-foundation | — | — |
| 02-investigation-engine | — | — |
| 03-ai-witnesses-and-entity | — | — |
| 04-evidence-and-conclusion | — | — |

---

## Hooks

| Hook | Trigger | What it catches |
|---|---|---|
| `validate-case-data` | Save of any file in `src/data/case001/` | Broken ID references (e.g. a contradiction pointing to a non-existent evidence ID) |
| `test-engine` | Save of `src/lib/engine`, `evidence`, `scoring` or `entity` | Failing Vitest tests in those modules |
| `token-check` | Save of `src/components/**/*.tsx` | Raw hex colours, arbitrary fonts, entity colours used outside entity components |
| `secrets-check` | Creation of `.env*` files or edits to `src/app/api/**` | Hard-coded keys, unprotected `.env` files |
| `usage-log` | A spec task is completed | Appends a dated entry to this file |

---

## Concrete examples

*(Three required examples for the submission — to be filled in during the build.)*

### Example 1 — the case-validation hook catching a broken ID
*To be written after the first time the hook fires in development.*

### Example 2 — the spec for the witness pipeline
*To be written after Spec 03 is approved.*

### Example 3 — the golden-path test generated from the acceptance criteria
*To be written after Spec 04 is approved.*

---

## Task log

*(Appended automatically by the `usage-log` hook after each approved task.)*

| Date | Task | Files changed |
|---|---|---|
| — | Steering files, .env.example, KIRO_USAGE.md stub created | `.kiro/steering/*`, `.env.example`, `docs/KIRO_USAGE.md` |
