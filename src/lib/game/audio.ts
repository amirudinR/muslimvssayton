/* ============================================================
 * PENJAGA MASJID — Audio ceria via Web Audio API (sintetis).
 * Semua SFX & BGM dibangkitkan secara prosedural, tanpa file.
 * ============================================================ */

type Ctx = AudioContext

class GameAudio {
  private ctx: Ctx | null = null
  private master: GainNode | null = null
  private sfxBus: GainNode | null = null
  private musicBus: GainNode | null = null
  private bgmTimer: ReturnType<typeof setInterval> | null = null
  private bgmStep = 0
  private nextNoteTime = 0
  private chirpTimer: ReturnType<typeof setInterval> | null = null

  soundOn = true
  musicOn = true

  /** Harus dipanggil dari gesture pengguna (klik tombol Mulai). */
  ensure(): boolean {
    if (typeof window === 'undefined') return false
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return false
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.6
      this.master.connect(this.ctx.destination)
      this.sfxBus = this.ctx.createGain()
      this.sfxBus.gain.value = 0.5
      this.sfxBus.connect(this.master)
      this.musicBus = this.ctx.createGain()
      this.musicBus.gain.value = 0.16
      this.musicBus.connect(this.master)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return true
  }

  private get t() {
    return this.ctx ? this.ctx.currentTime : 0
  }

  private osc(
    type: OscillatorType,
    freq: number,
    start: number,
    dur: number,
    vol: number,
    dest?: AudioNode,
    slideTo?: number,
  ) {
    if (!this.ctx || !this.sfxBus) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(Math.max(20, freq), start)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + dur)
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(vol, start + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    o.connect(g)
    g.connect(dest ?? this.sfxBus)
    o.start(start)
    o.stop(start + dur + 0.05)
  }

