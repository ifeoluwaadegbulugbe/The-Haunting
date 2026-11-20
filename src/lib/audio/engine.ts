/**
 * Audio engine on the native Web Audio API.
 *
 * Buses: music, ambient, sfx -> master. Music and ambience loop and crossfade when
 * the player changes room. Every sound tries its file first and falls back to a
 * sound synthesized here, so the game is never silent while assets are missing.
 * Browsers block audio until a user gesture: call unlock() from a click.
 */
import type { AudioSettings } from '@/types'

export type Bus = 'music' | 'ambient' | 'sfx'

export type SfxName =
  | 'click' | 'hover' | 'confirm' | 'deny' | 'chime' | 'sting' | 'static' | 'drone'
  | 'type' | 'whoosh' | 'stamp' | 'pin' | 'tape' | 'drawer' | 'page' | 'folder'
  | 'pickup' | 'whisper' | 'seal' | 'phone-ring' | 'heartbeat' | 'thread'

export type MusicId = 'theme' | 'house' | 'interview' | 'reveal' | 'none'
export type AmbientId = 'hq' | 'house' | 'interview' | 'none'

const A = '/assets/audio/'

// Files tried in order; when all are missing the synthesized version plays
const SFX_FILES: Partial<Record<SfxName, string[]>> = {
  drawer: [`${A}sfx-drawer.mp3`],
  page: [`${A}sfx-page.mp3`, `${A}page-rustle.mp3`],
  folder: [`${A}sfx-folder.mp3`, `${A}page-rustle.mp3`],
  stamp: [`${A}sfx-stamp.mp3`],
  pin: [`${A}sfx-pin.mp3`],
  tape: [`${A}sfx-tape.mp3`],
  pickup: [`${A}sfx-pickup.mp3`],
  whisper: [`${A}sfx-whisper.mp3`],
  seal: [`${A}sfx-seal.mp3`],
  'phone-ring': [`${A}phone-ring.mp3`],
  heartbeat: [`${A}heartbeat.mp3`],
}

const MUSIC_FILES: Record<Exclude<MusicId, 'none'>, string> = {
  theme: `${A}music-theme.mp3`,
  house: `${A}music-house.mp3`,
  interview: `${A}music-interview.mp3`,
  reveal: `${A}music-reveal.mp3`,
}

const AMBIENT_FILES: Record<Exclude<AmbientId, 'none'>, string> = {
  hq: `${A}ambient-hq.mp3`,
  house: `${A}ambient.mp3`,
  interview: `${A}ambient-interview.mp3`,
}

