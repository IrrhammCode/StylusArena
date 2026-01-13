// Shared audio utilities for all games

export class GameAudio {
  private audioContext: AudioContext | null = null
  private musicInterval: NodeJS.Timeout | null = null
  private isPlaying: boolean = false
  private volume: number = 0.5

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.log('Audio context not available')
      }
    }
  }

  // Background music - upbeat game music
  startBackgroundMusic(volume: number = 0.5) {
    if (!this.audioContext || this.isPlaying) return
    
    this.volume = volume
    this.isPlaying = true

    const playMelody = () => {
      if (!this.audioContext || !this.isPlaying) return

      const now = this.audioContext.currentTime
      // Upbeat game melody
      const melody = [
        { freq: 330, time: 0, duration: 0.3 },
        { freq: 370, time: 0.3, duration: 0.3 },
        { freq: 415, time: 0.6, duration: 0.3 },
        { freq: 494, time: 0.9, duration: 0.3 },
        { freq: 554, time: 1.2, duration: 0.3 },
        { freq: 494, time: 1.5, duration: 0.3 },
        { freq: 415, time: 1.8, duration: 0.3 },
        { freq: 330, time: 2.1, duration: 0.3 },
      ]

      melody.forEach((note) => {
        this.playNote(note.freq, now + note.time, note.duration, 'triangle')
      })
    }

    playMelody()
    this.musicInterval = setInterval(playMelody, 2400)
  }

  stopBackgroundMusic() {
    this.isPlaying = false
    if (this.musicInterval) {
      clearInterval(this.musicInterval)
      this.musicInterval = null
    }
  }

  setVolume(volume: number) {
    this.volume = volume
  }

  // Play a single note
  playNote(freq: number, time: number, duration: number = 0.2, type: OscillatorType = 'sine') {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = freq
      oscillator.type = type

      gainNode.gain.setValueAtTime(0, time)
      gainNode.gain.linearRampToValueAtTime(0.15 * this.volume, time + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration)

      oscillator.start(time)
      oscillator.stop(time + duration)
    } catch (error) {
      // Audio not available
    }
  }

  // Sound effects
  playSound(type: 'coin' | 'success' | 'error' | 'powerup' | 'combo' | 'levelup') {
    if (!this.audioContext) return

    const sounds = {
      coin: { freq: 800, duration: 0.15, type: 'sine' as OscillatorType },
      success: { freq: 600, duration: 0.2, type: 'sine' as OscillatorType },
      error: { freq: 200, duration: 0.3, type: 'sawtooth' as OscillatorType },
      powerup: { freq: 1000, duration: 0.25, type: 'square' as OscillatorType },
      combo: { freq: 1200, duration: 0.3, type: 'triangle' as OscillatorType },
      levelup: { freq: 523, duration: 0.4, type: 'sine' as OscillatorType },
    }

    const sound = sounds[type]
    const now = this.audioContext.currentTime
    this.playNote(sound.freq, now, sound.duration, sound.type)
  }

  cleanup() {
    this.stopBackgroundMusic()
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}