  private noise(start: number, dur: number, vol: number, freq: number, dest?: AudioNode) {
    if (!this.ctx || !this.sfxBus) return
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur))
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = freq
    f.Q.value = 0.8
    const g = this.ctx.createGain()
    g.gain.value = vol
    src.connect(f)
    f.connect(g)
    g.connect(dest ?? this.sfxBus)
    src.start(start)
  }

  private sfx(fn: () => void) {
    if (!this.soundOn || !this.ensure()) return
    fn()
  }

  /* --------------------------- SFX lucu --------------------------- */

  pop() {
    this.sfx(() => this.osc('sine', 880, this.t, 0.12, 0.3, undefined, 320))
  }

  place() {
    this.sfx(() => {
      const t = this.t
      this.osc('sine', 420, t, 0.14, 0.28, undefined, 640)
      this.osc('triangle', 620, t + 0.08, 0.18, 0.22, undefined, 940)
    })
  }

  coin() {
    this.sfx(() => {
      const t = this.t
      this.osc('square', 1046, t, 0.09, 0.12)
      this.osc('square', 1568, t + 0.07, 0.16, 0.12)
    })
  }

  swoosh() {
    this.sfx(() => this.noise(this.t, 0.22, 0.18, 2400))
  }

  boing() {
    this.sfx(() => {
      const t = this.t
      this.osc('sine', 300, t, 0.16, 0.3, undefined, 700)
      this.osc('sine', 700, t + 0.1, 0.14, 0.2, undefined, 320)
    })
  }

  hit() {
    this.sfx(() => this.osc('triangle', 260, this.t, 0.09, 0.22, undefined, 120))
  }

  bubble() {
    this.sfx(() => {
      const t = this.t
      this.osc('sine', 380, t, 0.1, 0.24, undefined, 900)
      this.osc('sine', 500, t + 0.06, 0.1, 0.18, undefined, 1100)
    })
  }

  giggle() {
    this.sfx(() => {
      const t = this.t
      for (let i = 0; i < 4; i++) {
        this.osc('sine', 700 + i * 60, t + i * 0.09, 0.07, 0.16, undefined, 500)
      }
    })
  }

  tada() {
    this.sfx(() => {
      const t = this.t
      const notes = [523, 659, 784, 1046]
      notes.forEach((n, i) => this.osc('triangle', n, t + i * 0.09, 0.35, 0.2))
      this.osc('triangle', 1318, t + 0.36, 0.5, 0.18)
    })
  }

  upgrade() {
    this.sfx(() => {
      const t = this.t
      // lonceng lembut
      this.osc('sine', 880, t, 0.8, 0.22)
      this.osc('sine', 1320, t, 0.6, 0.1)
      this.osc('sine', 2217, t, 0.4, 0.05)
    })
  }

  mosqueHit() {
    this.sfx(() => {
      const t = this.t
      this.osc('sine', 520, t, 0.4, 0.3, undefined, 180)
      this.osc('triangle', 260, t + 0.05, 0.35, 0.2, undefined, 120)
    })
  }

  steal() {
    this.sfx(() => {
      const t = this.t
      this.osc('square', 1200, t, 0.08, 0.1)
      this.osc('square', 800, t + 0.09, 0.08, 0.1)
      this.osc('square', 500, t + 0.18, 0.12, 0.1)
    })
  }

  bossNgambek() {
    this.sfx(() => {
      const t = this.t
      // "brrr" rendah lucu
      this.osc('sawtooth', 130, t, 0.5, 0.14, undefined, 90)
      this.noise(t + 0.1, 0.3, 0.1, 400)
    })
  }

  adzanChime() {
    this.sfx(() => {
      const t = this.t
      const notes = [659, 587, 523, 587, 659, 784]
      notes.forEach((n, i) => this.osc('sine', n, t + i * 0.22, 0.5, 0.14))
    })
  }

  cheer() {
    this.sfx(() => {
      const t = this.t
      this.noise(t, 0.5, 0.12, 1800)
      const notes = [523, 659, 784, 1046, 1318]
      notes.forEach((n, i) => this.osc('triangle', n, t + i * 0.08, 0.4, 0.18))
    })
  }

  firework() {
    this.sfx(() => {
      const t = this.t
      this.noise(t, 0.4, 0.2, 900, undefined)
      this.osc('sine', 600, t, 0.4, 0.12, undefined, 80)
    })
  }

  chime() {
    this.sfx(() => this.osc('sine', 1046, this.t, 0.4, 0.14))
  }

  /* ------------------------------ BGM ------------------------------ */

  startBgm() {
    if (!this.musicOn || !this.ensure() || this.bgmTimer) return
    this.nextNoteTime = this.t + 0.1
    this.bgmStep = 0
    this.bgmTimer = setInterval(() => this.scheduleBgm(), 200)
    this.startChirps()
  }

  stopBgm() {
    if (this.bgmTimer) clearInterval(this.bgmTimer)
    this.bgmTimer = null
    if (this.chirpTimer) clearInterval(this.chirpTimer)
    this.chirpTimer = null
  }

  /** Melodi pentatonik ceria ala marimba (C-D-E-G-A), loop 32 langkah. */
  private scheduleBgm() {
    if (!this.ctx || !this.musicBus) return
    const stepDur = 0.28 // ~107 BPM langkah 16th-ish
    while (this.nextNoteTime < this.t + 0.6) {
      if (this.musicOn && this.ctx.state === 'running') {
        this.playBgmNote(this.bgmStep, this.nextNoteTime)
      }
      this.bgmStep = (this.bgmStep + 1) % 32
      this.nextNoteTime += stepDur
    }
  }

  private playBgmNote(step: number, when: number) {
    if (!this.ctx || !this.musicBus) return
    // Pola melodi lembut & ceria
    const scale = [262, 294, 330, 392, 440, 523, 587, 659] // C pentatonik + oktaf
    const melody = [
      4, -1, 5, -1, 6, -1, 4, -1, 3, -1, 4, -1, 5, -1, -1, -1,
      6, -1, 7, -1, 5, -1, 6, -1, 4, -1, 3, -1, 2, -1, -1, -1,
    ]
    const mi = melody[step]
    if (mi >= 0) {
      const freq = scale[mi]
      // marimba lembut
      this.marimba(freq, when, 0.5)
      if (step % 8 === 0) this.marimba(freq / 2, when, 0.7) // bass lembut
    }
    if (step % 4 === 2) this.noise(when, 0.06, 0.05, 6000, this.musicBus) // shaker halus
  }

  private marimba(freq: number, when: number, vol: number) {
    if (!this.ctx || !this.musicBus) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = 'triangle'
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(vol, when + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5)
    o.connect(g)
    g.connect(this.musicBus)
    o.start(when)
    o.stop(when + 0.6)
  }

  /** Burung berkicau sesekali (ambience ceria). */
  private startChirps() {
    if (this.chirpTimer) return
    this.chirpTimer = setInterval(() => {
      if (!this.soundOn || !this.ctx || this.ctx.state !== 'running') return
      if (Math.random() < 0.4) {
        const t = this.t
        this.osc('sine', 2600 + Math.random() * 800, t, 0.06, 0.05)
        this.osc('sine', 3200 + Math.random() * 600, t + 0.09, 0.05, 0.04)
      }
    }, 4000)
  }

  setSound(on: boolean) {
    this.soundOn = on
  }

  setMusic(on: boolean) {
    this.musicOn = on
    if (!on) this.stopBgm()
  }
}

export const audio = new GameAudio()
