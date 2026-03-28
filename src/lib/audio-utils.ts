/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts a Float32Array of audio samples to a base64-encoded 16-bit PCM string.
 * Gemini Live API expects 16kHz, 16-bit, little-endian PCM.
 */
export function float32ToPcm16(samples: Float32Array): string {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/**
 * Converts a base64-encoded 16-bit PCM string to a Float32Array of audio samples.
 */
export function pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(buffer);
  const samples = new Float32Array(binary.length / 2);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return samples;
}

/**
 * Simple queue for scheduling audio playback to avoid gaps.
 */
export class AudioPlayer {
  private context: AudioContext;
  private nextStartTime: number = 0;

  constructor(sampleRate: number = 24000) {
    this.context = new AudioContext({ sampleRate });
  }

  async play(samples: Float32Array) {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    const buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
    buffer.getChannelData(0).set(samples);

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);

    const startTime = Math.max(this.context.currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;
  }

  stop() {
    this.nextStartTime = 0;
    if (this.context.state !== 'closed') {
      this.context.close();
    }
  }
}