type Stopper = (fadeSec?: number) => void

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private buses: Partial<Record<Bus, GainNode>> = {}
  private buffers = new Map<string, AudioBuffer | null>()
  private settings: AudioSettings = { master: 0.8, music: 0.55, ambient: 0.7, sfx: 0.8, muted: false }
  private music: { id: MusicId; stop: Stopper } | null = null
  private ambient: { id: AmbientId; stop: Stopper } | null = null
  private drone: { level: number; stop: Stopper } | null = null
  private wantedMusic: MusicId = 'none'
  private wantedAmbient: AmbientId = 'none'
  private wantedDrone = 0
  private listeners = new Set<() => void>()
  unlocked = false

  // ── lifecycle ────────────────────────────────────────────────────────────

  subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  private emit() { this.listeners.forEach((fn) => fn()) }

  /** Must be called from a user gesture (click, key press). Safe to call repeatedly. */
  unlock() {
    if (typeof window === 'undefined') return
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.connect(this.ctx.destination)
      for (const b of ['music', 'ambient', 'sfx'] as Bus[]) {
        const g = this.ctx.createGain()
        g.connect(this.master)
        this.buses[b] = g
      }
      this.applySettings()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    if (!this.unlocked) {
      this.unlocked = true
      this.emit()
      // Start whatever the current room asked for before the gesture
      this.setMusic(this.wantedMusic, true)
      this.setAmbient(this.wantedAmbient, true)
      this.setDrone(this.wantedDrone)
    }
  }

  setSettings(s: AudioSettings) {
    this.settings = s
    this.applySettings()
  }

  private applySettings() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    this.master.gain.setTargetAtTime(this.settings.muted ? 0 : this.settings.master, t, 0.05)
    this.buses.music?.gain.setTargetAtTime(this.settings.music, t, 0.1)
    this.buses.ambient?.gain.setTargetAtTime(this.settings.ambient, t, 0.1)
    this.buses.sfx?.gain.setTargetAtTime(this.settings.sfx, t, 0.05)
  }

  // ── loading ──────────────────────────────────────────────────────────────

  private async load(url: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(url)) return this.buffers.get(url) ?? null
    if (!this.ctx) return null
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(String(res.status))
      const buf = await this.ctx.decodeAudioData(await res.arrayBuffer())
      this.buffers.set(url, buf)
      return buf
    } catch {
      this.buffers.set(url, null)
      return null
    }
  }

  private async firstAvailable(urls: string[]): Promise<AudioBuffer | null> {
    for (const u of urls) {
      const b = await this.load(u)
      if (b) return b
    }
    return null
  }

  // ── loops (music, ambience, entity drone) ────────────────────────────────

  private loopBuffer(buf: AudioBuffer, bus: Bus, fadeIn = 2): Stopper {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(1, ctx.currentTime + fadeIn)
    src.connect(g).connect(this.buses[bus]!)
    src.start()
    return (fade = 1.5) => {
      const t = ctx.currentTime
      g.gain.cancelScheduledValues(t)
      g.gain.setValueAtTime(g.gain.value, t)
      g.gain.linearRampToValueAtTime(0, t + fade)
      src.stop(t + fade + 0.05)
    }
  }

  setMusic(id: MusicId, force = false) {
    this.wantedMusic = id
    if (!this.unlocked || !this.ctx) return
    if (this.music?.id === id && !force) return
    this.music?.stop(2)
    this.music = null
    if (id === 'none') return
    const token = { id, stop: (() => undefined) as Stopper }
    this.music = token
    void this.load(MUSIC_FILES[id]).then((buf) => {
      if (this.music !== token) return
      token.stop = buf ? this.loopBuffer(buf, 'music', 2.5) : synthMusic(this.ctx!, this.buses.music!, id)
    })
  }

  setAmbient(id: AmbientId, force = false) {
    this.wantedAmbient = id
    if (!this.unlocked || !this.ctx) return
    if (this.ambient?.id === id && !force) return
    this.ambient?.stop(2)
    this.ambient = null
    if (id === 'none') return
    const token = { id, stop: (() => undefined) as Stopper }
    this.ambient = token
    void this.firstAvailable([AMBIENT_FILES[id]]).then((buf) => {
      if (this.ambient !== token) return
      token.stop = buf ? this.loopBuffer(buf, 'ambient', 3) : synthAmbient(this.ctx!, this.buses.ambient!, id)
    })
  }

  /** Entity presence under the mix: 0 none, 1 faint, 2 present, 3 heavy. */
  setDrone(level: number) {
    this.wantedDrone = level
    if (!this.unlocked || !this.ctx) return
    if (this.drone?.level === level) return
    this.drone?.stop(3)
    this.drone = null
    if (level <= 0) return
    this.drone = { level, stop: synthDrone(this.ctx, this.buses.ambient!, level) }
  }

  // ── one-shots ────────────────────────────────────────────────────────────

  sfx(name: SfxName, volume = 1) {
    if (!this.unlocked || !this.ctx) return
    const files = SFX_FILES[name]
    if (!files) return synthSfx(this.ctx, this.buses.sfx!, name, volume)
    void this.firstAvailable(files).then((buf) => {
      if (!this.ctx) return
      if (!buf) return synthSfx(this.ctx, this.buses.sfx!, name, volume)
      const src = this.ctx.createBufferSource()
      src.buffer = buf
      const g = this.ctx.createGain()
      g.gain.value = volume
      src.connect(g).connect(this.buses.sfx!)
      src.start()
    })
  }
}

