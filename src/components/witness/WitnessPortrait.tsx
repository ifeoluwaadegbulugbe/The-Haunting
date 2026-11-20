'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArchiveFrame } from '@/components/ui'
import { TrustMeter } from './TrustMeter'
import { useAsset } from '@/lib/useAsset'
import type { Witness } from '@/types'

export type WitnessMood = 'calm' | 'afraid' | 'defensive' | 'cold'

interface WitnessPortraitProps {
  witness: Witness
  trust: number
  mood?: WitnessMood
  /** Cornered: evidence has just broken a lie, or trust is very low. */
  pressured?: boolean
  flickering?: boolean // ER-05 apparition effect
}

// Body language per mood: frightened people tremble, defensive ones pull back,
// cold ones go still and dark.
const MOOD_MOTION: Record<WitnessMood, { animate: Record<string, number[] | number>; transition: object; filter: string }> = {
  calm: { animate: { y: [0, -2, 0] }, transition: { repeat: Infinity, duration: 5, ease: 'easeInOut' }, filter: 'none' },
  afraid: { animate: { x: [0, -1.5, 1.5, -1, 0] }, transition: { repeat: Infinity, duration: 0.5 }, filter: 'saturate(0.7) brightness(0.92)' },
  defensive: { animate: { x: 6, scale: 0.97 }, transition: { type: 'spring', stiffness: 120, damping: 14 }, filter: 'contrast(1.1)' },
  cold: { animate: { scale: 1.02 }, transition: { duration: 1.2 }, filter: 'brightness(0.78) contrast(1.15) saturate(0.6)' },
}

export function WitnessPortrait({ witness, trust, mood = 'calm', pressured = false, flickering }: WitnessPortraitProps) {
  const pressuredSrc = witness.portrait.replace(/\.(jpg|png)$/, '-pressured.$1')
  const hasPressured = useAsset(pressuredSrc)
  const showPressured = pressured && hasPressured
  const m = MOOD_MOTION[mood]

  return (
    <div className="flex flex-col gap-3 w-full max-w-64 mx-auto md:mx-0 md:w-64 flex-shrink-0">
      <ArchiveFrame className="overflow-hidden">
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: '3/4',
            background: 'var(--ink)',
            animation: flickering ? 'flicker 0.3s ease-in-out infinite' : undefined,
          }}
        >
          <motion.div className="absolute inset-0" animate={m.animate} transition={m.transition} style={{ filter: m.filter, transition: 'filter 0.8s' }}>
            <Image src={witness.portrait} alt={witness.name} fill className="object-cover object-top" style={{ opacity: showPressured ? 0 : 1, transition: 'opacity 0.6s' }} />
            {hasPressured && (
              <Image src={pressuredSrc} alt="" fill className="object-cover object-top" style={{ opacity: showPressured ? 1 : 0, transition: 'opacity 0.6s' }} />
            )}
          </motion.div>
          {/* lamp light from one side, deeper when pressured */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: pressured
                ? 'radial-gradient(ellipse at 30% 30%, transparent 25%, rgba(14,12,16,0.85) 95%)'
                : 'radial-gradient(ellipse at 35% 30%, transparent 40%, rgba(14,12,16,0.7) 100%)',
              transition: 'background 0.8s',
            }}
          />
        </div>
      </ArchiveFrame>

      <div className="space-y-1 px-1">
        <h2 className="font-cormorant font-bold text-parchment text-lg leading-tight">{witness.name}</h2>
        <p className="font-inter text-xs text-parchment-dark">{witness.role}</p>
        <p className="font-inter text-xs text-parchment-dark italic capitalize">Seems {mood === 'calm' ? 'composed' : mood}</p>
        <TrustMeter trust={trust} />
      </div>
    </div>
  )
}
