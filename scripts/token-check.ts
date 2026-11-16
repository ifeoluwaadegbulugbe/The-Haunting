/**
 * scripts/token-check.ts
 * Run with: npm run token-check
 *
 * Scans src/components/**\/*.tsx for:
 * 1. Raw hex colour literals
 * 2. Bare font-family values not using var(--font-*)
 * 3. Entity token references (--entity, --entity-glow) outside components/entity/
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const ROOT = join(__dirname, '..')
const COMPONENTS_DIR = join(ROOT, 'src', 'components')

const violations: Array<{ file: string; line: number; message: string }> = []

// ── Helpers ────────────────────────────────────────────────────────────────

function walkDir(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...walkDir(full))
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      results.push(full)
    }
  }
  return results
}

function checkFile(filePath: string) {
  const rel = relative(ROOT, filePath).replace(/\\/g, '/')
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  const isEntityComponent = rel.includes('components/entity/')

  lines.forEach((line, idx) => {
    const lineNum = idx + 1

    // Check 1: raw hex literals
    const hexMatches = line.match(/#[0-9a-fA-F]{3,8}\b/g)
    if (hexMatches) {
      for (const hex of hexMatches) {
        // Allow hex inside comments
        const stripped = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
        if (stripped.includes(hex)) {
          violations.push({
            file: rel,
            line: lineNum,
            message: `Raw hex colour "${hex}" — use a CSS token variable instead`,
          })
        }
      }
    }

    // Check 2: bare fontFamily not using CSS variable
    if (/fontFamily|font-family/i.test(line)) {
      // Allow: var(--font-*), className with font-* (Tailwind), or comments
      const stripped = line.replace(/\/\/.*$/, '')
      if (
        /fontFamily\s*[:=]\s*['"`][^v]/.test(stripped) &&
        !stripped.includes('var(--font-')
      ) {
        violations.push({
          file: rel,
          line: lineNum,
          message: `Bare font-family value — use var(--font-*) CSS variable`,
        })
      }
    }

    // Check 3: entity tokens outside entity components
    if (!isEntityComponent) {
      if (line.includes('--entity') && !line.includes('--entity-') === false) {
        // more precise check
      }
      const entityTokens = line.match(/--entity(?:-glow)?/g)
      if (entityTokens) {
        // Allow inside comments
        const stripped = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
        if (entityTokens.some((t) => stripped.includes(t))) {
          violations.push({
            file: rel,
            line: lineNum,
            message: `Entity token used outside components/entity/ — move entity styling to that directory`,
          })
        }
      }
    }
  })
}

// ── Main ───────────────────────────────────────────────────────────────────

const files = walkDir(COMPONENTS_DIR)
for (const file of files) {
  checkFile(file)
}

// ── Results ────────────────────────────────────────────────────────────────

if (violations.length === 0) {
  console.log('✓ Token check passed — no violations found')
  process.exit(0)
} else {
  console.error(`✗ Token check failed — ${violations.length} violation(s):\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.message}`)
  }
  process.exit(1)
}
