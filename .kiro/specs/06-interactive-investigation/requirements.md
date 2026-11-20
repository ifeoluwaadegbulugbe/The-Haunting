# Spec 06 — Interactive investigation: requirements

## Goal

Replace the remaining read-and-click moments with things the player does with their hands. The rule "AI writes the words, code decides the facts" is unchanged. Every new interaction is decided by case data, and none can block the case.

## Requirements

### R1 Challenge a statement (interviews)
1. Every statement a witness has made is a card in the "On the record" panel, with a Challenge action. Broken lies show the lie that was told.
2. Challenging opens the evidence picker ("What proves this wrong?"). If the statement and the evidence form a pair in §9.8, the screen shakes, a CONTRADICTED stamp lands, the witness is cornered and the contradiction is confirmed. Otherwise an IT HOLDS stamp shows and nothing changes.

### R2 Device puzzles (Digital Archives)
1. Clara's laptop is locked. The password is in her diary. Hints escalate after 2, 4 and 6 wrong attempts; the last gives the answer.
2. The deleted voicemail is rebuilt by scrubbing a damaged tape; words appear as the playhead passes.
3. Edmund's photo is enhanced in two steps (the car, then its plate) before it can be logged. After two misses a button offers the next step.
4. Puzzles never change what a record yields or when a section unlocks. Older saves holding laptop evidence skip the lock.

### R3 Physical evidence board
1. The string in your hand swings on a spring. A correct link twangs tight; a wrong one goes slack and falls.
2. Cards are tilted by hand and show the item's photograph or a small drawn document.
3. The timeline is a line of pegged cards, earliest to latest.

### R4 The 11:13 calls
1. Three calls (§9.10) ring once each at fixed moments. Answer: attention −5 and the line is heard as text. Let it ring (20 s): attention +5 and an entity message. No other effect.

### R5 Investigator's notebook
1. A notebook beside "Next lead" lists open questions that answer themselves from evidence and facts, contradictions held (proven or not), and recent finds.

### R6 Lily's room
1. An optional second location, open once EV-09 is held, explored by torchlight (with a "Light the lamp" toggle). It holds OC-05 and OC-06 and atmosphere.
2. Uses `public/assets/scene/lily-room.jpg` when supplied, otherwise a drawn room.

## Out of scope
- Voice. New core evidence. Any change to scoring.
