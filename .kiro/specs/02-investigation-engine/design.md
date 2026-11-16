# Spec 02 — Investigation Engine: Design

---

## 1. Discovery and unlock engine (`src/lib/engine/`)

### 1.1 `conditions.ts`

Single exported function:

```ts
export function evaluateCondition(
  condition: Condition,
  state: Pick<GameState,
    'collectedEvidence' | 'revealedFacts' | 'contradictionsFlagged' |
    'presentedEvidence' | 'entity'>
): boolean
```

Logic:
- Empty object `{}` (no `allOf`, no `anyOf`) → `true`.
- `allOf`: every check must pass (`&&`).
- `anyOf`: at least one must pass (`||`).
- Each check dispatches on `type`:
  - `hasEvidence` → `ref in state.collectedEvidence`
  - `hasFact` → `state.revealedFacts.includes(ref as string)`
  - `hasContradiction` → `state.contradictionsFlagged.includes(ref as string)`
  - `presentedEvidence` → split `ref` on `:`, check
    `state.presentedEvidence[witnessId]?.includes(evidenceId)`
  - `stageAtLeast` → `state.entity.stage >= (ref as number)`

### 1.2 `index.ts`

Re-exports `evaluateCondition` and any future engine functions.

---

## 2. Evidence library (`src/lib/evidence/`)

### 2.1 `collection.ts`

```ts
export function getCollectableObjects(
  state: GameState,
  caseData: Case001
): SceneObject[]
```

Filters `caseData.scene` to objects whose `discoveryCondition` passes
`evaluateCondition`. An absent `discoveryCondition` is treated as `{}` (always
passes).

### 2.2 `links.ts`

```ts
export function evaluateLink(
  a: string,
  b: string,
  caseData: Case001
): 'valid' | 'invalid' | 'contradiction'
```

Looks up the pair in `caseData.links` order-insensitively
(`(r.a === a && r.b === b) || (r.a === b && r.b === a)`).

- Matched with `type: 'contradicts'` → `'contradiction'`
- Matched with `type: 'supports'` or `'timeline'` → `'valid'`
- Not found → `'invalid'`

---

## 3. Scene Explorer (`src/app/case/001/scene/page.tsx`)

### 3.1 Layout

Full-bleed image layer + absolutely-positioned hotspot layer + side panel + bottom tray:

```
┌─────────────────────────────────────────────────────────┐
│  [← Back to HQ]  [Explore the Scene]       [✕ close]   │  ← top bar
├─────────────────────────────────────────────────────────┤
│                                                         │
│          scene image (full bleed)                       │
│                                                         │
│   ◎  hotspot    ◎              ◎  hotspot               │
│           ◎          ◎   ◎                              │
│                 ◎        ◎                              │
├─────────────────────────────────────────────────────────┤
│  [thumb] [thumb] [thumb] ...          evidence tray     │
└─────────────────────────────────────────────────────────┘
                          ┌───────────────┐
                          │  ObjectPanel  │  ← slides in from right
                          └───────────────┘
```

### 3.2 `Hotspot` component (`src/components/scene/Hotspot.tsx`)

Props: `object: SceneObject`, `state: HotspotState`, `onClick: () => void`

`HotspotState`: `'undiscovered' | 'inspected' | 'locked' | 'disturbed'`

Rendered as an `<button>` absolutely positioned via inline `style`:
```css
left: {x}%;  top: {y}%;  width: {r*2}%;  height: {r*2}%;
transform: translate(-50%, -50%);
```

SVG ring inside:
- `undiscovered`: gold ring, CSS `pulse-ring` animation (from globals.css).
- `inspected`: gold ring, opacity 0.3, no animation.
- `locked`: faded ring + `<Lock>` lucide icon centred.
- `disturbed`: crimson ring with `flicker` animation — rendered through
  `src/components/entity/DisturbedHotspot.tsx` to keep entity colours
  in the entity directory.

Keyboard: `role="button"`, `aria-label={object.name}`,
`aria-pressed={state === 'inspected'}`.

### 3.3 `ObjectPanel` component (`src/components/scene/ObjectPanel.tsx`)

Slides in from the right using Framer Motion (`x: '100%'` → `x: 0`).
Renders inside a `ParchmentCard`.

Contents:
- Object name (Cormorant Garamond 700 24px)
- Description (Inter 16px)
- If locked: condition failure message in italic parchment-dark
- **Inspect** button (primary) — calls the collect sequence
- After inspection: "Collected" label + list of evidence names gathered

The panel is dismissed by clicking ✕ or pressing Escape.

### 3.4 `EvidenceTray` component (`src/components/scene/EvidenceTray.tsx`)

Fixed bottom strip, `--ink` background, `--gold` top border.
Maps `collectedEvidence` keys to evidence items from `CASE_001.evidence`.
Each thumbnail: small kind icon + name, 44px minimum touch target.
Left/right arrows when items overflow.
Clicking a thumbnail opens an `EvidenceDetailModal`.

