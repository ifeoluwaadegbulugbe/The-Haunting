import type { Case001 } from '@/data/case001'

/**
 * Checks a timeline placement for structural conflicts.
 * A conflict: event A is placed before event B, but A.requires includes B.
 * Does NOT reveal the canonical order.
 *
 * @param placement  Record of slotIndex (string) → TimelineEvent ID
 * @param caseData
 * @returns Array of { eventId, conflictsWith } for each structural violation
 */
export function validateTimelinePlacement(
  placement: Record<string, string>,
  caseData: Case001
): Array<{ eventId: string; conflictsWith: string }> {
  const conflicts: Array<{ eventId: string; conflictsWith: string }> = []

  // Build a map: eventId → slot index
  const eventSlot: Record<string, number> = {}
  for (const [slot, eventId] of Object.entries(placement)) {
    eventSlot[eventId] = parseInt(slot, 10)
  }

  for (const event of caseData.timeline) {
    if (!event.requires) continue
    const eventIdx = eventSlot[event.id]
    if (eventIdx === undefined) continue // not placed yet

    for (const reqId of event.requires) {
      const reqIdx = eventSlot[reqId]
      if (reqIdx === undefined) continue // required event not placed yet

      // Conflict: this event is placed before (or at same slot as) its requirement
      if (eventIdx <= reqIdx) {
        conflicts.push({ eventId: event.id, conflictsWith: reqId })
      }
    }
  }

  return conflicts
}
