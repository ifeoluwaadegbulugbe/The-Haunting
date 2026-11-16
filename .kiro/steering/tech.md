# Technical reference

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript, strict mode throughout |
| Styling | Tailwind CSS (token-driven; see design-system.md) |
| State | Zustand with the `persist` middleware |
| Validation | Zod (case data schemas and API input/output) |
| Animation | Framer Motion |
| Icons | lucide-react |
| Class utilities | clsx |
| Unit / component tests | Vitest + @testing-library/react + jsdom |
| E2E (P1) | @playwright/test |
| Deployment | Vercel |
| Database | None in MVP (browser localStorage via Zustand persist) |

## Approved dependencies

Only these packages may be added without asking first. If you want anything else, state what it replaces and why.

```
next  react  react-dom  typescript
tailwindcss
zustand
zod
framer-motion
lucide-react
clsx
vitest  @testing-library/react  jsdom
@playwright/test   (P1)
```

The AI provider is called with plain `fetch` from server routes — no SDK. Dragging uses native pointer events. Sound uses the native `Audio` object.

## Environment variables

All variables are server-side only. None may be prefixed `NEXT_PUBLIC_`.

| Variable | Purpose |
|---|---|
| `AI_PROVIDER` | Provider name, e.g. `gemini` or `groq` |
| `AI_MODEL` | Model name; never hard-coded in source |
| `AI_API_KEY` | Secret key; never appears in client bundles or git history |
| `AI_MOCK` | Set to `1` to force the deterministic mock provider (tests and emergency fallback) |

See `.env.example` for the placeholder file. Add `.env*` to `.gitignore`.

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest run
npm run test:watch   # vitest
npm run validate:case  # scripts/validate-case.ts — fails if any ID ref is broken
```

## Pure-module rule

Modules `src/lib/engine`, `src/lib/evidence`, and `src/lib/scoring` are pure TypeScript. They have no React imports and make no network calls. They are fast to test in isolation. The Zustand store calls them. Components call the store.

## Dependency rule (across all modules)

```
UI layer → store → pure lib modules → types
API routes → pure lib modules + AI/entity lib + types
Case data → types (Zod schemas)
```

No module in the reverse direction. UI components never contain game rules. Game rules never call the AI directly.

## AI calls

All AI calls happen inside `src/app/api/` server routes. The API key exists only in server environment variables. Client components never see the key or the raw provider response — they only receive the validated, sanitised output of the route handler.
