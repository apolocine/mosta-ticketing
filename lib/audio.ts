// @mostajs/ticketing — Audio feedback utilities (from @mostajs/scan)
// Author: Dr Hamid MADANI drmdh@msn.com

/**
 * Play a beep sound at the given frequency and duration.
 * Silently fails if AudioContext is unavailable (e.g., SSR).
 */
export function playBeep(frequency: number, duration: number): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency
    osc.connect(ctx.destination)
    osc.start()
    setTimeout(() => { osc.stop(); ctx.close() }, duration)
  } catch {
    // AudioContext not available (SSR, permissions, etc.)
  }
}

/** Play a success beep (high pitch, short) */
export function playGranted(freq = 800): void {
  playBeep(freq, 200)
}

/** Play a denied beep (low pitch, longer) */
export function playDenied(freq = 300): void {
  playBeep(freq, 400)
}
