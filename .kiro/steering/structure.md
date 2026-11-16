# Folder structure and naming conventions

```
.kiro/
  steering/        product.md  tech.md  structure.md  design-system.md
                   case-001-truth.md  ai-guardrails.md  testing.md
  specs/           01-foundation/  02-investigation-engine/
                   03-ai-witnesses-and-entity/  04-evidence-and-conclusion/
  hooks/           validate-case-data  test-engine  token-check
                   secrets-check  usage-log

docs/
  reference/       concept-board.png
  KIRO_USAGE.md    (how Kiro was used — submission document)

src/
  app/
    page.tsx                              # title screen (/)
    hq/page.tsx                           # Investigation HQ (/hq)
    case/001/
      scene/page.tsx                      # Scene Explorer
      archive/page.tsx                    # Digital Archives
      witnesses/[id]/page.tsx             # Witness Interrogation
      evidence/page.tsx                   # Evidence Board
      conclusion/page.tsx                 # Case Conclusion
    api/
      witness/route.ts
      entity/route.ts
      verdict/route.ts

  components/
    ui/          # Button, Modal, Toast, ProgressBar, Stamp, WaxSeal, etc.
    archive/     # ArchiveFrame, ParchmentCard, CaseFolder
    scene/       # Hotspot, ObjectPanel, EvidenceTray
    digital/     # DeviceFrame and device-tab components
    witness/     # WitnessPortrait, TrustMeter, ChatBubble, TypingDots
    board/       # EvidenceCard, PolaroidCard, ThreadLine,
                 # TimelineSlot, ContradictionBadge
    entity/      # EntityMessage, EntityOverlay
    conclusion/  # reveal and report-card components

  data/
    case001/
      truth.ts           # canonical truth — never edited by AI
      timeline.ts        # TL-01 … TL-07
      evidence.ts        # EV-01 … EV-15, EV-X1
      scene.ts           # OBJ-* scene objects and hotspots
      digital.ts         # DR-* digital records
      witnesses.ts       # julian, margaret, dorothea with WitnessFact arrays
      contradictions.ts  # CX-01 … CX-07
      links.ts           # valid evidence link pairs
      entity-rules.ts    # ER-01 … ER-08
      index.ts           # re-exports and assembled case object

  lib/
    case/        # loadCase, Zod validation, read-only lookups
    engine/      # discovery conditions, unlock rules, progress calculation
    evidence/    # collection, linking, contradiction detection, timeline
    scoring/     # theory validation and scoring
    entity/      # attention score, stage transitions, rule evaluation
    ai/
      witness/   # prompt builder, response validator, fallback selector
    audio/       # native Audio helpers

  store/
    gameStore.ts   # Zustand store definition + persist config
    selectors.ts   # derived values (progress %, rank, unlocked sections)
    migrations.ts  # version-mismatch handler

  types/
    index.ts     # Zod schemas (source of truth) + inferred TypeScript types

  styles/
    tokens.css   # CSS custom properties from the design token table
    globals.css  # Tailwind base + font imports

public/
  assets/
    scene/       # study-scene.png and any room variants
    portraits/   # portrait-margaret.png  portrait-dorothea.png  portrait-julian.png
    evidence/    # photo-family-torn.png  photo-strip.png  drawing-lily.png
                 # photo-car-drive.png  photo-window-disturbed.png
    ui/          # board-wall.png  cellar-reveal.png  title-mansion.png  ui sprites
    audio/       # ambient.mp3  phone-ring.mp3  page-rustle.mp3  heartbeat.mp3

scripts/
  validate-case.ts   # run with `npm run validate:case`; fails if any ID ref is broken

tests/
  unit/              # pure lib modules
  component/         # React component tests
  e2e/               # Playwright journey (P1)

LICENSE
.env.example
README.md
```

## Naming conventions

- **Files**: kebab-case for all non-component files (`game-store.ts`, `validate-case.ts`).
- **React components**: PascalCase files and exports (`EvidenceCard.tsx`).
- **Data IDs**: exactly as written in the case design document — `EV-01`, `OBJ-telephone`, `TL-06`, `CX-01`, `ER-05`, `M4`, `D2`, `J3`, etc. The validation script enforces this.
- **CSS tokens**: `--obsidian`, `--parchment`, `--entity`, etc. (see design-system.md). Never use raw hex in component files.
- **Routes**: follow the `src/app/` tree above. No additional top-level routes without agreement.
