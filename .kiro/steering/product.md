# Product: THE HAUNTING

## What it is

THE HAUNTING is a paranormal investigation game built for Kiroween 2026 (Frankenstein category). The player is an investigator at a private Victorian archive assigned to Case 001: *The House That Calls Back*. They explore a haunted house, read recovered phone and laptop records, interrogate three AI-driven witnesses, collect evidence, expose contradictions, and pin everything to an evidence board before submitting a theory. A deterministic engine scores the theory and reveals the truth.

## The differentiator

The entity being investigated is also investigating the player. It watches what the player discovers, reacts to meaningful events, sends messages, disturbs evidence, and at one point plants a false lead. It can never change the truth of the case, delete essential evidence, or make the mystery unsolvable.

## The rule that must never be broken

**AI writes the words. Code decides the facts.**

Every clue, contradiction, score and entity action is driven by structured data and deterministic rules. The AI model may only phrase dialogue and flavour text. It may never decide facts, scores, unlocks, entity actions, or anything else that affects game state.

Concretely:
- Each witness has a fixed list of facts. The model only phrases replies using the facts the engine has already determined it may reveal.
- The theory is scored deterministically against the case file. The model may write a narrative wrap of the reveal, nothing more.
- The entity's actions are chosen by a rule table. The model may optionally rephrase an authored line; it never chooses the action.

## Tagline

INVESTIGATE · UNCOVER · BE FOUND

(There is no health or survival system. "Survive" was removed.)

## Target

Single player, English only. Desktop first, with graceful tablet and mobile layouts. Deploy to Vercel.
