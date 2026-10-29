// The microphone's samples for a take (judge.js), captured in the app's own audio context, so each sample's time is on
// the same clock as the click and the notes the player schedules: `frame` is the context's frame of the block's first
// sample. Batches of 2048 frames go to the page.
class Recorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(2048);
    this.n = 0;
    this.start = 0;
  }
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        if (this.n === 0) this.start = currentFrame + i;
        this.buf[this.n++] = ch[i];
        if (this.n === this.buf.length) {
          this.port.postMessage({ frame: this.start, data: this.buf });
          this.buf = new Float32Array(2048);
          this.n = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('bc-recorder', Recorder);
