/**
 * scripts/secrets-check.ts — run with `npm run secrets-check`
 *
 * Fails (exit 1) if:
 *  - any AI_* variable is exposed with a NEXT_PUBLIC_ prefix
 *  - a likely API key is hard-coded in src/
 *  - a real .env file is tracked by git
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { execSync } from 'child_process'

const ROOT = join(__dirname, '..')
const problems: string[] = []

const KEY_PATTERNS: Array<[RegExp, string]> = [
  [/AIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
  [/gsk_[0-9A-Za-z]{20,}/, 'Groq API key'],
  [/sk-[0-9A-Za-z]{20,}/, 'OpenAI-style secret key'],
  [/NEXT_PUBLIC_AI_/, 'AI variable exposed to the client (NEXT_PUBLIC_AI_*)'],
  [/(api[_-]?key|secret)\s*[:=]\s*['"][0-9A-Za-z_-]{16,}['"]/i, 'hard-coded key-like value'],
]

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx|js|mjs|json)$/.test(entry)) out.push(full)
  }
  return out
}

for (const file of walk(join(ROOT, 'src'))) {
  const lines = readFileSync(file, 'utf-8').split('\n')
  lines.forEach((line, i) => {
    for (const [re, label] of KEY_PATTERNS) {
      if (re.test(line)) problems.push(`${relative(ROOT, file)}:${i + 1}  ${label}`)
    }
  })
}

try {
  const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8' }).split('\n')
  for (const f of tracked) {
    if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example')) {
      problems.push(`${f}  real .env file is tracked by git`)
    }
  }
} catch {
  // not a git checkout; skip
}

if (problems.length === 0) {
  console.log('✓ Secrets check passed')
  process.exit(0)
}
console.error(`✗ Secrets check failed — ${problems.length} problem(s):\n`)
for (const p of problems) console.error(`  ${p}`)
process.exit(1)
