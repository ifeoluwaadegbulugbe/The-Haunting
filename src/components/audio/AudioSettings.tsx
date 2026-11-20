'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Volume2, VolumeX, SlidersHorizontal } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { DEFAULT_AUDIO } from '@/store/migrations'
import type { AudioSettings as Settings } from '@/types'

const SLIDERS: Array<{ key: keyof Omit<Settings, 'muted'>; label: string }> = [
  { key: 'master', label: 'Master' },
  { key: 'music', label: 'Music' },
  { key: 'ambient', label: 'Ambience' },
  { key: 'sfx', label: 'Effects' },
]

/** Floating sound control on every screen: mute, plus a panel with volume sliders. */
export function AudioSettings() {
  const settings = useGameStore((s) => s.audio ?? DEFAULT_AUDIO)
  const setAudio = useGameStore((s) => s.setAudio)
  const toggleMute = useGameStore((s) => s.toggleMute)
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed right-4 z-[45] flex flex-col items-end gap-2" style={{ bottom: '84px' }}>
      <AnimatePresence>
        {open && (
          <motion.div
            id="audio-panel"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="w-60 rounded-lg p-4 space-y-3 border border-gold"
            style={{ background: 'rgba(14,12,16,0.94)' }}
          >
            <p className="font-cinzel text-xs tracking-[0.25em] text-parchment-dark">SOUND</p>
            {SLIDERS.map(({ key, label }) => (
              <label key={key} className="block font-inter text-xs text-parchment">
                <span className="flex justify-between mb-1">
                  {label}
                  <span className="text-parchment-dark tabular-nums">{Math.round(settings[key] * 100)}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(settings[key] * 100)}
                  onChange={(e) => setAudio({ [key]: Number(e.target.value) / 100 })}
                  className="w-full accent-[var(--gold)]"
                  aria-label={`${label} volume`}
                />
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Sound settings"
          aria-expanded={open}
          aria-controls="audio-panel"
          className="p-2 rounded-full border border-gold opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          style={{ background: 'rgba(14,12,16,0.6)' }}
        >
          <SlidersHorizontal size={16} color="var(--parchment)" />
        </button>
        <button
          onClick={toggleMute}
          aria-label={settings.muted ? 'Unmute' : 'Mute'}
          className="p-2 rounded-full border border-gold opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          style={{ background: 'rgba(14,12,16,0.6)' }}
        >
          {settings.muted ? <VolumeX size={16} color="var(--parchment)" /> : <Volume2 size={16} color="var(--parchment)" />}
        </button>
      </div>
    </div>
  )
}
