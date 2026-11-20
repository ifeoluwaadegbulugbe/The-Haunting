'use client'

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import Image from 'next/image'
import { prefersReducedMotion } from '@/lib/motion'

export interface Glow { x: number; y: number; size: number; color?: string }

interface RoomStageProps {
  src: string
  /** Used if `src` has not been added yet (lets rooms work before their art exists). */
  fallbackSrc?: string
  /** Extra tint applied when the fallback art is showing, so stand-ins read as a different room. */
  fallbackFilter?: string
  alt: string
  ratio: number
  /** Point (in % of the picture) the camera pushes into, or null for the full room. */
  zoom?: { x: number; y: number } | null
  zoomScale?: number
  zoomMs?: number
  glows?: Glow[]
  dust?: boolean
  fog?: boolean
  scrollRef?: RefObject<HTMLDivElement | null>
  /** Hotspots and other things that sit on the picture, positioned in % of it. */
  children?: ReactNode
}

/**
 * One room of the game world. The picture and everything placed on it share a
 * surface with the picture's proportions, so hotspots stay on their objects at any
 * screen size. Narrow screens pan sideways. Adds parallax depth, a slow push-in on
 * entry, candle glows, dust and fog.
 */
export function RoomStage({
  src, fallbackSrc, fallbackFilter, alt, ratio, zoom = null, zoomScale = 2.4, zoomMs = 700,
  glows = [], dust = true, fog = true, scrollRef, children,
}: RoomStageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const usingFallback = imgSrc !== src
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const reduced = typeof window !== 'undefined' && prefersReducedMotion()

  // Depth: the room drifts slightly against the pointer
  useEffect(() => {
    if (reduced) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setTilt({
          x: (e.clientX / window.innerWidth - 0.5) * -14,
          y: (e.clientY / window.innerHeight - 0.5) * -10,
        })
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [reduced])

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 overflow-x-auto overflow-y-hidden"
      style={{ zIndex: 1, scrollbarWidth: 'none' }}
    >
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2"
        style={{
          width: `max(100%, calc(100dvh * ${ratio}))`,
          height: `max(100%, calc(100vw / ${ratio}))`,
          transform: zoom ? `scale(${zoomScale})` : 'scale(1)',
          transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : undefined,
          transition: reduced ? 'none' : `transform ${zoomMs}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
        }}
      >
        <div className="absolute inset-0 room-push">
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${tilt.x}px, ${tilt.y}px) scale(1.03)`,
              transition: 'transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)',
            }}
          >
            <Image
              src={imgSrc}
              alt={alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={usingFallback && fallbackFilter ? { filter: fallbackFilter } : undefined}
              onError={() => { if (fallbackSrc && imgSrc !== fallbackSrc) setImgSrc(fallbackSrc) }}
            />
            {glows.map((g, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="absolute glow-flicker pointer-events-none rounded-full"
                style={{
                  left: `${g.x}%`, top: `${g.y}%`, width: `${g.size}%`, aspectRatio: '1',
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, ${g.color ?? 'rgba(232,177,93,0.32)'}, transparent 62%)`,
                  mixBlendMode: 'screen',
                  animationDelay: `${i * 0.7}s`,
                }}
              />
            ))}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(14,12,16,0.55) 100%), linear-gradient(to top, rgba(14,12,16,0.5) 0%, rgba(14,12,16,0.05) 55%)' }}
            />
            {children}
          </div>
        </div>
      </div>

      {fog && !reduced && (
        <div
          aria-hidden="true"
          className="fixed -inset-x-[10%] bottom-0 h-[45%] fog-layer pointer-events-none"
          style={{
            zIndex: 2, opacity: 0.1,
            backgroundImage:
              'radial-gradient(ellipse 55% 35% at 25% 90%, var(--parchment-dark), transparent 70%),' +
              'radial-gradient(ellipse 65% 30% at 78% 95%, var(--parchment-dark), transparent 70%)',
          }}
        />
      )}
      {dust && !reduced && <Dust />}
    </div>
  )
}

/** Slow dust motes catching the candlelight. Paused when the tab is hidden. */
function Dust() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let w = 0, h = 0, raf = 0
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const motes = Array.from({ length: 55 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.6 + 0.4, vx: (Math.random() - 0.5) * 0.12, vy: -Math.random() * 0.15 - 0.02,
      a: Math.random() * 0.35 + 0.08, p: Math.random() * Math.PI * 2,
    }))
    const tick = () => {
      if (!document.hidden) {
        ctx.clearRect(0, 0, w, h)
        for (const m of motes) {
          m.x += m.vx + Math.sin(m.p += 0.01) * 0.08
          m.y += m.vy
          if (m.y < -5) { m.y = h + 5; m.x = Math.random() * w }
          if (m.x < -5) m.x = w + 5
          if (m.x > w + 5) m.x = -5
          ctx.beginPath()
          ctx.fillStyle = `rgba(234, 214, 170, ${m.a})`
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} aria-hidden="true" className="fixed inset-0 pointer-events-none" style={{ zIndex: 3 }} />
}
