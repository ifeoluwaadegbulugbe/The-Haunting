# Devpost submission: THE HAUNTING

Copy each section into the matching field of the Kiroween submission form.

---

## Project name

THE HAUNTING

## Tagline

A haunted-house murder mystery where the AI witnesses can lie, but can never cheat.

## Category

Frankenstein

## Links

- **Live demo:** _your Vercel URL_
- **Code:** https://github.com/ifeoluwaadegbulugbe/The-Haunting (MIT licence, `.kiro/` at the root)
- **Video:** _your YouTube link_

---

## Inspiration

Detective games like Criminal Case are great at the hunt but scripted in conversation. LLM chat games have the opposite problem: you can talk to anyone, but the model can invent clues, give the answer away or contradict itself, so the mystery stops being fair. We wanted both: witnesses you can really talk to, and a case that stays solvable and fair however the player talks to them.

## What it does

You are an investigator at a Victorian paranormal archive, given Case 001: *The House That Calls Back*. In 2008 the Ashworth family vanished from their house on Hollow Lane. Every night at 11:13 the house still rings the neighbour's phone.

- **Search the study.** Inspect nine illustrated objects in close-up. Some are locked until you hold the item that opens them, and hidden details reward careful looking.
- **Recover devices from 2008.** Enhance a photo until the number plate can be read, crack Clara's laptop password from her diary, and rebuild a deleted voicemail by scrubbing the tape.
- **Interrogate three AI witnesses.** Ask anything in your own words. Present evidence to break their stories, or challenge a statement with the proof that contradicts it.
- **Build the evidence board.** Connect clues with red string, flag contradictions and put the final night in order.
- **Work the forensics lab.** Dust for prints, rebuild a torn photograph and run the plate, to build a killer profile.
- **Name the killer.** A deterministic engine scores your theory out of 100. If you name the right person, you then face him in a confrontation, answering each of his defences with evidence.

Red herrings point at the neighbour and the housekeeper, so the answer is not obvious.

**The entity is investigating you too.** Clara's echo watches what you find. It rings you at fixed moments, disturbs evidence, plants a fake photograph, appears in reflections, and blows out the candles. It remembers how you treated it, and that changes the ending. It can never change the truth: it cannot delete evidence, block the conclusion or make the case unsolvable.

## How we built it

The rule the whole project is built around: **AI writes the words. Code decides the facts.**

- Each witness has a fixed list of facts, each with its own reveal condition. On every message, the server works out which facts the player has earned. The model (Gemini) may only phrase those facts, plus authored memories, suspicions and leads.
- Every reply passes six checks: valid JSON, only allowed facts, no words from locked facts, no meta words, at most 70 words, and no repeat of an earlier reply. If a reply fails, the model is asked once more. If that also fails, a scripted line that points to the next lead is used instead. A fact the player has earned is always delivered, even when the model is down.
- Contradictions, links, unlocks, entity actions and the score are all pure TypeScript rules over the case data. No AI is involved, so the same theory always gets the same score.
- The stack is Next.js 15 App Router, TypeScript (strict), Zustand with localStorage saves, Zod, Framer Motion and Tailwind. Sound runs on a Web Audio engine with synthesised fallbacks, and the site is deployed on Vercel.

### How Kiro was used

- **Steering:** seven files in `.kiro/steering/`. The most important is `case-001-truth.md`, the canonical case file every data ID is written from. It is marked "never edit without approval", and the agent asked before each change. `ai-guardrails.md` defines the witness pipeline and its validation checks, and `design-system.md` keeps the entity's red out of ordinary UI.
- **Specs:** seven specs in `.kiro/specs/`, from the foundation to the casework and the entity. Each has requirements, design and tasks, and each stage was approved before the next began.
- **Hooks:** they check case data integrity, run the engine tests, block raw colour values and entity colours outside entity events, and scan for secrets on save.
- **Testing:** more than 200 Vitest tests, including a golden-path playthrough that must score exactly 100 and a prompt-injection test. A Playwright test plays the whole case in a real browser using only clicks and typing.

See `docs/KIRO_USAGE.md` for detail.

## Challenges we ran into

- **Witnesses repeating themselves.** Early on, the model kept restating the same harmless fact. We now detect replies that share most of their wording with an earlier reply, reject them, and give each locked fact authored leads, so every answer points somewhere new.
- **Model retirement.** The Gemini model we started with was retired mid-build, so every witness fell back to scripted lines. The model name is now configuration only, and the game stays fully playable with no AI at all.
- **Keeping a supernatural antagonist fair.** The entity plants a fake photograph and disturbs evidence, but every one of its actions passes through code that enforces the hard limits, and the fake is always disprovable.

## Accomplishments that we're proud of

- An LLM-driven interrogation that cannot be prompt-injected into giving the answer away.
- A complete case that plays from first click to verdict, with a confrontation, a cinematic reveal and two endings.
- An antagonist that reacts to the player while never changing the facts.

## What we learned

Letting the model phrase the dialogue and letting code decide every fact gave witnesses that feel alive while keeping the mystery fair. Steering files that state the rules once, and hooks that enforce them, kept a large build consistent.

## What's next

More cases built from the same engine (each case is a data folder plus a truth file), more red herrings that adapt to the player's suspicions, and optional voice for the entity.

## Built with

nextjs, typescript, react, zustand, zod, framer-motion, tailwindcss, gemini, web-audio-api, vitest, playwright, vercel, kiro

---

## Demo video

`demo-video/the-haunting-demo.mp4` (2:49, 1080p, git-ignored). To record it again:

```bash
npm run build
npx playwright test -c playwright.demo.config.ts   # raw video in test-results/demo-raw/
```

Then trim the blank first half-second, speed it up 6% and add the theme music (PowerShell; set `$v` to the recorded `video.webm` and `$d` to its length minus 0.5, divided by 1.06):

```powershell
ffmpeg -y -ss 0.5 -i $v -stream_loop -1 -i public/assets/audio/music-theme.mp3 `
  -filter_complex "[0:v]setpts=PTS/1.06,scale=1920:1080:flags=lanczos,fps=30,format=yuv420p[v];[1:a]volume=0.55,afade=t=in:st=0:d=2,afade=t=out:st=$($d-3.5):d=3.5[a]" `
  -map "[v]" -map "[a]" -t $d -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k -movflags +faststart demo-video/the-haunting-demo.mp4
```
