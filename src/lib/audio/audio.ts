import { audio, type SfxName } from './engine'

export type SoundName = SfxName | 'page-rustle'

/**
 * Plays a one-shot sound through the audio engine. Mute and volume come from the
 * player's audio settings, so callers don't pass them (the extra arguments are kept
 * for older call sites and only the volume is used).
 */
export function playSound(name: SoundName, _muted?: boolean, volume = 1): void {
  audio.sfx(name === 'page-rustle' ? 'page' : name, volume)
}

export const sfx = (name: SfxName, volume = 1) => audio.sfx(name, volume)
