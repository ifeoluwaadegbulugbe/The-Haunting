'use client'

import { clsx } from 'clsx'
import type { TimelineEvent } from '@/types'

interface TimelineSlotProps {
  slotIndex:  number
  timeLabel:  string
  event?:     TimelineEvent
  hasConflict: boolean
  onDrop:     (slotIndex: number) => void
  onClear:    (slotIndex: number) => void
}

export function TimelineSlot({
  slotIndex, timeLabel, event, hasConflict, onDrop, onClear,
}: TimelineSlotProps) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(slotIndex)}
      className={clsx(
        'flex flex-col gap-1 p-3 rounded border min-h-[72px] transition-colors',
        event
          ? hasConflict ? 'border-thread' : 'border-gold'
          : 'border-dashed border-brown'
      )}
      style={{ background: 'var(--ink)' }}
    >
      <span className="font-inter text-[10px] text-parchment-dark uppercase tracking-wide">
        {timeLabel}
      </span>
      {event ? (
        <div className="flex items-start justify-between gap-2">
          <p className="font-inter text-xs text-parchment leading-snug">{event.label}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(slotIndex) }}
            aria-label="Remove event from slot"
            className="flex-shrink-0 text-parchment-dark hover:text-parchment text-xs cursor-pointer"
            style={{ background: 'none', border: 'none' }}
          >
            ✕
          </button>
        </div>
      ) : (
        <p className="font-caveat text-xs text-parchment-dark opacity-50 italic">Drop an event here</p>
      )}
      {hasConflict && event && (
        <p className="font-inter text-[10px]" style={{ color: 'var(--thread)' }}>
          ⚠ Sequence conflict
        </p>
      )}
    </div>
  )
}
