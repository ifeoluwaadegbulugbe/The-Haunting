'use client'

import { useRef, useState, useCallback } from 'react'
import type { Evidence } from '@/types'

export interface EvidenceCardProps {
  evidence: Evidence
  position: { x: number; y: number }
  onMove: (id: string, pos: { x: number; y: number }) => void
  onPinDrag: (id: string, e: React.PointerEvent) => void
  isAnchor?: boolean
  disturbed?: boolean
}

export function EvidenceCard({
  evidence, position, onMove, onPinDrag, isAnchor, disturbed,
}: EvidenceCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const [localPos, setLocalPos] = useState(position)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isAnchor) return
    // Only drag on the card body (not the pin)
    const target = e.target as HTMLElement
    if (target.closest('[data-pin]')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, startY: e.clientY, origX: localPos.x, origY: localPos.y }
  }, [isAnchor, localPos])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.startX
    const dy = e.clientY - drag.current.startY
    setLocalPos({ x: drag.current.origX + dx, y: drag.current.origY + dy })
  }, [])

  const onPointerUp = useCallback(() => {
    if (!drag.current) return
    onMove(evidence.id, localPos)
    drag.current = null
  }, [evidence.id, localPos, onMove])

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="absolute select-none"
      style={{
        left: localPos.x,
        top: localPos.y,
        width: '120px',
        cursor: isAnchor ? 'default' : 'grab',
        zIndex: 5,
      }}
    >
      {/* Polaroid-style card */}
      <div
        className="rounded-sm p-2 pb-4 shadow-lg"
        style={{
          background: 'var(--parchment-dark)',
          border: disturbed ? undefined : '1px solid var(--gold)',
        }}
        data-disturbed={disturbed ? 'true' : undefined}
      >
        {/* Photo area */}
        <div
          className="w-full mb-2 flex items-center justify-center rounded-sm"
          style={{ height: '70px', background: 'var(--brown)', overflow: 'hidden' }}
        >
          {evidence.assetPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={evidence.assetPath} alt={evidence.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-inter text-[10px] text-parchment-dark opacity-50 text-center px-1 leading-tight">
              {evidence.id}
            </span>
          )}
        </div>
        {/* Label */}
        <p className="font-inter text-[10px] text-obsidian leading-tight text-center truncate">
          {evidence.name}
        </p>
      </div>

      {/* Pin (drag-to-connect handle) */}
      <div
        data-pin="true"
        onPointerDown={(e) => { e.stopPropagation(); onPinDrag(evidence.id, e) }}
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full cursor-crosshair"
        style={{
          background: isAnchor ? 'var(--gold)' : 'var(--thread)',
          border: '1px solid var(--parchment-dark)',
          zIndex: 6,
        }}
        title="Drag to connect"
      />
    </div>
  )
}
