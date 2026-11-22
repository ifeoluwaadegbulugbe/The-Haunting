# Assets to generate

Drop each file at the exact path shown. The game already runs without them: missing
images fall back to existing art, missing music falls back to a synthesized drone, and
missing sound effects fall back to sounds generated in code. As soon as a file exists,
the game uses it. No code changes needed.

Style for every image: photoreal, cinematic, candlelit, deep shadows, warm amber and
oxblood tones, Victorian / Edwardian interiors, slight film grain, no text unless stated,
no modern objects. Match the look of `public/assets/scene/study-scene.jpg`.

---

## Images

| Path | Size | Prompt |
|---|---|---|
| `public/assets/scene/hq-room.jpg` | 1920×1080 (16:9) | The private office of a secret Victorian paranormal investigation department inside an old mansion, at night. Centre: a large mahogany desk with a sealed case folder, an oil lamp and a magnifying glass. Left: a tall wooden filing cabinet with brass drawer labels. Back wall: an evidence wall of pinned photographs connected by red string. Right: a stone fireplace with a low fire. Far left corner: a black candlestick telephone on a side table. Right of the fireplace: a grandfather clock. Far right: a heavy locked wooden door with iron studs. Wide shot, eye level, everything clearly separated so each object is easy to click. |
| `public/assets/scene/lily-room.jpg` | 1920×1080 (16:9) | A nine-year-old girl's Victorian bedroom at night, photographed straight on at eye level, very dark (it is explored by torchlight). Keep these where stated, clearly separated: far left, a small bedside table with a wooden music box (about 11% across, just above middle height); left of centre, a small iron bed with the covers turned down and a toy rabbit on the pillow (26% across, lower third); upper left wall, three crayon drawings pinned up (30% across, top quarter); centre, a wall shelf of dolls, a spinning top and a red toy telephone (44% across, middle); right of centre, a tall sash window with moonlight and a distant lit window outside (62% across, upper third); far right, a tall dark wooden wardrobe with two doors (85% across, middle). Faded floral wallpaper, bare floorboards, no people. |
| `public/assets/ui/interview-room.jpg` | 1920×1080 | A dim 1950s-style interview room inside an old manor. A worn wooden table in the foreground with a reel-to-reel recorder, a desk lamp casting a pool of light, a folder and a glass of water. An empty wooden chair across the table. Peeling dark green wallpaper, one small barred window. Left third of the frame darker and empty (a portrait will be placed there). |
| `public/assets/ui/case-file.jpg` | 1600×1200 | Top-down photo of a closed, aged manila case folder on a dark wooden desk, a red wax seal across the flap, the words "CASE 001" rubber-stamped in red ink, "CLASSIFIED" stamped diagonally. Paperclips, a coffee ring, soft lamp light. |
| `public/assets/evidence/telephone.png` | 1600×1200 | Close-up of a 1930s black bakelite rotary telephone on a wooden side table. A small yellowed paper label in the centre of the dial, handwritten in ink: "Ext 2 — Cellar". Shallow depth of field, candlelight from the left. |
| `public/assets/evidence/recorder.png` | 1600×1200 | Close-up of a 2000s silver portable cassette recorder on a mahogany desk, a cassette inside with a handwritten label "Study — 11.11.08". Moody lamp light. |
| `public/assets/evidence/clock.png` | 1600×1200 | Close-up of a brass Victorian mantel clock with its hands stopped at 11:13. The rear door is ajar and a small folded logbook is tucked behind it. |
| `public/assets/evidence/cabinet.jpg` | 1600×1200 | A small dark wooden cabinet with its doors open. Inside: a strip of old photographs and a folded legal document tied with ribbon. A small brass key in the lock. |
| `public/assets/evidence/diary.png` | 1600×1200 | An open brown leather diary on a desk, handwritten pages, the last few pages torn out along the spine. A small brass key taped inside the back cover with yellowed tape. |
| `public/assets/evidence/rug-notice.jpg` | 1600×1200 | The corner of a Persian rug lifted from dark floorboards, revealing a folded letter beneath with "FINAL NOTICE" visible in red. |
| `public/assets/portraits/portrait-margaret-pressured.jpg` | same as `portrait-margaret.jpg` | The same woman as `portrait-margaret.jpg`, same framing, lighting and clothes, now frightened: eyes glistening, hand at her throat, looking slightly away. |
| `public/assets/portraits/portrait-dorothea-pressured.jpg` | same as `portrait-dorothea.jpg` | The same woman as `portrait-dorothea.jpg`, same framing, now defensive and shaken: jaw tight, arms crossed, eyes cold but wet. |
| `public/assets/portraits/portrait-julian-pressured.jpg` | same as `portrait-julian.jpg` | The same man as `portrait-julian.jpg`, same framing, now cornered: the polite smile gone, eyes hard and narrowed, a bead of sweat at the temple. |

Close-ups of single objects (telephone, recorder, clock, diary) are used as cut-outs: transparent .png files with the background removed, so they sit in the game's own scenery. To replace one, generate it as a .jpg and run `python audio-source/cutout.py` (needs `pip install rembg[cpu] pillow`), or save your own transparent .png at the path shown.

Tip: generate the three "pressured" portraits by giving Gemini the original portrait and asking it to change only the expression.

---

## Music (MP3, 128–192 kbps, loopable)

| Path | Length | Brief |
|---|---|---|
| `public/assets/audio/music-theme.mp3` | 1–2 min loop | Title and HQ. Slow, melancholic, gothic. Solo cello or piano with a low string pad. Restrained, no drums. |
| `public/assets/audio/music-house.mp3` | 2–3 min loop | Exploring the house. Tense, sparse, almost no melody: low drones, distant piano notes, occasional bowed metal. |
| `public/assets/audio/music-interview.mp3` | 1–2 min loop | Interrogation. Quiet pulse like a slow heartbeat, muted strings, unease. |
| `public/assets/audio/music-reveal.mp3` | 1–2 min | The reveal. Builds from silence to a sad, resolving string theme. |

Free sources: Pixabay Music (no attribution needed). If you generate with Suno or Udio, check the licence allows public use.

## Ambience (MP3, seamless loops)

| Path | Brief |
|---|---|
| `public/assets/audio/ambient.mp3` | Already added (the house). |
| `public/assets/audio/ambient-hq.mp3` | Quiet office at night: fire crackle, clock tick, occasional building creak. |
| `public/assets/audio/ambient-interview.mp3` | Room tone, faint electrical hum, tape hiss. |

## Sound effects (MP3, short, trimmed tight)

| Path | Sound |
|---|---|
| `public/assets/audio/sfx-drawer.mp3` | Old wooden drawer or cabinet door opening |
| `public/assets/audio/sfx-page.mp3` | A single page turning (`page-rustle.mp3` is used until this exists) |
| `public/assets/audio/sfx-folder.mp3` | Cardboard folder opening, papers sliding |
| `public/assets/audio/sfx-stamp.mp3` | Rubber stamp thump |
| `public/assets/audio/sfx-pin.mp3` | Push pin into cork |
| `public/assets/audio/sfx-tape.mp3` | Cassette play button clunk |
| `public/assets/audio/sfx-pickup.mp3` | Old telephone receiver lifted |
| `public/assets/audio/sfx-whisper.mp3` | Unintelligible whisper, 1–2 s |
| `public/assets/audio/sfx-seal.mp3` | Wax seal cracking |

Free sources: Freesound.org (filter by CC0) or Pixabay Sound Effects.

The UI click, hover tick, discovery chime, important-clue sting, static burst, entity drone
and typing tick are generated in code and need no files.
