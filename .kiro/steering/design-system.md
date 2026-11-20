# Design system

**Inclusion rule:** load this file when editing `src/components/**` or `src/styles/**`.

## Visual identity

The Gothic Case Archive — a Victorian paranormal investigation department's private archive. Cinematic horror is used sparingly and purposefully. The interface is calm at rest; horror intensifies in direct proportion to what the entity knows about the player.

---

## 1. Colour tokens

Define all of these as CSS custom properties in `src/styles/tokens.css` and reference them through Tailwind's config. Never use a raw hex value in a component file.

| Token | Value | Use |
|---|---|---|
| `--obsidian` | `#171419` | Main background |
| `--ink` | `#0E0C10` | Deepest areas, overlays |
| `--burgundy` | `#421D29` | Panels, frames, trust fill |
| `--parchment` | `#D8C8AC` | Documents, primary text on dark |
| `--parchment-light` | `#EADFC9` | Document highlights |
| `--parchment-dark` | `#B9A98C` | Secondary document surfaces |
| `--gold` | `#A58A60` | Borders, rules, icons, active states |
| `--brown` | `#51413D` | Chat bubbles, cards, wood |
| `--candle` | `#E8B15D` | Glow only — never as a text colour |
| `--thread` | `#B5483A` | Player's red string (a physical object) |
| `--entity` | `#8F1D2C` | Entity base colour |
| `--entity-glow` | `#C0283D` | Entity glow / flicker — entity events only |
| `--verdigris` | `#5F7F6B` | Confirmed and valid states |

**Entity colour rule:** `--entity` and `--entity-glow` appear only in entity events and the Conclusion reveal. They must not be used in ordinary UI. If the entity colour is everywhere, it stops meaning anything. The `token-check` hook enforces this.

---

## 2. Typography

Load all fonts via `next/font/google` for self-hosting (no external requests at runtime).

| Role | Font | Notes |
|---|---|---|
| Wordmark | Cinzel | Title screen and crest only |
| Headings, case titles | Cormorant Garamond | Weights 500–700 |
| Interface and body | Inter | Navigation, buttons, chat input, labels |
| Annotations, diary, notes | Caveat | Restrained — short notes, stamps, margin scribbles only |

- Minimum body text: **16px**.
- Never set paragraphs in Caveat.
- Minimum contrast ratio for body text: **4.5:1** at every haunt level.

---

## 3. Spacing, shape and surface

- **Base spacing scale:** 4 px.
- **Border radii:** 2 px (documents), 4 px (buttons), 8 px (panels).
- **Archive frames:** 1 px gold border with a decorative corner SVG.
- **Paper texture:** tiled SVG noise filter, not large image files.
- **Tape, pins, stamps:** small SVG or PNG assets.
- **Shadows:** warm and soft (brown-black). Cards lifted on the board get deeper shadows.

---

## 4. Component list

Build each of these once and reuse them everywhere. Never duplicate a component with slightly different styles — extend via props.

```
ArchiveFrame      ParchmentCard     CaseFolder        Stamp
WaxSeal           PolaroidCard      EvidenceCard      Hotspot
ObjectPanel       EvidenceTray      TrustMeter        WitnessPortrait
ChatBubble        TypingDots        ThreadLine        TimelineSlot
ContradictionBadge  DeviceFrame     EntityMessage     EntityOverlay
ProgressBar       Button            Modal             Toast
```

### Button states (all variants must implement these)

| State | Appearance |
|---|---|
| Default | Standard fill |
| Hover | Gold border brightens |
| Focus | Visible 2 px gold ring |
| Pressed | Slight inset |
| Disabled | Lowered opacity + tooltip explaining why |
| Loading | Small candle-flame spinner |

---

## 5. Horror intensity — `--haunt-level`

A single CSS custom property, `--haunt-level` (integer 0–4), tracks the entity stage and drives:

- Vignette strength
- Film grain opacity
- Subtle text flicker
- Ambient audio volume

| Level | Description |
|---|---|
| 0 | Calm — no visual effects |
| 1 | Faint vignette, barely perceptible grain |
| 2 | Visible vignette, light flicker |
| 3 | Dark edges, noticeable grain |
| 4 | Maximum — final reveal only |

**Readability rule:** body text contrast stays at or above 4.5:1 at every level.

---

## 6. Motion and sound

- Use **Framer Motion** for panel transitions, stamp-down animations and the entity overlay.
- Keep each transition under **600 ms**, except the Conclusion reveal sequence.
- Honour `prefers-reduced-motion` by replacing animations with instant fades.
- **Sound (P1):** low ambient bed, telephone ring, page rustle, heartbeat for entity events.
- Muted by default until the player first interacts. Persistent mute control in a corner.
- Use the Web Audio engine in `src/lib/audio/engine.ts` (no sound library). Music starts after the title-screen "Enter the archive" gate.

---

## 7. Screen-by-screen notes

### Title screen (/)
Full-bleed mansion illustration, moon, wrought-iron gate, mist at base. Wordmark centred lower half: small "THE" above very large "HAUNTING" in carved serif, thin gold rule, tagline below. Primary button with thin burgundy-to-crimson ornamental frame. Slow mist drift, faint window-light flicker, very slow camera push — nothing may block the button.

### HQ (/hq)
Pinned parchment case file, ~1° tilt, torn edge. UNRESOLVED rubber stamp (rotated, ink texture). No heavy horror. Light vignette only. Candle at bottom corner.

### Scene Explorer (/case/001/scene)
Full-bleed illustrated study. Nine hotspot rings (percentage coordinates). Gold = undiscovered, dimmed = inspected, padlock = locked, crimson flicker = entity-disturbed. Object panel opens at the side as a parchment panel.

### Interrogation (/case/001/witnesses/[id])
Large portrait with dark vignette left; framed chat panel right. Player bubbles: parchment-dark, right-aligned. Witness bubbles: weathered brown, left-aligned. Serif body, readable size.

### Evidence Board (/case/001/evidence)
Cork-and-parchment wall. Cards draggable with absolute positioning. Threads are SVG paths — matte red with a slight sag. No graph library.

### Digital Archives (/case/001/archive)
Recovered-devices desk. Period-correct 2008 device interfaces inside antique frames. Deleted items ghosted until recovered.

---

## 8. Responsive breakpoints

| Viewport | Behaviour |
|---|---|
| ≥ 1024 px (desktop) | Full layouts as described above |
| Tablet | Side panels become bottom sheets; evidence board scrolls horizontally |
| Mobile | Hotspots tappable at ≥ 44 px; evidence board switches to list view with a Connect action |
