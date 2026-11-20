'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Phone, SkipForward } from 'lucide-react'
import { Button, Stamp, WaxSeal } from '@/components/ui'
import { audio } from '@/lib/audio/engine'
import { ease } from '@/lib/motion'

type Step = 'ring' | 'call' | 'file' | 'brief'

interface CaseAssignmentProps {
  investigatorName: string
  onEnter: () => void
  onSkip: () => void
}

const CALL_LINES = (name: string) => [
  `Investigator ${name}.`,
  'A house on Hollow Lane has been telephoning the same neighbour every night for eighteen years.',
  'Always at 11:13. Nobody has lived there since November 2008.',
  'The file is on your desk. Find out who is calling.',
]

const OBJECTIVES = [
  'Who is making the calls?',
  'Why did the family disappear?',
  'What happened on the final night?',
  'Why does it keep calling?',
  'Which witness concealed the most?',
]

const FACTS = [
  ['Missing', 'Edmund Ashworth, 44 · Clara Ashworth, 41 · Lily Ashworth, 9'],
  ['Last seen', '11 November 2008, Ashworth House'],
  ['Official finding', 'Voluntary disappearance. Case closed.'],
  ['Reported activity', 'Nightly call from the house line, 11:13'],
]

/** Typed-out subtitle line. */
function Typed({ text, onDone }: { text: string; onDone?: () => void }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    const t = setInterval(() => {
      setN((v) => {
        if (v >= text.length) { clearInterval(t); onDone?.(); return v }
        if (v % 3 === 0) audio.sfx('type', 0.25)
        return v + 1
      })
    }, 28)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  return <span className={n < text.length ? 'caret' : ''}>{text.slice(0, n)}</span>
}

/**
 * The case assignment: the phone rings, a voice on the line (subtitled), the file
 * slides onto the desk, the seal breaks, the briefing opens. Skippable at any point.
 */