### 3.5 `EvidenceDetailModal`

A `Modal` that shows the full evidence object: name, description,
`reliability` badge, `authenticity` badge (shown as "Authentic" until
authenticity is `manipulated` and CX-07 is confirmed).

### 3.6 Entity moment — ER-01

On `OBJ-telephone` first inspection, before the collect sequence:
1. `fireRule('ER-01')`.
2. Set a local `showPhoneOverlay` state to `true`.
3. `EntityOverlay` appears: screen dims, text "11:13" in Cinzel, fades
   after 3 s.
4. Then proceed with evidence collection.

`EntityOverlay` lives in `src/components/entity/EntityOverlay.tsx`.

### 3.7 Condition failure messages

Build a helper `conditionMessage(condition, caseData): string` in
`src/lib/engine/conditions.ts` that converts an unmet condition to a
human-readable string, e.g.:

- `hasEvidence EV-01` → `"Requires: Rotary Telephone"`
- `hasEvidence EV-03` → `"Requires: Clara's Diary (find the key)"`

Hardcode the message map for the nine scene objects — this is authored content,
not computed.

---

## 4. Digital Archives (`src/app/case/001/archive/page.tsx`)

### 4.1 Locked state

If `!selectUnlockedSections(state).archive`:

```
┌────────────────────────────────────────────┐
│  🔒  Digital Archives — Locked             │
│                                            │
│  You need:                                 │
│  · Rotary Telephone (EV-01)                │
│  · Final Night Recording (EV-07)           │
└────────────────────────────────────────────┘
```

Rendered as a centred `ParchmentCard` with Caveat handwriting style.

### 4.2 Unlocked state — tabs

Three tabs rendered as parchment tab-buttons. Active tab: gold underline.

Tab content renders inside `DeviceFrame`.

### 4.3 `DeviceFrame` (`src/components/digital/DeviceFrame.tsx`)

Props: `device: 'mobile' | 'laptop' | 'telco'`, `children: ReactNode`

Renders a stylised frame appropriate to the device:
- `mobile`: rounded dark rectangle, speaker grille at top (SVG), home button at
  bottom.
- `laptop`: wider rectangle with a notch at top, keyboard suggestion at bottom.
- `telco`: a plain ledger/document frame (`ArchiveFrame` variant) with a typed
  header "TELEPHONE COMPANY RECORDS".

All frames use `--brown` / `--ink` tones. The inner screen area is
`--ink` background.

### 4.4 Record renderers

Each `DigitalRecord` kind gets a small renderer component:

| Kind | Renderer | Notes |
|---|---|---|
| `call` / `callRecord` | `CallLogEntry` | Table row: time, from, to, duration |
| `sms` | `SmsMessage` | Chat-bubble style |
| `email` | `EmailMessage` | From/To/Subject header + body |
| `voicemail` | `VoicemailEntry` | Play icon (non-functional), timestamp, transcript |
| `photo` | `PhotoEntry` | Small image or placeholder, caption |
| `profile` | `ProfileEntry` | Username, status, timestamp |
| `note` | `NoteEntry` | Plain text in Caveat |

### 4.5 Deleted / recovered states

Wrapper component `RecordWrapper`:
- If `deleted && !recovered`: ghosted (opacity 0.35), italic "DELETED" badge,
  no Recover button unless condition met.
- If `deleted && conditionMet && !recovered`: show **Recover** button.
- If `recovered`: full opacity, small green "RECOVERED" stamp.

`recovered` = `state.recoveredRecords.includes(record.id)`.

---

## 5. Stub pages for locked sections

Create minimal stub pages for the routes that will be fully built in Specs 03–04,
so navigation doesn't 404.

- `/case/001/witnesses/[id]/page.tsx` — locked state if witnesses not unlocked;
  otherwise "Coming in Spec 03" message.
- `/case/001/evidence/page.tsx` — always accessible; "Coming in Spec 04" message.
- `/case/001/conclusion/page.tsx` — locked state if conclusion not unlocked;
  otherwise "Coming in Spec 04" message.

Each stub renders the `TopBar` and a centred `ParchmentCard` with the lock
message from US-15.

---

## 6. Component interaction map

```
/case/001/scene
  └── Hotspot (×9)         reads: collectable objects from evaluateCondition
  └── ObjectPanel           writes: discoverObject, inspectObject, collectEvidence,
                                    addAttention, fireRule
  └── EvidenceTray          reads: collectedEvidence → CASE_001.evidence names
  └── EvidenceDetailModal   reads: single evidence item
  └── EntityOverlay         writes: fireRule (ER-01)

/case/001/archive
  └── DeviceFrame (×3)
  └── RecordWrapper         reads: recoveredRecords, evaluateCondition
                            writes: recoverRecord, collectEvidence, addAttention

src/lib/engine/conditions.ts    ← pure, no React
src/lib/evidence/collection.ts  ← pure, no React
src/lib/evidence/links.ts       ← pure, no React
```
