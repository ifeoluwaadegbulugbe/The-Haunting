# Case 001 truth — THE HOUSE THAT CALLS BACK

**This file is sacred. Never edit it without explicit developer approval. The AI may phrase things; it may never decide facts. All IDs in this file must exist verbatim in `src/data/case001/`.**

---

## 9.1 The truth (canonical)

The Ashworths lived at Ashworth House on Hollow Lane: Edmund (44), Clara (41) and Lily (9). On 11 November 2008, Edmund's cousin Julian, deep in debt and holding a will amendment naming himself heir, came to the house to make Edmund sign it. Edmund refused. In the argument (recorded on Edmund's study recorder) Julian killed Edmund at 23:09, then locked Clara and Lily in the cellar to buy time. Julian did not know about the cellar telephone extension. At 23:13 Clara used it to call the neighbour Margaret Hale. Margaret saw Julian's car, was afraid, and let it ring. Julian left, and the next morning paid the housekeeper Dorothea Pryce to tell police the family had left before dark. Julian flew abroad on 12 November. Police closed the case as a voluntary disappearance.

**Why it still rings:** The entity is Clara's echo. Every night at 11:13 the cellar extension calls the one person who never answered. Caller ID reads ASHWORTH H. EXT 2.

### Answers to the five investigation objectives

1. **Who is making the calls?** Clara's echo, from the cellar extension.
2. **Why did the family disappear?** Julian killed Edmund and trapped Clara and Lily to secure a forged inheritance.
3. **What happened on the final night?** See the timeline in §9.3.
4. **Why does it keep calling?** Margaret never answered the call for help.
5. **Which witness concealed the most important information?** Margaret, who withheld that the 23:13 call reached her. (Julian is the culprit; Dorothea was bribed.)

---

## 9.2 Characters

| ID | Name | Role | Profile |
|---|---|---|---|
| `edmund` | Edmund Ashworth | Victim | Stern, private. Refused his cousin's pressure. |
| `clara` | Clara Ashworth | Victim / entity | Warm, observant, kept a diary. |
| `lily` | Lily Ashworth | Victim | Nine. Her drawing hints at the cellar. |
| `julian` | Julian Ashworth | Witness: Family Relative (culprit) | Charming, polite, deflects with concern. Cornered, he becomes precise and cold. |
| `margaret` | Margaret Hale | Witness: Neighbour | Cooperative but frightened. Guilt-ridden. Lies only about the call. |
| `dorothea` | Dorothea Pryce | Witness: Former Housekeeper | Defensive, proud, protecting herself. Lies about the family leaving. |
| `beatrice` | Aunt Beatrice | Off-screen | Recipient of Clara's voicemail. Never interviewed. |

---

## 9.3 Canonical timeline (seven events, in order)

| ID | Order | Time | Event |
|---|---|---|---|
| `TL-01` | 1 | 11 Nov, 16:55 | Dorothea clocks out and leaves the house |
| `TL-02` | 2 | 21:40 | Julian arrives at the house |
| `TL-03` | 3 | 22:50 | Clara leaves a voicemail for Aunt Beatrice |
| `TL-04` | 4 | 23:05 | Edmund refuses to sign; argument is recorded |
| `TL-05` | 5 | 23:09 | Edmund is killed; Clara and Lily are locked in the cellar |
| `TL-06` | 6 | 23:13 | Clara calls Margaret from the cellar extension; no answer |
| `TL-07` | 7 | 12 Nov, 07:12 | Julian emails Dorothea the cover story and arranges payment |

---

## 9.4 Evidence catalogue

All evidence defaults to `genuine` except where noted. `core` items are required for a perfect score.