export const audio = new AudioEngine()

// ── Synthesis ─────────────────────────────────────────────────────────────

function noiseBuffer(ctx: AudioContext, seconds: number, brown = false): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 } else d[i] = w
  }
  return buf
}

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}

function tone(ctx: AudioContext, out: AudioNode, freq: number, t: number, peak: number, attack: number, decay: number, type: OscillatorType = 'sine') {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  env(g, t, peak, attack, decay)
  o.connect(g).connect(out)
  o.start(t)
  o.stop(t + attack + decay + 0.05)
  return o
}

function burst(ctx: AudioContext, out: AudioNode, t: number, dur: number, peak: number, filter: { type: BiquadFilterType; freq: number; q?: number }) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, dur + 0.1)
  const f = ctx.createBiquadFilter()
  f.type = filter.type
  f.frequency.value = filter.freq
  f.Q.value = filter.q ?? 1
  const g = ctx.createGain()
  env(g, t, peak, Math.min(0.02, dur / 4), dur)
  src.connect(f).connect(g).connect(out)
  src.start(t)
  src.stop(t + dur + 0.1)
  return { f, g }
}

function synthSfx(ctx: AudioContext, out: AudioNode, name: SfxName, v: number) {
  const t = ctx.currentTime + 0.005
  switch (name) {
    case 'click': tone(ctx, out, 1400, t, 0.12 * v, 0.002, 0.05, 'triangle'); break
    case 'hover': tone(ctx, out, 2600, t, 0.03 * v, 0.002, 0.03); break
    case 'type': burst(ctx, out, t, 0.02, 0.05 * v, { type: 'highpass', freq: 3000 }); break
    case 'confirm':
      tone(ctx, out, 660, t, 0.12 * v, 0.005, 0.18)
      tone(ctx, out, 990, t + 0.09, 0.12 * v, 0.005, 0.3)
      break
    case 'deny':
      tone(ctx, out, 330, t, 0.1 * v, 0.005, 0.18, 'triangle')
      tone(ctx, out, 247, t + 0.12, 0.1 * v, 0.005, 0.3, 'triangle')
      break
    case 'chime':
      for (const [f, d] of [[880, 0], [1318.5, 0.06], [1760, 0.12]] as const) tone(ctx, out, f, t + d, 0.1 * v, 0.004, 1.4)
      break
    case 'sting': {
      const { f } = burst(ctx, out, t, 0.6, 0.12 * v, { type: 'bandpass', freq: 300, q: 0.7 })
      f.frequency.exponentialRampToValueAtTime(2400, t + 0.6)
      tone(ctx, out, 110, t + 0.55, 0.25 * v, 0.01, 2.2)
      tone(ctx, out, 164.8, t + 0.55, 0.12 * v, 0.01, 2.2)
      tone(ctx, out, 1320, t + 0.58, 0.06 * v, 0.004, 1.8)
      break
    }
    case 'static': {
      const { g } = burst(ctx, out, t, 0.45, 0.18 * v, { type: 'bandpass', freq: 2200, q: 0.4 })
      const lfo = ctx.createOscillator(); const lg = ctx.createGain()
      lfo.frequency.value = 38; lg.gain.value = 0.08 * v
      lfo.connect(lg).connect(g.gain); lfo.start(t); lfo.stop(t + 0.5)
      break
    }
    case 'whisper': {
      for (let i = 0; i < 4; i++) {
        const { f } = burst(ctx, out, t + i * 0.22, 0.28, 0.06 * v, { type: 'bandpass', freq: 1800 + i * 300, q: 6 })
        f.frequency.linearRampToValueAtTime(900 + i * 200, t + i * 0.22 + 0.28)
      }
      break
    }
    case 'drone': {
      const o = tone(ctx, out, 55, t, 0.2 * v, 0.6, 2.4, 'sawtooth')
      o.detune.linearRampToValueAtTime(-60, t + 3)
      break
    }
    case 'whoosh': {
      const { f } = burst(ctx, out, t, 0.55, 0.12 * v, { type: 'bandpass', freq: 400, q: 0.8 })
      f.frequency.exponentialRampToValueAtTime(3000, t + 0.5)
      break
    }
    case 'stamp':
      tone(ctx, out, 110, t, 0.35 * v, 0.003, 0.18)
      burst(ctx, out, t, 0.06, 0.15 * v, { type: 'lowpass', freq: 900 })
      break
    case 'seal':
      burst(ctx, out, t, 0.05, 0.2 * v, { type: 'highpass', freq: 1500 })
      burst(ctx, out, t + 0.06, 0.08, 0.12 * v, { type: 'bandpass', freq: 2500, q: 2 })
      break
    case 'pin': case 'thread':
      tone(ctx, out, name === 'pin' ? 3200 : 1900, t, 0.08 * v, 0.001, 0.06, 'square')
      burst(ctx, out, t, 0.03, 0.06 * v, { type: 'highpass', freq: 4000 })
      break
    case 'tape':
      burst(ctx, out, t, 0.04, 0.2 * v, { type: 'lowpass', freq: 1200 })
      burst(ctx, out, t + 0.05, 0.9, 0.03 * v, { type: 'highpass', freq: 5000 })
      break
    case 'drawer': {
      const { f } = burst(ctx, out, t, 0.5, 0.1 * v, { type: 'bandpass', freq: 500, q: 3 })
      f.frequency.linearRampToValueAtTime(700, t + 0.5)
      tone(ctx, out, 90, t + 0.48, 0.2 * v, 0.003, 0.15)
      break
    }
    case 'pickup':
      tone(ctx, out, 180, t, 0.2 * v, 0.003, 0.12, 'triangle')
      burst(ctx, out, t, 0.05, 0.08 * v, { type: 'bandpass', freq: 1000 })
      break
    case 'page': case 'folder': {
      const { f } = burst(ctx, out, t, 0.35, 0.08 * v, { type: 'bandpass', freq: 2500, q: 0.6 })
      f.frequency.linearRampToValueAtTime(5000, t + 0.3)
      break
    }
    case 'phone-ring':
      for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) {
        tone(ctx, out, 1000, t + r * 1.2 + i * 0.05, 0.05 * v, 0.002, 0.04, 'square')
      }
      break
    case 'heartbeat':
      for (let i = 0; i < 3; i++) {
        tone(ctx, out, 55, t + i * 0.9, 0.4 * v, 0.01, 0.15)
        tone(ctx, out, 50, t + i * 0.9 + 0.22, 0.3 * v, 0.01, 0.2)
      }
      break
  }
}