export function CaseAssignment({ investigatorName, onEnter, onSkip }: CaseAssignmentProps) {
  const [step, setStep] = useState<Step>('ring')
  const [line, setLine] = useState(0)
  const [lineDone, setLineDone] = useState(false)
  const [sealBroken, setSealBroken] = useState(false)
  const lines = CALL_LINES(investigatorName || 'Investigator')

  // Ring until answered
  useEffect(() => {
    if (step !== 'ring') return
    audio.sfx('phone-ring', 0.8)
    const t = setInterval(() => audio.sfx('phone-ring', 0.8), 3200)
    return () => clearInterval(t)
  }, [step])

  // Esc skips
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onSkip() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSkip])

  const nextLine = () => {
    if (!lineDone) return
    if (line < lines.length - 1) { setLine(line + 1); setLineDone(false) }
    else { audio.sfx('pickup', 0.6); audio.sfx('folder'); setStep('file') }
  }

  return (
    <motion.div
      className="fixed inset-0 overflow-y-auto"
      style={{ zIndex: 55, background: 'var(--ink)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      role="dialog"
      aria-modal="true"
      aria-label="Case assignment"
    >
      <button
        onClick={onSkip}
        className="fixed top-4 right-4 z-10 flex items-center gap-2 font-inter text-xs text-parchment-dark hover:text-parchment px-3 py-2 rounded border border-brown"
      >
        <SkipForward size={14} /> Skip
      </button>

      <AnimatePresence mode="wait">
        {step === 'ring' && (
          <motion.div key="ring" className="min-h-dvh flex flex-col items-center justify-center gap-8 px-6" exit={{ opacity: 0 }}>
            <motion.div animate={{ rotate: [-12, 12, -12, 12, 0] }} transition={{ repeat: Infinity, duration: 0.9, repeatDelay: 1.6 }}>
              <Phone size={56} color="var(--candle)" />
            </motion.div>
            <p className="font-cinzel tracking-[0.35em] text-parchment-dark text-sm">THE TELEPHONE IS RINGING</p>
            <Button variant="primary" onClick={() => { audio.sfx('pickup'); setStep('call') }} className="px-10 py-3">
              Answer
            </Button>
          </motion.div>
        )}

        {step === 'call' && (
          <motion.div
            key="call"
            className="min-h-dvh flex flex-col items-center justify-center gap-10 px-6 text-center cursor-pointer"
            onClick={nextLine}
            exit={{ opacity: 0 }}
          >
            <p className="font-inter text-xs tracking-[0.3em] text-parchment-dark">THE LINE CRACKLES</p>
            <p className="font-cormorant text-parchment text-2xl md:text-3xl max-w-2xl leading-snug min-h-24" aria-live="polite">
              <Typed key={line} text={lines[line]} onDone={() => setLineDone(true)} />
            </p>
            <motion.p animate={{ opacity: lineDone ? 1 : 0 }} className="font-inter text-xs text-parchment-dark">
              Click to continue
            </motion.p>
          </motion.div>
        )}

        {step === 'file' && (
          <motion.div key="file" className="min-h-dvh flex flex-col items-center justify-center gap-8 px-6" exit={{ opacity: 0 }}>
            <motion.div
              className="relative w-[min(560px,90vw)] aspect-[4/3] rounded-sm overflow-hidden"
              style={{ boxShadow: '0 30px 70px rgba(0,0,0,0.8)' }}
              initial={{ x: '-120vw', rotate: -18 }}
              animate={sealBroken ? { x: 0, rotate: 0, scale: 1.04 } : { x: 0, rotate: -3 }}
              transition={{ duration: 1.2, ease: ease.settle }}
              onAnimationStart={() => setTimeout(() => audio.sfx('whoosh', 0.6), 200)}
            >
              <Image src="/assets/ui/case-file.jpg" alt="" fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: 'linear-gradient(160deg, rgba(185,169,140,0.92), rgba(81,65,61,0.92))' }}>
                <p className="font-cinzel text-obsidian text-3xl tracking-[0.25em]">CASE 001</p>
                <p className="font-cormorant italic text-obsidian text-xl">The House That Calls Back</p>
                <Stamp label="CLASSIFIED" variant="unresolved" />
              </div>
              <motion.div
                className="absolute left-1/2 top-[78%] -translate-x-1/2 -translate-y-1/2"
                animate={sealBroken ? { scale: [1, 1.3, 0], rotate: [0, 10, 40], opacity: [1, 1, 0] } : { scale: [1, 1.06, 1] }}
                transition={sealBroken ? { duration: 0.6 } : { repeat: Infinity, duration: 1.6 }}
              >
                <WaxSeal />
              </motion.div>
            </motion.div>
            {!sealBroken ? (
              <Button variant="primary" onClick={() => { audio.sfx('seal'); setSealBroken(true); setTimeout(() => { audio.sfx('page'); setStep('brief') }, 1100) }}>
                Break the seal
              </Button>
            ) : <div className="h-11" />}
          </motion.div>
        )}

        {step === 'brief' && (
          <motion.div key="brief" className="relative min-h-dvh" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="fixed inset-0" initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 20, ease: ease.drift }}>
              <Image src="/assets/ui/title-mansion.jpg" alt="Ashworth House" fill className="object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(14,12,16,0.95) 0%, rgba(14,12,16,0.75) 55%, rgba(14,12,16,0.4) 100%)' }} />
            </motion.div>

            <div className="relative min-h-dvh flex flex-col justify-center gap-6 px-6 md:px-16 py-16 max-w-3xl">
              <motion.p initial={{ opacity: 0, letterSpacing: '0.8em' }} animate={{ opacity: 1, letterSpacing: '0.35em' }} transition={{ duration: 1.4 }} className="font-cinzel text-xs text-parchment-dark">
                CASE 001 · BRIEFING
              </motion.p>
              <motion.h2 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9 }} className="font-cormorant font-bold text-parchment text-4xl md:text-5xl">
                The House That Calls Back
              </motion.h2>

              <div className="grid sm:grid-cols-2 gap-3">
                {FACTS.map(([k, v], i) => (
                  <motion.div
                    key={k}
                    initial={{ opacity: 0, x: -30, rotate: -2 }}
                    animate={{ opacity: 1, x: 0, rotate: i % 2 ? 0.8 : -0.8 }}
                    transition={{ delay: 0.8 + i * 0.35, duration: 0.6, ease: ease.settle }}
                    onAnimationStart={() => setTimeout(() => audio.sfx('page', 0.5), 800 + i * 350)}
                    className="rounded-sm px-4 py-3"
                    style={{ background: 'linear-gradient(160deg, var(--parchment-light), var(--parchment))', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}
                  >
                    <p className="font-inter text-[10px] tracking-[0.2em] text-brown uppercase">{k}</p>
                    <p className="font-cormorant text-obsidian text-lg leading-snug">{v}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4, duration: 0.8 }}>
                <p className="font-cinzel text-xs tracking-[0.3em] text-parchment-dark mb-2">YOUR OBJECTIVES</p>
                <ol className="space-y-1">
                  {OBJECTIVES.map((o, i) => (
                    <motion.li key={o} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.6 + i * 0.15 }} className="font-cormorant text-parchment text-xl">
                      <span className="text-gold mr-2">{i + 1}.</span>{o}
                    </motion.li>
                  ))}
                </ol>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.6 }}>
                <Button variant="primary" onClick={() => { audio.sfx('whoosh'); onEnter() }} className="px-10 py-3 text-base">
                  Enter Ashworth House
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