| ID | Name | Source | Reliability | Relevance | Events | What it establishes |
|---|---|---|---|---|---|---|
| `EV-01` | Rotary Telephone | Scene | high | core | TL-06 | Label reads Ext 2, Cellar. A second handset exists. |
| `EV-02` | Torn Family Photograph | Scene | high | supporting | TL-02 | Christmas 2007. A figure torn from the right edge. |
| `EV-03` | Clara's Diary | Scene | high | core | TL-02 | Entries about Julian's visits and money. Final pages torn out. A small key taped inside the back cover. |
| `EV-04` | Newspaper Clippings | Scene | medium | supporting | TL-01 | Official account: family left before dark, Julian was abroad. Partly false. |
| `EV-05` | Photograph Strip | Cabinet | high | core | TL-02 | The torn strip: Julian's hand on Lily's shoulder, Christmas 2007. Julian scratched himself out. |
| `EV-06` | Unsigned Will Amendment | Cabinet | high | core | TL-04 | Names Julian as heir. Edmund's signature line is blank. |
| `EV-07` | Final Night Recording | Study recorder | high | core | TL-04, TL-05 | 23:05 to 23:09. Julian's voice: "You'll sign it, Edmund." A crash. Then silence. |
| `EV-08` | Housekeeper's Logbook | Behind clock | high | core | TL-01, TL-07 | Dorothea clocked out 16:55 on 11 Nov. Notes Julian asked to copy house keys. |
| `EV-09` | Lily's Drawing | Belongings | medium | supporting | TL-05 | Crayon: a car, a house, and two figures below ground. Dated 10 Nov. |
| `EV-10` | Creditor Final Notice | Under rug | high | supporting | TL-04 | Julian's debt, final notice October 2008. Motive. |
| `EV-11` | Telephone Company Ledger | Telco records | high | core | TL-06 | 21:12 Julian's mobile to house. 23:13 Ext 2 outgoing to Margaret Hale, 41 seconds, unanswered. |
| `EV-12` | Recovered Voicemail | Clara's laptop | high | core | TL-03 | 22:50. Clara to Beatrice: "Julian is here. Edmund won't let him in the study. I'll call you back." |
| `EV-13` | Recovered Email | Clara's laptop (deleted) | high | core | TL-07 | 12 Nov 07:12, Julian to Dorothea: "They left before dark. Say it exactly like that. Envelope on Thursday." |
| `EV-14` | Digital Photograph | Edmund's mobile | high | core | TL-02 | Timestamp 22:31. Julian's car in the drive, figure at the porch. |
| `EV-15` | Julian's Social Profile | Edmund's mobile (cached) | medium | supporting | TL-07 | Status posted 12 Nov 11:02: "Boarding to Lisbon." |
| `EV-X1` | Disturbed Photograph | Entity (planted) | low | red-herring | none | Appears to show Dorothea at the study window at 23:00. Manipulated. Metadata reveals an original from Christmas 2003. **authenticity: manipulated** |

---

## 9.5 Scene objects (nine hotspots)

| Object ID | Condition to inspect | Yields |
|---|---|---|
| `OBJ-telephone` | none (triggers the first entity moment) | EV-01 |
| `OBJ-photograph` | none | EV-02 |
| `OBJ-diary` | none | EV-03 |
| `OBJ-clippings` | none | EV-04 |
| `OBJ-clock` | hasEvidence EV-01 | EV-08 |
| `OBJ-recorder` | hasEvidence EV-01 | EV-07 |
| `OBJ-cabinet` | hasEvidence EV-03 (the key) | EV-05, EV-06 |
| `OBJ-belongings` | hasEvidence EV-02 | EV-09 |
| `OBJ-rug` | hasEvidence EV-09 | EV-10 |

---

## 9.6 Digital Archives (recovered devices)

The Archive section unlocks when the player holds **EV-01 and EV-07**.

| Record ID | Device | State | Recovery condition | Yields |
|---|---|---|---|---|
| `DR-telco` | Telephone Records | visible | none | EV-11 |
| `DR-photo` | Edmund's Mobile gallery | visible | none | EV-14 |
| `DR-profile` | Edmund's Mobile browser cache | visible | none | EV-15 |
| `DR-voicemail` | Clara's Laptop, Deleted Items | ghosted | hasEvidence EV-04 | EV-12 |
| `DR-email` | Clara's Laptop, Deleted Items | ghosted | hasEvidence EV-08 | EV-13 |

Add 8–10 ordinary records (family texts, a grocery email, a school note) that yield no evidence. They give texture and let the player practise comparing sources.

---

## 9.7 Witnesses

Witnesses unlock when the player holds **at least three digital-archive evidence items** (from EV-11, EV-12, EV-13, EV-14, EV-15).

### Margaret Hale — cooperative, frightened

Warm and apologetic, repeats worries, avoids the phone call. Her permitted lie is M4.

