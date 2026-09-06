(function (g) {
  const U = {
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    chance: (p) => Math.random() < p,
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    // 让 lerp 在不同帧率下表现一致
    damp: (a, b, lambda, dt) => U.lerp(a, b, 1 - Math.exp(-lambda * dt)),
    aabb(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },
    roundRect(ctx, x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    },
    ellipse(ctx, x, y, rx, ry) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.closePath();
    },
  };

  /* 极简 WebAudio 音效：不加载任何资源文件 */
  const Sfx = {
    ctx: null,
    muted: false,
    init() {
      if (this.ctx) return;
      const AC = g.AudioContext || g.webkitAudioContext;
      if (AC) this.ctx = new AC();
    },
    resume() {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    blip(freq, dur, type = 'square', vol = 0.06, slide = 0) {
      if (this.muted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
    jump() { this.blip(520, 0.14, 'square', 0.05, 260); },
    coin() { this.blip(880, 0.09, 'triangle', 0.05, 420); },
    power() { this.blip(320, 0.4, 'sawtooth', 0.05, 700); },
    hit() { this.blip(180, 0.24, 'square', 0.07, -120); },
    smash() { this.blip(640, 0.12, 'sawtooth', 0.05, -380); },
    dead() { this.blip(300, 0.7, 'square', 0.07, -240); },
  };

  g.U = U;
  g.Sfx = Sfx;
})(window);
