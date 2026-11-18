import Image from 'next/image'
import { ArchiveFrame } from '@/components/ui'
import { TrustMeter } from './TrustMeter'
import type { Witness } from '@/types'

interface WitnessPortraitProps {
  witness: Witness
  trust: number
  flickering?: boolean // ER-05 apparition effect
}

export function WitnessPortrait({ witness, trust, flickering }: WitnessPortraitProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-56 mx-auto md:mx-0 md:w-56 flex-shrink-0">
      <ArchiveFrame className="overflow-hidden">
        <div
          className="relative w-full"
          style={{
            aspectRatio: '3/4',
            background: 'var(--ink)',
            animation: flickering ? 'flicker 0.3s ease-in-out infinite' : undefined,
          }}
        >
          <Image
            src={witness.portrait}
            alt={witness.name}
            fill
            className="object-cover object-top"
          />
          {/* dark vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 50%, rgba(14,12,16,0.7) 100%)',
            }}
            aria-hidden="true"
          />
        </div>
      </ArchiveFrame>

      <div className="space-y-1 px-1">
        <h2 className="font-cormorant font-bold text-parchment text-lg leading-tight">
          {witness.name}
        </h2>
        <p className="font-inter text-xs text-parchment-dark">{witness.role}</p>
        <TrustMeter trust={trust} />
      </div>
    </div>
  )
}
