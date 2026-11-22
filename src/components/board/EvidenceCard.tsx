'use client'

import { useRef, useState, useCallback } from 'react'
import type { Evidence } from '@/types'
import { audio } from '@/lib/audio/engine'

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
  const [lifted, setLifted] = useState(false)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isAnchor) return
    // Only drag on the card body (not the pin)
    const target = e.target as HTMLElement
    if (target.closest('[data-pin]')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, startY: e.clientY, origX: localPos.x, origY: localPos.y }
    setLifted(true)
    audio.sfx('page', 0.35)
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
    setLifted(false)
    audio.sfx('pin', 0.7)
  }, [evidence.id, localPos, onMove])

  return (
    <div
      ref={ref}
      data-card={evidence.id}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="absolute select-none"
      style={{
        left: localPos.x,
        top: localPos.y,
        width: '120px',
        cursor: isAnchor ? 'default' : 'grab',
        zIndex: lifted ? 9 : 5,
        touchAction: 'none',
        transform: lifted ? 'scale(1.07) rotate(-2deg)' : `scale(1) rotate(${cardTilt(evidence.id)}deg)`,
        filter: lifted ? 'drop-shadow(0 18px 18px rgba(14,12,16,0.6))' : 'drop-shadow(0 4px 6px rgba(14,12,16,0.5))',
        transition: 'transform 0.18s ease, filter 0.18s ease',
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
          <CardThumb evidence={evidence} />
        </div>
        {/* Label */}
        <p className="font-inter text-[10px] text-obsidian leading-tight text-center truncate">
          {evidence.name}
        </p>
      </div>

      {/* Pin (drag-to-connect handle) */}
      <div
        data-pin="true"
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onPinDrag(evidence.id, e) }}
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

// Close-up photographs the player has already seen, reused as card pictures
const PHOTO_FOR: Record<string, string> = {
  'EV-01': '/assets/evidence/telephone.png',
  'EV-03': '/assets/evidence/diary.png',
  'EV-06': '/assets/evidence/cabinet.jpg',
  'EV-07': '/assets/evidence/recorder.png',
  'EV-08': '/assets/evidence/clock.png',
  'EV-10': '/assets/evidence/rug-notice.jpg',
}

/** The picture on a board card: a photo where one exists, otherwise a small drawn document. */
function CardThumb({ evidence }: { evidence: Evidence }) {
  const src = evidence.assetPath ?? PHOTO_FOR[evidence.id]
  if (src) {
    const cutout = src.endsWith('.png')
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={evidence.name}
        draggable={false}
        className={`w-full h-full pointer-events-none ${cutout ? 'object-contain p-1' : 'object-cover'}`}
        style={cutout ? { filter: 'drop-shadow(0 4px 4px rgba(14,12,16,0.7))' } : undefined}
      />
    )
  }
  const k = evidence.kind
  return (
    <div aria-hidden="true" className="w-full h-full p-1.5" style={{ background: k === 'email' || k === 'profile' || k === 'callRecord' || k === 'audio' ? 'var(--ink)' : 'var(--parchment)' }}>
      {k === 'audio' ? (
        <div className="h-full flex items-center gap-[2px]">
          {Array.from({ length: 22 }, (_, i) => <span key={i} className="flex-1 rounded-sm" style={{ height: 6 + ((i * 37) % 26), background: 'var(--candle)', opacity: 0.85 }} />)}
        </div>
      ) : k === 'callRecord' ? (
        <div className="space-y-1 pt-1">
          {[0, 1, 2, 3].map((i) => <div key={i} className="flex gap-1"><span className="h-1 w-6 rounded" style={{ background: 'var(--parchment-dark)', opacity: 0.6 }} /><span className="h-1 flex-1 rounded" style={{ background: i === 2 ? 'var(--thread)' : 'var(--parchment-dark)', opacity: i === 2 ? 1 : 0.4 }} /></div>)}
        </div>
      ) : k === 'email' || k === 'profile' ? (
        <div className="space-y-1">
          <span className="block h-2 w-3/5 rounded" style={{ background: 'var(--gold)', opacity: 0.7 }} />
          {[0, 1, 2].map((i) => <span key={i} className="block h-1 rounded" style={{ width: `${90 - i * 18}%`, background: 'var(--parchment-dark)', opacity: 0.5 }} />)}
        </div>
      ) : (
        <div className="space-y-1">
          <span className="block h-2 w-4/5 rounded-sm" style={{ background: 'var(--obsidian)', opacity: 0.75 }} />
          {[0, 1, 2, 3, 4].map((i) => <span key={i} className="block h-[3px] rounded" style={{ width: `${96 - ((i * 23) % 30)}%`, background: 'var(--brown)', opacity: 0.55 }} />)}
        </div>
      )}
    </div>
  )
}

/** A small fixed tilt per card, so the board looks pinned by hand. */
export function cardTilt(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return ((Math.abs(h) % 7) - 3) * 0.8
}