| Fact ID | Statement | Reveal when | Lie allowed |
|---|---|---|---|
| `M1` | Lives 400 metres up Hollow Lane. Knew the family well. | always | no |
| `M2` | The phone rings at 11:13 most nights; she never answers. | always | no |
| `M3` | Saw a car in the Ashworth drive that night. | presented EV-14, or trust ≥ 60 | yes, denies it |
| `M4` | Her phone rang at 11:13 on 11 Nov 2008 and she let it ring. | presented EV-11 | yes, until EV-11 (statement `ST-M-DENY`: "I never got any call") |
| `M5` | She recognised the car as Julian's. | M4 revealed | no |
| `M6` | Julian visited her a week later and warned her to stay quiet. | M5 revealed and trust ≥ 70 | no |

### Dorothea Pryce — deceptive, defensive

Clipped replies, pride in her work, offended by suggestion. Her permitted lie is D2.

| Fact ID | Statement | Reveal when | Lie allowed |
|---|---|---|---|
| `D1` | Worked for the family nine years and left at 16:55 that day. | always | no |
| `D2` | The family drove away before dark. | stated first | yes, until EV-08 or EV-12 presented (statement `ST-D-LEFT`) |
| `D3` | Julian asked her to copy the house keys a week earlier. | presented EV-08 | no |
| `D4` | Julian paid her to tell police the family left. | presented EV-13 | no |
| `D5` | She never returned to the house after 16:55 and fears the family never left. | D4 revealed, or presented EV-X1 | no |

### Julian Ashworth — evasive, charming

Concerned, rehearsed, polite. He never confesses. His lies are damaged by evidence, not admitted.

| Fact ID | Statement | Reveal when | Lie allowed |
|---|---|---|---|
| `J1` | Edmund's cousin; helped with the family finances. | always | no |
| `J2` | He was in Lisbon from 10 November. | stated first | yes, until EV-14 or EV-15 presented (statement `ST-J-ABROAD`) |
| `J3` | Edmund and Clara talked of emigrating. | stated first | yes, until EV-03 presented (statement `ST-J-EMIGRATE`) |
| `J4` | He visited the house that evening to discuss money. | presented EV-14 | no |
| `J5` | There was an argument about the will, but Edmund was alive when he left. | presented EV-07 or EV-06 | yes (partly a lie, never refuted by confession) |
| `J6` | At maximum pressure he asks for a lawyer. | trust < 10 | no |

**Forbidden topics (all witnesses):** the cellar's contents, what the entity is, where the bodies are. Witnesses answer with fear or confusion.

---

## 9.8 Contradictions (deterministic)

| ID | Side A | Side B | Severity | Meaning |
|---|---|---|---|---|
| `CX-01` | `ST-M-DENY` | `EV-11` | major | Margaret denies a call that the ledger records |
| `CX-02` | `ST-D-LEFT` | `EV-12` | major | Clara was alive and speaking at 22:50 |
| `CX-03` | `ST-J-ABROAD` | `EV-14` | major | Julian's car at the house at 22:31 |
| `CX-04` | `ST-J-ABROAD` | `EV-15` | major | Julian posted from the airport on 12 Nov |
| `CX-05` | `ST-J-EMIGRATE` | `EV-03` | minor | The diary shows no plan to leave |
| `CX-06` | `EV-04` | `EV-14` | minor | The newspaper says Julian was abroad |
| `CX-07` | `EV-X1` | `EV-08` | major | Dorothea clocked out at 16:55; she was never at the window |

A contradiction becomes **available** when the player holds both sides. It becomes **confirmed** only when the player flags the pair. Confirming a contradiction never requires the AI.

---

## 9.9 Valid evidence links (the board's ground truth)

| Pair | Type | Why it holds |
|---|---|---|
| EV-01 ↔ EV-11 | supports | Ext 2 is the cellar line that made the 23:13 call |
| EV-01 ↔ EV-09 | supports | Lily drew people underground; the Ext 2 label points to a cellar |
| EV-02 ↔ EV-05 | supports | The strip is the torn part of the photograph |
| EV-05 ↔ EV-14 | supports | The same man at the house in 2007 and again that night |
| EV-06 ↔ EV-07 | supports | The recording is about the unsigned will |
| EV-06 ↔ EV-10 | supports | Debt gives Julian a motive |
| EV-07 ↔ EV-14 | timeline | Julian was present on the night of the argument |
| EV-08 ↔ EV-13 | supports | The logbook proves the cover story was false |
| EV-12 ↔ EV-07 | timeline | Clara was alive at 22:50; the argument followed |
| EV-03 ↔ EV-06 | supports | The diary records Edmund refusing more money |
| EV-11 ↔ EV-12 | timeline | Two calls from the house that night |
| EV-13 ↔ EV-15 | timeline | Julian's actions after the event |
| EV-X1 ↔ EV-08 | contradicts | Same as CX-07 |

