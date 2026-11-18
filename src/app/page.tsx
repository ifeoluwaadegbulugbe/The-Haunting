'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { useHydrated } from '@/store/useHydrated'

export default function TitleScreen() {
  const router = useRouter()
  const hydrated = useHydrated()
  const investigatorName = useGameStore((s) => s.investigator.name)
  const muted = useGameStore((s) => s.ui.muted)
  const toggleMute = useGameStore((s) => s.toggleMute)
  const resetStore = useGameStore((s) => s.resetStore)

  const [confirmNewOpen, setConfirmNewOpen] = useState(false)

  const hasSave = Boolean(investigatorName)

  const handleBegin = () => {
    router.push('/hq')
  }

  const handleNewInvestigation = () => {
    resetStore()
    setConfirmNewOpen(false)
    router.push('/hq')
  }

  if (!hydrated) return null

  return (
    <main className="relative w-full h-dvh overflow-hidden bg-obsidian">
      {/* Layer 1 — mansion illustration */}
      <Image
        src="/assets/ui/title-mansion.jpg"
        alt="Ashworth House at night"
        fill
        priority
        className="object-cover object-center"
        style={{ zIndex: 1 }}
        onError={() => {/* graceful — Next.js shows broken-image placeholder */}}
      />

      {/* Layer 2 — gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          zIndex: 2,
          background:
            'linear-gradient(to top, rgba(14,12,16,0.92) 40%, rgba(14,12,16,0.3) 100%)',
        }}
      />

      {/* Layer 3 — mist */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          backgroundImage:
            'radial-gradient(ellipse 60% 30% at 20% 85%, var(--parchment-dark), transparent 70%),' +
            'radial-gradient(ellipse 70% 25% at 75% 92%, var(--parchment-dark), transparent 70%)',
          width: '120%',
          opacity: 0.12,
          animation: 'drift 60s linear infinite alternate',
        }}
      />

      {/* Layer 4 — content */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-16 px-4 gap-4"
        style={{ zIndex: 4 }}
      >
        <span
          className="font-cinzel tracking-[0.4em] text-sm uppercase"
          style={{ color: 'var(--parchment-dark)' }}
        >
          THE
        </span>

        <h1
          className="font-cinzel font-bold uppercase text-parchment leading-none text-center"
          style={{ fontSize: 'clamp(48px, 10vw, 96px)' }}
        >
          HAUNTING
        </h1>

        {/* gold rule */}
        <div
          aria-hidden="true"
          className="w-48 h-px"
          style={{ background: 'var(--gold)' }}
        />

        <p
          className="font-cormorant tracking-widest text-sm uppercase"
          style={{ color: 'var(--parchment-dark)', letterSpacing: '0.3em' }}
        >
          INVESTIGATE · UNCOVER · BE FOUND
        </p>

        <div className="mt-4 flex flex-col items-center gap-3">
          <Button variant="primary" onClick={handleBegin} className="px-10 py-3 text-base">
            {hasSave ? 'CONTINUE INVESTIGATION' : 'BEGIN INVESTIGATION'}
          </Button>

          {hasSave && (
            <button
              onClick={() => setConfirmNewOpen(true)}
              className="font-inter text-xs tracking-wider underline cursor-pointer"
              style={{ color: 'var(--parchment-dark)', background: 'none', border: 'none' }}
            >
              New Investigation
            </button>
          )}
        </div>
      </div>

      {/* Layer 5 — mute toggle (fixed corner) */}
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="fixed bottom-5 right-5 p-2 rounded-full transition-opacity hover:opacity-100 opacity-60 cursor-pointer"
        style={{ zIndex: 10, background: 'rgba(14,12,16,0.5)', border: '1px solid var(--gold)' }}
      >
        {muted
          ? <VolumeX size={18} color="var(--parchment)" />
          : <Volume2 size={18} color="var(--parchment)" />
        }
      </button>

      {/* New investigation confirmation modal */}
      <Modal
        open={confirmNewOpen}
        onClose={() => setConfirmNewOpen(false)}
        title="Start a new investigation?"
      >
        <p className="font-inter text-parchment text-sm mb-6">
          Your current progress will be lost. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setConfirmNewOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleNewInvestigation}>
            Confirm
          </Button>
        </div>
      </Modal>
    </main>
  )
}
