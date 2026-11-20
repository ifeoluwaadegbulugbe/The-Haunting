'use client'

import { clsx } from 'clsx'
import type { TimelineEvent } from '@/types'

interface TimelineSlotProps {
  slotIndex: number
  timeLabel: string
  event?: TimelineEvent
  hasConflict: boolean
  onDrop: (slotIndex: number) => void
  onClear: (slotIndex: number) => void
}

export function TimelineSlot({
  slotIndex, timeLabel, event, hasConflict, onDrop, onClear,
}: TimelineSlotProps) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(slotIndex)}
      className={clsx(
        'flex flex-col gap-1 p-3 rounded-sm border min-h-[150px] transition-colors',
        event
          ? hasConflict ? 'border-thread' : 'border-gold'
          : 'border-dashed border-brown'
      )}
      style={{
        // An empty peg holds a blank card; a placed event is a pinned photograph of paper
        background: event ? 'linear-gradient(160deg, var(--parchment-light), var(--parchment-dark))' : 'rgba(14,12,16,0.6)',
        boxShadow: event ? '0 10px 18px rgba(14,12,16,0.5)' : undefined,
      }}
    >
      <span className={clsx('font-inter text-[10px] uppercase tracking-wide', event ? 'text-brown' : 'text-parchment-dark')}>
        {timeLabel}
      </span>
      {event ? (
        <div className="flex items-start justify-between gap-2">
          <p className="font-cormorant text-base text-obsidian leading-snug">{event.label}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(slotIndex) }}
            aria-label="Remove event from slot"
            className="flex-shrink-0 text-brown hover:text-obsidian text-xs cursor-pointer"
            style={{ background: 'none', border: 'none' }}
          >
            ✕
          </button>
        </div>
      ) : (
        <p className="font-caveat text-base text-parchment-dark opacity-70">Peg an event here</p>
      )}
      {hasConflict && event && (
        <p className="font-inter text-[10px]" style={{ color: 'var(--thread)' }}>
          ⚠ Sequence conflict
        </p>
      )}
    </div>
  )
}
