# Spec 05 — Immersive experience: design

## Audio engine (`src/lib/audio/engine.ts`)
Web Audio API graph: `music`, `ambient` and `sfx` gain buses into a master gain. `audio.sfx(name, vol)` tries `public/assets/audio/<name>.mp3` and falls back to a synthesised sound. `soundscapes.ts` maps route and entity stage to a music and ambience mix. `AudioDirector` (mounted in the root layout) applies the soundscape on navigation; `AudioSettings` is the corner control. Settings live in the persisted store (`audio`). No audio library is used.

## Effects store (`src/store/fxStore.ts`)
Unpersisted Zustand store for transient effects: manifestations, flying cards and toasts. `fireRule` in the entity dispatcher calls `manifest(ruleId)`. `FxLayer` and `EntityManifestations` render from it. Effects never change game state.

## Room stage (`src/components/room/RoomStage.tsx`)
Aspect-locked stage shared by HQ and the scene: hotspots in percentage coordinates, zoom, pointer parallax, slow push-in, light glows, a dust canvas and fog. `useAsset` checks whether a user-supplied image exists and otherwise uses the fallback with a CSS filter.

## Close-ups (`src/components/scene/CloseUpInteractions.tsx`)
`ObjectCloseUp` hosts per-object interactions: `Gate` (open a cover), `Flip` (turn a document over), `PhotoInspector` (magnifier), `TapePlayer`, `ClockFace`. Interactions that reveal OC-* clues call `collectEvidence` with relevance `optional`.

## Data
- `src/data/hq.ts`: HQ room, objects, case archive cards, `clockTime`.
- `src/data/achievements.ts`: ten achievements and `thoroughness`.
- `src/data/case001/questions.ts`: suggested questions per witness.
- `src/lib/evidence/explain.ts`: `explainLink` reads the §9.9 "why it holds" text.

## Persistence
Save version 2 adds `audio`, `seenCinematics` and `achievements`. `migrations.ts` upgrades v1 in place. Any other mismatch still offers a clean restart.

## Colour rule
Entity colours stay in `components/entity/` and `components/conclusion/`. The disturbed-card style is in CSS (`[data-disturbed='true']`). `token-check` enforces this.
