/** Encode mono samples as a 16-bit PCM WAV file. */
export function wav(samples: Float32Array, sampleRate = 44100): Uint8Array {
  const n = samples.length,
    b = new ArrayBuffer(44 + n * 2),
    pcm = new Int16Array(b, 44);
  // Typed arrays use the platform's byte order, which is little-endian everywhere JS runs, as WAV wants.
  // The 44-byte header as 32-bit words: "RIFF", size, "WAVE", "fmt ", 16, PCM + mono,
  // sample rate, byte rate, block align + 16 bits, "data", data size.
  new Uint32Array(b, 0, 11).set([0x46464952, 36 + n * 2, 0x45564157, 0x20746d66, 16, 0x10001, sampleRate, sampleRate * 2, 0x100002, 0x61746164, n * 2]);
  for (let i = 0; i < n; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
  return new Uint8Array(b);
}
