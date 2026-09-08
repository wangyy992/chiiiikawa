/* Ground and ravine generator. All visible artwork remains raster based. */
(function (g) {
  const C = g.CFG, U = g.U;
  class World {
    constructor() { this.reset(); }
    reset() {
      this.spans = []; this.solids = []; this.hazards = [];
      this.coins = []; this.powerups = []; this.decor = [];
      this.genX = 0; this.section = 0; this.lastPowerupX = -1e9;
      this.pushGround(2200, true);
    }
    spanAt(x) { return this.spans.find((s) => x >= s.x0 && x < s.x1) || null; }
    typeAt(x) { return this.spanAt(x)?.type || 'ground'; }
    surfacesAt(x, halfWidth = 12) {
      const out = [];
      if (this.typeAt(x) === 'ground') out.push(C.GROUND_Y);
      for (const p of this.solids) {
        if (x + halfWidth >= p.x && x - halfWidth <= p.x + p.w) out.push(p.y);
      }
      return out.sort((a, b) => a - b);
    }
    update(cameraX, distance) {
      while (this.genX < cameraX + C.SPAWN_AHEAD) this.generateNext(distance);
      const cull = cameraX - 360;
      this.spans = this.spans.filter((s) => s.x1 > cull);
      const alive = (e) => !e.dead && e.x + (e.w || 40) > cull;
      for (const key of ['solids', 'hazards', 'coins', 'powerups']) this[key] = this[key].filter(alive);
    }
    generateNext(distance) {
      this.section += 1;
      // 第一段裂谷较早出现，之后固定留出三段地面恢复节奏。
      if (this.section % 4 === 2) this.pushSky(U.rand(1050, 1450));
      else this.pushGround(U.rand(1800, 2350), false, distance);
    }
    pushGround(length, warmup = false, distance = 0) {
      const span = { type: 'ground', x0: this.genX, x1: this.genX + length };
      this.spans.push(span); this.genX = span.x1;
      const G = C.GROUND_Y;
      let x = span.x0 + (warmup ? 900 : C.LANDING_RUNWAY);
      const end = span.x1 - 260;
      let pattern = this.section;
      if (warmup) this.coinLine(410, G - 80, 5, 42);
      while (x < end) {
        const type = pattern++ % 5;
        if (type === 2) {
          const w = 190;
          this.solids.push({ kind: 'platform', x, y: G - 112, w, h: 45 });
          this.coinLine(x + 28, G - 158, 4, 42);
        } else {
          const kind = type === 3 ? 'mob' : type === 1 ? 'rock' : 'bush';
          const w = kind === 'mob' ? 76 : kind === 'rock' ? 68 : 62;
          const h = kind === 'mob' ? 68 : kind === 'rock' ? 74 : 55;
          this.hazards.push({ kind, x, y: G - h, w, h, baseY: G - h, phase: U.rand(0, 6.2), hop: false });
          this.coinArc(x + w / 2, G - h - 55, 4, 30);
        }
        const powerupX = x + 235;
        if (type === 4 && powerupX - this.lastPowerupX >= 6500 && U.chance(.35)) {
          this.powerups.push({ kind: 'guitar', x: powerupX, y: G - 108, w: 34, h: 44 });
          this.lastPowerupX = powerupX;
        }
        x += U.rand(470, 590) + Math.min(distance * .012, 60);
      }
    }
    pushSky(length) {
      const span = { type: 'sky', x0: this.genX, x1: this.genX + length };
      this.spans.push(span); this.genX = span.x1;
      let x = span.x0 + 330, index = 0;
      while (x < span.x1 - 260) {
        const y = index++ % 2 ? 160 : 315;
        this.hazards.push({ kind: 'flyer', x, y, w: 68, h: 62, baseY: y, amp: 45, phase: U.rand(0, 6.2), speed: U.rand(1.2, 1.8) });
        this.coinLine(x - 125, y + (index % 2 ? 105 : -55), 5, 42);
        x += U.rand(360, 450);
      }
    }
    coinLine(x, y, n, step) {
      for (let i = 0; i < n; i++) this.coins.push({ x: x + i * step, y, w: 24, h: 24, phase: i * .4 });
    }
    coinArc(cx, cy, n, step) {
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1) - .5;
        this.coins.push({ x: cx + t * step * n, y: cy + t * t * 70, w: 24, h: 24, phase: i * .4 });
      }
    }
  }
  g.World = World;
})(window);
