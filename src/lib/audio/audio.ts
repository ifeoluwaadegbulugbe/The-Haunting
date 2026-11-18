export type SoundName = 'ambient' | 'phone-ring' | 'page-rustle' | 'heartbeat'

const cache = new Map<SoundName, HTMLAudioElement>()

/**
 * Plays a sound with the native Audio object. Does nothing when muted, on the
 * server, or if the file is missing or the browser blocks autoplay.
 */
export function playSound(name: SoundName, muted: boolean, volume = 0.6): void {
  if (muted || typeof window === 'undefined') return
  try {
    let audio = cache.get(name)
    if (!audio) {
      audio = new Audio(`/assets/audio/${name}.mp3`)
      cache.set(name, audio)
    }
    audio.volume = volume
    audio.currentTime = 0
    void audio.play().catch(() => undefined)
  } catch {
    // audio is optional
  }
}