Any other pair is judged **invalid**, shown as "Not conclusive", and costs the player nothing.

---

## 9.10 The entity

**Identity:** Clara's echo, drawn out of the cellar telephone by unfinished need.  
**Motive:** To be answered, and to learn whether the investigator will look where others did not.  
**Personality:** Quiet, precise, grieving. Never cartoonish.  
**Knowledge:** Knows the truth of the case and the player's game state (what has been discovered, in what order). Does not know what the player is typing before it is sent.

### Attention points

| Action | Points |
|---|---|
| Inspect an object | +2 |
| Collect core evidence | +6 |
| Collect supporting evidence | +3 |
| Confirm a contradiction | +10 |
| Valid link made | +5 |
| Witness fact revealed | +4 |
| Present key evidence to a witness | +4 |

Attention is capped at 99 until the theory is submitted.

### Entity stages

| Stage | Name | Attention | Behaviour |
|---|---|---|---|
| 0 | Dormant | 0–14 | Atmosphere only: faint ring, flickers |
| 1 | Aware | 15–39 | Messages, small audio disturbances |
| 2 | Interfering | 40–69 | Temporary lockouts, disturbed evidence, plants the false lead |
| 3 | Hostile | 70–99 | Overlays, apparitions, direct address using the investigator's name |
| 4 | Revealed | on submission | The final sequence |

### Entity rules

| Rule ID | Trigger | Min stage | Action | Authored lines |
|---|---|---|---|---|
| `ER-01` | OBJ-telephone first inspected | 0 | overlay: phone rings once, clock snaps to 11:13 | *(no text)* |
| `ER-02` | EV-07 collected | 0 | message + disturb EV-07 (transcript garbled until re-verified) | "You were not supposed to hear that." |
| `ER-03` | First contradiction confirmed | 1 | message | "Careful. Some doors are closed for a reason." |
| `ER-04` | EV-14 collected | 2 | lockout OBJ-rug for 120 s or two discoveries | *(no text; hotspot flickers crimson)* |
| `ER-05` | M4 revealed | 1 | apparition: portrait flickers, phone rings in chat | "She never picked up." |
| `ER-06` | Three valid links made and stage 2 | 2 | plant EV-X1 | "You were not supposed to find that." |
| `ER-06b` | Player opens Conclusion and EV-X1 not yet planted | any | plant EV-X1 (fail-safe) | "You were not supposed to find that." |
| `ER-07` | CX-07 confirmed | any | message + drop attention by 30 | "You looked. No one ever looks." |
| `ER-08` | Stage 3 reached | 3 | overlay with direct address | "I know you, {name}. You are standing where she stood." |

### Hard limits (the code must enforce all of these)

The entity may:
- Set a `disturbed` flag (cleared by re-verifying the item — one click, never destroys data)
- Set a temporary lockout that auto-expires
- Add EV-X1 to the evidence pool
- Show messages and overlays

The entity may **never**:
- Remove evidence
- Edit case data
- Change a fact
- Block the Conclusion screen
- Make the mystery unsolvable

EV-X1 is always disprovable through CX-07.

---

## 9.11 Optional hidden clues (added with developer approval)

Extra clues hidden inside item close-ups. Relevance `optional`: they reward thoroughness (a rating out of 4 and achievements) but are **never** required for progress, are excluded from the progress percentage and do not change the 100-point score. None of them contradicts §9.1.

| ID | Name | Found by | Relates to |
|---|---|---|---|
| `OC-01` | Signet Ring | Magnifying the torn edge of EV-02 | Julian, TL-02 |
| `OC-02` | Scratched Clock Case | Opening the back of the mantel clock (EV-08) | Clara, TL-06 |
| `OC-03` | Detective's Note | Turning over the third clipping (EV-04) | Julian, Margaret, TL-02 |
| `OC-04` | Lily's Secret | Turning over Lily's drawing (EV-09) | Lily, Clara, TL-06 |
