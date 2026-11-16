/**
 * scripts/validate-case.ts
 * Run with: npm run validate:case
 *
 * Checks referential integrity across all Case 001 data files.
 * Collects ALL failures before exiting (does not short-circuit).
 */

/**
 * scripts/validate-case.ts
 * Run with: npm run validate:case
 *
 * Checks referential integrity across all Case 001 data files.
 * Collects ALL failures before exiting (does not short-circuit).
 */

import { CASE_001 } from '../src/data/case001/index'

const failures: string[] = []

function fail(message: string) {
  failures.push(message)
}

// ── Build lookup sets ──────────────────────────────────────────────────────

const evidenceIds = new Set(CASE_001.evidence.map((e) => e.id))
const timelineIds = new Set(CASE_001.timeline.map((t) => t.id))
const sceneObjectIds = new Set(CASE_001.scene.map((s) => s.id))

// Statement IDs are stored in WitnessFact.yieldsStatementId
const statementIds = new Set<string>()
for (const witness of CASE_001.witnesses) {
  for (const fact of witness.facts) {
    if (fact.yieldsStatementId) statementIds.add(fact.yieldsStatementId)
  }
}

const validSideIds = new Set([...evidenceIds, ...statementIds])

// ── Check 1: Scene object yieldsEvidence ──────────────────────────────────

for (const obj of CASE_001.scene) {
  for (const evId of obj.yieldsEvidence) {
    if (!evidenceIds.has(evId)) {
      fail(`scene.ts → OBJ "${obj.id}" yieldsEvidence "${evId}" — not found in evidence.ts`)
    }
  }
}

// ── Check 2: Digital record yieldsEvidence ────────────────────────────────

for (const rec of CASE_001.digital) {
  if (rec.yieldsEvidence && !evidenceIds.has(rec.yieldsEvidence)) {
    fail(
      `digital.ts → DR "${rec.id}" yieldsEvidence "${rec.yieldsEvidence}" — not found in evidence.ts`
    )
  }
}

// ── Check 3: Contradiction sides ─────────────────────────────────────────

for (const cx of CASE_001.contradictions) {
  if (!validSideIds.has(cx.a)) {
    fail(
      `contradictions.ts → CX "${cx.id}" side a="${cx.a}" — not found in evidence IDs or statement IDs`
    )
  }
  if (!validSideIds.has(cx.b)) {
    fail(
      `contradictions.ts → CX "${cx.id}" side b="${cx.b}" — not found in evidence IDs or statement IDs`
    )
  }
}

// ── Check 4: Link pairs ───────────────────────────────────────────────────

for (const link of CASE_001.links) {
  if (!evidenceIds.has(link.a)) {
    fail(`links.ts → link pair a="${link.a}" — not found in evidence.ts`)
  }
  if (!evidenceIds.has(link.b)) {
    fail(`links.ts → link pair b="${link.b}" — not found in evidence.ts`)
  }
}

// ── Check 5: Entity rule targetRefs ──────────────────────────────────────

const entityTargetIds = new Set([...evidenceIds, ...sceneObjectIds])
for (const rule of CASE_001.entityRules) {
  if (rule.targetRef && !entityTargetIds.has(rule.targetRef)) {
    fail(
      `entity-rules.ts → ER "${rule.id}" targetRef="${rule.targetRef}" — not found in evidence IDs or scene object IDs`
    )
  }
}

// ── Check 6: Evidence relatedEvents back-refs ─────────────────────────────

for (const ev of CASE_001.evidence) {
  for (const tlId of ev.relatedEvents) {
    if (!timelineIds.has(tlId)) {
      fail(
        `evidence.ts → EV "${ev.id}" relatedEvents "${tlId}" — not found in timeline.ts`
      )
    }
  }
}

// ── Check 7: Duplicate IDs within each array ─────────────────────────────

function checkDuplicates(items: Array<{ id: string }>, fileName: string) {
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) {
      fail(`${fileName} → duplicate id "${item.id}"`)
    }
    seen.add(item.id)
  }
}

checkDuplicates(CASE_001.evidence, 'evidence.ts')
checkDuplicates(CASE_001.timeline, 'timeline.ts')
checkDuplicates(CASE_001.scene, 'scene.ts')
checkDuplicates(CASE_001.digital, 'digital.ts')
checkDuplicates(CASE_001.contradictions, 'contradictions.ts')
checkDuplicates(CASE_001.entityRules, 'entity-rules.ts')

// ── Result ────────────────────────────────────────────────────────────────

if (failures.length === 0) {
  console.log('✓ Case 001 validation passed')
  process.exit(0)
} else {
  console.error(`✗ Case 001 validation failed — ${failures.length} error(s):\n`)
  for (const f of failures) {
    console.error(`  • ${f}`)
  }
  process.exit(1)
}
