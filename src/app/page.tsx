'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Headphones } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { useHydrated } from '@/store/useHydrated'
import { audio } from '@/lib/audio/engine'
import { ease } from '@/lib/motion'

const TITLE = 'HAUNTING'

export default function TitleScreen() {
  const router = useRouter()
  const hydrated = useHydrated()
  const investigatorName = useGameStore((s) => s.investigator.name)
  const resetStore = useGameStore((s) => s.resetStore)
  const startInvestigation = useGameStore((s) => s.startInvestigation)

  // Browsers only allow sound after a click, so the game opens on a sound gate
  const unlocked = useSyncExternalStore(
    (fn) => audio.subscribe(fn),
    () => audio.unlocked,
    () => false
  )
  const [entered, setEntered] = useState(false)
  const showTitle = entered || unlocked

  const [confirmNewOpen, setConfirmNewOpen] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [name, setName] = useState('')

  const hasSave = Boolean(investigatorName)

  const handleEnter = () => {
    audio.unlock()
    audio.sfx('whoosh', 0.8)
    setTimeout(() => audio.sfx('phone-ring', 0.35), 1600)
    setEntered(true)
  }

  const handleBegin = () => {
    if (hasSave) return router.push('/hq')
    setNameOpen(true)
  }

  const handleNewInvestigation = () => {
    resetStore()
    setConfirmNewOpen(false)
    setNameOpen(true)
  }

  const handleStart = () => {
    const clean = name.trim().replace(/\s+/g, ' ').slice(0, 40)
    startInvestigation(clean || 'Investigator')
    setNameOpen(false)
    audio.sfx('seal', 0.9)
    router.push('/hq')
  }

  if (!hydrated) return null

  return (
    <main className="relative w-full h-dvh overflow-hidden bg-obsidian">
      {/* Mansion, slowly pushing in */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        initial={{ scale: 1.12, opacity: 0 }}
        animate={showTitle ? { scale: 1, opacity: 1 } : { scale: 1.12, opacity: 0.25 }}
        transition={{ duration: showTitle ? 14 : 1, ease: ease.drift }}
      >
        <Image src="/assets/ui/title-mansion.jpg" alt="Ashworth House at night" fill priority className="object-cover object-center" />
      </motion.div>

      {/* Window light flickering on the house */}
      <div
        aria-hidden="true"
        className="absolute glow-flicker pointer-events-none"
        style={{
          zIndex: 2, left: '58%', top: '38%', width: '14vw', height: '14vw',
          background: 'radial-gradient(circle, rgba(232,177,93,0.35), transparent 60%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Gradient and fog */}
      <div aria-hidden="true" className="absolute inset-0" style={{ zIndex: 3, background: 'linear-gradient(to top, rgba(14,12,16,0.94) 35%, rgba(14,12,16,0.25) 100%)' }} />
      <div
        aria-hidden="true"
        className="absolute -inset-x-[10%] bottom-0 h-1/2 fog-layer pointer-events-none"
        style={{
          zIndex: 4, opacity: 0.16,
          backgroundImage:
            'radial-gradient(ellipse 60% 30% at 20% 85%, var(--parchment-dark), transparent 70%),' +
            'radial-gradient(ellipse 70% 25% at 75% 92%, var(--parchment-dark), transparent 70%)',
        }}
      />

      <AnimatePresence mode="wait">
        {!showTitle ? (
          /* ── Sound gate ─────────────────────────────────────────────── */
          <motion.div
            key="gate"
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center"
            style={{ zIndex: 5 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
              <Headphones size={28} color="var(--parchment-dark)" className="mx-auto mb-4" />
              <p className="font-cormorant text-parchment text-2xl">This is a story best heard.</p>
              <p className="font-inter text-sm text-parchment-dark mt-2">Headphones recommended. You can change the sound at any time.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}>
              <Button variant="primary" onClick={handleEnter} className="px-10 py-3 text-base">
                Enter the archive
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          /* ── Title ──────────────────────────────────────────────────── */
          <motion.div
            key="title"
            className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-16 px-4 gap-4"
            style={{ zIndex: 5 }}
            initial="hidden"
            animate="shown"
            variants={{ shown: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } } }}
          >
            <motion.span
              variants={{ hidden: { opacity: 0, letterSpacing: '1.2em' }, shown: { opacity: 1, letterSpacing: '0.4em' } }}
              transition={{ duration: 1.6, ease: ease.settle }}
              className="font-cinzel text-sm uppercase"
              style={{ color: 'var(--parchment-dark)' }}
            >
              THE
            </motion.span>

            <h1
              className="font-cinzel font-bold uppercase text-parchment leading-none text-center flex"
              style={{ fontSize: 'clamp(48px, 10vw, 96px)' }}
              aria-label="Haunting"
            >
              {TITLE.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  variants={{
                    hidden: { opacity: 0, y: 30, filter: 'blur(12px)' },
                    shown: { opacity: 1, y: 0, filter: 'blur(0px)' },
                  }}
                  transition={{ duration: 1.1, ease: ease.settle }}
                >
                  {ch}
                </motion.span>
              ))}
            </h1>

            <motion.div
              aria-hidden="true"
              className="w-48 h-px"
              style={{ background: 'var(--gold)', transformOrigin: 'center' }}
              variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1 } }}
              transition={{ duration: 1.2, ease: ease.settle }}
            />

            <motion.p
              variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
              transition={{ duration: 1.2 }}
              className="font-cormorant text-sm uppercase"
              style={{ color: 'var(--parchment-dark)', letterSpacing: '0.3em' }}
            >
              INVESTIGATE · UNCOVER · BE FOUND
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.8, ease: ease.settle }}
              className="mt-4 flex flex-col items-center gap-3"
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Investigator name */}
      <Modal open={nameOpen} onClose={() => setNameOpen(false)} title="Who is investigating?">
        <form onSubmit={(e) => { e.preventDefault(); handleStart() }} className="space-y-4">
          <label className="block font-inter text-sm text-parchment">
            Your name
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={() => audio.sfx('type', 0.5)}
              maxLength={40}
              placeholder="Investigator"
              className="mt-2 w-full bg-ink border border-gold text-parchment font-inter text-base rounded px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
          </label>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setNameOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Begin</Button>
          </div>
        </form>
      </Modal>

      {/* New investigation confirmation */}
      <Modal open={confirmNewOpen} onClose={() => setConfirmNewOpen(false)} title="Start a new investigation?">
        <p className="font-inter text-parchment text-sm mb-6">Your current progress will be lost. This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setConfirmNewOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleNewInvestigation}>Confirm</Button>
        </div>
      </Modal>
    </main>
  )
}
