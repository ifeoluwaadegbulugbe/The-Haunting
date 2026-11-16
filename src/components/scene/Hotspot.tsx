'use client'

import { Lock } from 'lucide-react'
import { DisturbedRing } from '@/components/entity/DisturbedHotspot'
import type { SceneObject } from '@/types'

export type HotspotState = 'undiscovered' | 'inspected' | 'locked' | 'disturbed'

interface HotspotProps {
  object: SceneObject
  state: HotspotState
  onClick: () => void
  lockedMessage?: string
}

export function Hotspot({ object, state, onClick, lockedMessage }: HotspotProps) {
  const { hotspot, name } = object
  const size = Math.max(44, hotspot.r * 2 * 8) // minimum 44px touch target

  const isLocked = state === 'locked'

  return (
    <button
      role="button"
      aria-label={name}
      aria-pressed={state === 'inspected'}
      title={isLocked ? (lockedMessage ?? 'Locked') : name}
      onClick={isLocked ? undefined : onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      style={{
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `${size}px`,
        height: `${size}px`,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        background: 'transparent',
        border: 'none',
        padding: 0,
      }}
    >
      {state === 'disturbed' ? (
        <DisturbedRing size={size} />
      ) : (
        <svg
          viewBox="0 0 40 40"
          width={size}
          height={size}
          aria-hidden="true"
          style={
            state === 'undiscovered'
              ? { animation: 'pulse-ring 2s ease-in-out infinite' }
              : undefined
          }
        >
          <circle
            cx="20" cy="20" r="17"
            fill="none"
            stroke={
              state === 'locked'
                ? 'var(--parchment-dark)'
                : 'var(--gold)'
            }
            strokeWidth={state === 'inspected' ? 1.5 : 2}
            opacity={state === 'inspected' ? 0.3 : state === 'locked' ? 0.4 : 0.85}
          />
          {state === 'undiscovered' && (
            <circle cx="20" cy="20" r="5" fill="var(--gold)" opacity="0.6" />
          )}
        </svg>
      )}

      {isLocked && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Lock
            size={Math.max(12, size * 0.35)}
            color="var(--parchment-dark)"
            opacity={0.7}
          />
        </span>
      )}
    </button>
  )
}