/** Slow dark pads in place of music files; each room gets its own colour. */
function synthMusic(ctx: AudioContext, out: AudioNode, id: Exclude<MusicId, 'none'>): Stopper {
  const cfg = {
    theme: { root: 55, chord: [1, 1.189, 1.498], cutoff: 700, pulse: 0 },
    house: { root: 49, chord: [1, 1.06, 1.498], cutoff: 450, pulse: 0 },
    interview: { root: 52, chord: [1, 1.189, 1.414], cutoff: 500, pulse: 1.25 },
    reveal: { root: 58.3, chord: [1, 1.26, 1.498, 2], cutoff: 1100, pulse: 0 },
  }[id]
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, ctx.currentTime)
  g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 4)
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'; f.frequency.value = cfg.cutoff; f.Q.value = 0.7
  f.connect(g).connect(out)
  const lfo = ctx.createOscillator(); const lfoG = ctx.createGain()
  lfo.frequency.value = 0.05; lfoG.gain.value = cfg.cutoff * 0.4
  lfo.connect(lfoG).connect(f.frequency); lfo.start()
  const oscs: OscillatorNode[] = [lfo]
  cfg.chord.forEach((ratio, i) => {
    for (const det of [-7, 7]) {
      const o = ctx.createOscillator()
      o.type = i === 0 ? 'sawtooth' : 'triangle'
      o.frequency.value = cfg.root * 2 * ratio
      o.detune.value = det
      const og = ctx.createGain(); og.gain.value = 0.12 / cfg.chord.length
      o.connect(og).connect(f); o.start(); oscs.push(o)
    }
  })
  const sub = ctx.createOscillator(); sub.frequency.value = cfg.root
  const sg = ctx.createGain(); sg.gain.value = 0.25
  sub.connect(sg).connect(g); sub.start(); oscs.push(sub)
  let timer: ReturnType<typeof setInterval> | null = null
  if (cfg.pulse) {
    timer = setInterval(() => {
      const t = ctx.currentTime
      tone(ctx, g, 55, t, 0.35, 0.01, 0.18)
      tone(ctx, g, 50, t + 0.24, 0.25, 0.01, 0.2)
    }, cfg.pulse * 1000)
  }
  return (fade = 2) => {
    if (timer) clearInterval(timer)
    const t = ctx.currentTime
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t)
    g.gain.linearRampToValueAtTime(0, t + fade)
    oscs.forEach((o) => o.stop(t + fade + 0.1))
  }
}

