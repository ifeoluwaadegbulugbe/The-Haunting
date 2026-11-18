# THE HAUNTING

**INVESTIGATE · UNCOVER · BE FOUND**

A paranormal investigation game built with Kiro for Kiroween 2026. You are an investigator at a Victorian archive, assigned Case 001: *The House That Calls Back*. You explore a haunted house, recover deleted phone and laptop records, interrogate three AI-driven witnesses, connect evidence on a board, and submit a theory. A deterministic engine scores it and reveals the truth.

The entity you are investigating is also investigating you. It reacts to what you discover, disturbs evidence, and plants a false lead. It can never change the truth or make the case unsolvable.

**AI writes the words. Code decides the facts.** Witness replies are phrased by a language model, but every fact, unlock, score and entity action comes from the case data and fixed rules. If the model is unavailable, the game still plays to the end with scripted lines.

## Running it

Requires Node.js 20 or later.

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `AI_PROVIDER` | `gemini` (default) or `groq` |
| `AI_MODEL` | Model name, for example `gemini-1.5-flash` |
| `AI_API_KEY` | Your provider key. Server-side only |
| `AI_MOCK` | Set to `1` to play without any AI provider (scripted, deterministic replies) |

To play without a key, set `AI_MOCK=1`.

## Commands

```bash
npm run dev            # development server
npm run build          # production build
npm run typecheck      # TypeScript
npm run lint           # ESLint
npm run test           # Vitest (unit, route and golden-path tests)
npm run validate:case  # check every ID reference in the case data
npm run token-check    # enforce the design-token rules
npm run secrets-check  # check for exposed keys and tracked .env files
```

## Deploying to Vercel

1. Import the repository in Vercel. It detects Next.js automatically.
2. Add `AI_PROVIDER`, `AI_MODEL` and `AI_API_KEY` under Project Settings → Environment Variables. Do not prefix them with `NEXT_PUBLIC_`.
3. Deploy.

Progress is saved in the browser (localStorage). There is no database.

## How it is built

- Next.js (App Router), TypeScript strict, Tailwind CSS, Zustand, Zod, Framer Motion
- Game rules live in pure modules under `src/lib/` (no React, no network) and are unit tested
- Case 001 is data in `src/data/case001/`, validated by Zod at load time and by `validate:case`
- AI calls happen only in server routes under `src/app/api/`

How Kiro's steering, specs and hooks were used is documented in [docs/KIRO_USAGE.md](docs/KIRO_USAGE.md).

## Licence

MIT. See [LICENSE](LICENSE).
