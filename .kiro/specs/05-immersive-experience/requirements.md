# Spec 05 — Immersive experience: requirements

## Goal

Turn the working case into something that feels like a game: music from the first screen, sound on every interaction, motion throughout, rooms instead of menus, and interactive close-ups instead of text panels. The rule "AI writes the words, code decides the facts" is unchanged. No voice acting.

## Requirements

### R1 Audio
1. Background music starts from the title screen once the player passes an "Enter the archive" gate (browsers block autoplay).
2. Every click, pickup, drawer, page, stamp, thread and entity event has a sound effect.
3. Separate volume controls for master, music, ambience and effects, plus mute. Settings persist.
4. Every sound plays its file from `public/assets/audio/` if present and falls back to a synthesised sound if not. A missing file never breaks the game.
5. The soundscape changes per route (HQ, scene, archive, interview, board, conclusion) and with the entity stage.

### R2 HQ room
1. `/hq` is an explorable room: desk (case file), cabinet (case archive), wall (evidence board), telephone, clock, locked door.
2. The telephone rings until the case assignment has been heard. It stops once the case is solved.
3. The room shows SOLVED once a verdict exists.

### R3 Case assignment cinematic
1. Picking up the HQ telephone plays a skippable briefing. It is shown once and can be replayed from the case file.

### R4 Scene and close-ups
1. The scene uses a shared room stage with zoom, parallax, dust and fog.
2. Close-ups are interactive: open the diary cover, flip clippings, magnify the photograph, play the tape, open the clock.
3. Collected items fly to the evidence tray.

### R5 Optional hidden clues
1. OC-01..OC-04 (truth file §9.11) are found inside close-ups.
2. They are excluded from progress and score and never gate progress. They count toward a thoroughness rating (/4) and achievements.

### R6 Interview room
1. Typewriter replies, mood shown on the portrait, a "STORY CHANGED" stamp when a lie breaks, a statement list and suggested questions.

### R7 Entity manifestations
1. Each fired entity rule triggers a visual manifestation (glitch, flicker, overlay). The rule table still chooses the action.

### R8 Board and reveal
1. Valid links show a short explanation of why they hold. A correct timeline shows a SEQUENCE HOLDS stamp.
2. The reveal walks through the night, the witnesses reconsidered, the entity and the cellar, then shows the report card.

### R9 Progression
1. Ten achievements, a profile page, and the thoroughness rating.
2. Save version 2 migrates v1 saves in place without losing progress.

### R10 Accessibility
1. `prefers-reduced-motion` replaces motion with fades. Body contrast stays at or above 4.5:1. Every sound has a visual counterpart.

## Out of scope
- Voice acting.
- The archive compare tool (deferred).
- Generated photoreal art: the user supplies images and music per `docs/ASSETS.md`; drawn fallbacks are used until then.