/** Room tone in place of missing ambience files. */
function synthAmbient(ctx: AudioContext, out: AudioNode, id: Exclude<AmbientId, 'none'>): Stopper {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, ctx.currentTime)
  g.gain.linearRampToValueAtTime(1, ctx.currentTime + 3)
  g.connect(out)
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, 4, true); src.loop = true
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = id === 'interview' ? 1200 : 500
  const ng = ctx.createGain(); ng.gain.value = id === 'interview' ? 0.05 : 0.09
  src.connect(f).connect(ng).connect(g); src.start()
  const extra: AudioScheduledSourceNode[] = [src]
  if (id === 'interview') {
    const hum = ctx.createOscillator(); hum.frequency.value = 50
    const hg = ctx.createGain(); hg.gain.value = 0.025
    hum.connect(hg).connect(g); hum.start(); extra.push(hum)
  }
  // HQ: a slow clock tick
  const timer = id === 'hq'
    ? setInterval(() => tone(ctx, g, 2400, ctx.currentTime, 0.025, 0.001, 0.03, 'square'), 1000)
    : null
  return (fade = 2) => {
    if (timer) clearInterval(timer)
    const t = ctx.currentTime
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t)
    g.gain.linearRampToValueAtTime(0, t + fade)
    extra.forEach((n) => n.stop(t + fade + 0.1))
  }
}

/** The entity's low presence under everything else. */
function synthDrone(ctx: AudioContext, out: AudioNode, level: number): Stopper {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, ctx.currentTime)
  g.gain.linearRampToValueAtTime(0.04 * level, ctx.currentTime + 5)
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180 + level * 60
  f.connect(g).connect(out)
  const oscs = [41.2, 41.7, 61.7].map((fr, i) => {
    const o = ctx.createOscillator(); o.type = i === 2 ? 'sine' : 'sawtooth'; o.frequency.value = fr
    o.connect(f); o.start(); return o
  })
  const trem = ctx.createOscillator(); const tg = ctx.createGain()
  trem.frequency.value = 0.15 + level * 0.1; tg.gain.value = 0.015 * level
  trem.connect(tg).connect(g.gain); trem.start(); oscs.push(trem)
  return (fade = 3) => {
    const t = ctx.currentTime
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t)
    g.gain.linearRampToValueAtTime(0, t + fade)
    oscs.forEach((o) => o.stop(t + fade + 0.1))
  }
}
