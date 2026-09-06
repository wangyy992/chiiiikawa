/*
 * 关卡生成器：两个独立的区块池
 *   GROUND 池 —— 地面跑酷（灌木 / 岩石 / 高台 / 站桩讨伐怪）
 *   SKY    池 —— 飞行区（上下交错的浮空岩柱 / 巡逻飞怪 / 波浪硬币带）
 * 地面区结束时地面直接断开，生成器无缝切到 SKY 池；玩家会被“上升气流”托起进入 FLY 状态。
 */
(function (g) {
  const C = g.CFG;
  const U = g.U;

  class World {
    constructor() { this.reset(); }

    reset() {
      this.spans = [];      // [{type:'ground'|'sky', x0, x1}]
      this.solids = [];     // 可站立平台
      this.hazards = [];    // 撞到会受伤的障碍
      this.coins = [];
      this.powerups = [];
      this.decor = [];      // 纯装饰（棕榈树等）
      this.genX = 0;
      this.lastWasSky = false;
      // 开局给一段无障碍的热身跑道
      this.pushSpan('ground', 1500, { warmup: true });
    }

    /* ---------- 查询 ---------- */
    spanAt(x) {
      for (const s of this.spans) if (x >= s.x0 && x < s.x1) return s;
      return null;
    }
    typeAt(x) {
      const s = this.spanAt(x);
      return s ? s.type : 'ground';
    }
    /* 返回 x 处所有可站立表面的顶部 y（地面 + 高台），由高到低排序 */
    surfacesAt(x) {
      const out = [];
      if (this.typeAt(x) === 'ground') out.push(C.GROUND_Y);
      for (const p of this.solids) {
        if (x >= p.x && x <= p.x + p.w) out.push(p.y);
      }
      out.sort((a, b) => a - b);
      return out;
    }

    /* ---------- 生成 ---------- */
    update(cameraX, distance) {
      while (this.genX < cameraX + C.SPAWN_AHEAD) this.generateNext(distance);
      const cull = cameraX - 300;
      this.spans = this.spans.filter((s) => s.x1 > cull);
      const alive = (e) => e.x + (e.w || 40) > cull && !e.dead;
      this.solids = this.solids.filter(alive);
      this.hazards = this.hazards.filter(alive);
      this.coins = this.coins.filter(alive);
      this.powerups = this.powerups.filter(alive);
      this.decor = this.decor.filter((d) => d.x > cull - 200);
    }

    generateNext(distance) {
      const skyChance = U.clamp(
        C.SKY_CHANCE_START + distance / 9000, C.SKY_CHANCE_START, C.SKY_CHANCE_MAX);
      if (!this.lastWasSky && U.chance(skyChance)) {
        this.pushSpan('sky', U.randInt(...C.SKY_REGION));
      } else {
        this.pushSpan('ground', U.randInt(...C.GROUND_REGION));
      }
    }

    pushSpan(type, len, opts = {}) {
      const x0 = this.genX;
      const x1 = x0 + len;
      const span = { type, x0, x1 };
      this.spans.push(span);
      this.genX = x1;
      this.lastWasSky = type === 'sky';
      if (type === 'ground') this.fillGround(span, opts);
      else this.fillSky(span);
    }

    /* —— 地面区块池 —— */
    fillGround(span, opts) {
      const G = C.GROUND_Y;
      // 飞行区落地后的安全跑道
      let x = span.x0 + (opts.warmup ? 900 : C.LANDING_RUNWAY);
      const end = span.x1 - 260;

      const palms = Math.round((span.x1 - span.x0) / 420);
      for (let i = 0; i < palms; i++) {
        this.decor.push({
          kind: 'palm',
          x: span.x0 + U.rand(0, span.x1 - span.x0),
          s: U.rand(0.5, 0.95),
        });
      }

      while (x < end) {
        const pattern = U.pick(['bush', 'bush', 'rock', 'platform', 'mob', 'coinArc', 'double']);
        switch (pattern) {
          case 'bush': {
            const w = U.rand(40, 62), h = U.rand(38, 52);
            this.hazards.push({ kind: 'bush', x, y: G - h, w, h });
            this.coinArc(x + w / 2, G - h - 60, 3, 30);
            x += w + U.rand(230, 340);
            break;
          }
          case 'double': {
            const w = 44;
            this.hazards.push({ kind: 'bush', x, y: G - 42, w, h: 42 });
            this.hazards.push({ kind: 'bush', x: x + w + 78, y: G - 42, w, h: 42 });
            this.coinArc(x + w + 39, G - 130, 5, 26);
            x += w * 2 + 78 + U.rand(280, 380);
            break;
          }
          case 'rock': {
            const w = U.rand(50, 70), h = U.rand(58, 84);
            this.hazards.push({ kind: 'rock', x, y: G - h, w, h });
            x += w + U.rand(260, 380);
            break;
          }
          case 'platform': {
            const w = U.rand(140, 230), h = 20;
            const y = G - U.rand(110, 150);
            this.solids.push({ kind: 'platform', x, y, w, h });
            this.coinLine(x + 24, y - 44, Math.floor(w / 40), 40);
            if (U.chance(0.45)) {
              this.hazards.push({ kind: 'bush', x: x + w * 0.35, y: G - 40, w: 42, h: 40 });
            }
            x += w + U.rand(240, 340);
            break;
          }
          case 'mob': {
            this.hazards.push({
              kind: 'mob', x, y: G - 46, w: 40, h: 46,
              baseY: G - 46, phase: U.rand(0, 6.3), hop: U.rand(0, 1) > 0.5,
            });
            this.coinArc(x + 20, G - 110, 3, 30);
            x += 40 + U.rand(280, 400);
            break;
          }
          default: {
            this.coinArc(x + 60, G - 120, 6, 34);
            x += 320;
          }
        }
      }

      // 吉他道具：只在地面区出现，吃到后腾空 10 秒
      if (!opts.warmup && U.chance(0.55)) {
        this.powerups.push({
          kind: 'guitar', x: span.x0 + U.rand(600, Math.max(700, span.x1 - span.x0 - 500)),
          y: G - U.rand(90, 150), w: 34, h: 44,
        });
      }
    }

    /* —— 飞行区块池：上下交错的浮空障碍 —— */
    fillSky(span) {
      let x = span.x0 + 380;                 // 入口留白，给玩家反应时间
      const end = span.x1 - 320;
      let fromTop = U.chance(0.5);

      while (x < end) {
        const style = U.pick(['gate', 'gate', 'stagger', 'flyer', 'wave']);
        if (style === 'gate') {
          // 上下各一根，中间留缝
          const gap = U.rand(150, 200);
          const gapY = U.rand(C.FLY_MIN_Y + 90, C.FLY_MAX_Y - 90 - gap);
          this.hazards.push({ kind: 'pillar', from: 'top', x, y: 0, w: 46, h: gapY });
          this.hazards.push({
            kind: 'pillar', from: 'bottom', x, y: gapY + gap, w: 46,
            h: C.H - (gapY + gap),
          });
          this.coinLine(x + 23, gapY + gap / 2, 1, 0);
          x += 46 + U.rand(300, 400);
        } else if (style === 'stagger') {
          for (let i = 0; i < 3; i++) {
            const h = U.rand(150, 230);
            const top = fromTop;
            this.hazards.push({
              kind: 'pillar', from: top ? 'top' : 'bottom', x, w: 44, h,
              y: top ? 0 : C.H - h,
            });
            this.coinArc(x + 22, top ? h + 70 : C.H - h - 70, 2, 28);
            fromTop = !fromTop;
            x += 44 + U.rand(170, 230);
          }
          x += U.rand(120, 200);
        } else if (style === 'flyer') {
          this.hazards.push({
            kind: 'flyer', x, y: U.rand(140, 380), w: 40, h: 44,
            baseY: 0, amp: U.rand(50, 110), phase: U.rand(0, 6.3), speed: U.rand(1.2, 2.2),
          });
          this.hazards[this.hazards.length - 1].baseY = this.hazards[this.hazards.length - 1].y;
          x += 40 + U.rand(300, 420);
        } else {
          // 波浪硬币带
          const n = U.randInt(6, 10);
          const y0 = U.rand(160, 340);
          for (let i = 0; i < n; i++) {
            this.coins.push({
              x: x + i * 40, y: y0 + Math.sin(i * 0.8) * 70,
              w: C.COIN, h: C.COIN, phase: i * 0.4,
            });
          }
          x += n * 40 + U.rand(180, 260);
        }
      }
    }

    coinArc(cx, cy, n, step) {
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1) - 0.5;
        this.coins.push({
          x: cx + t * step * n, y: cy + t * t * 120 - 20,
          w: C.COIN, h: C.COIN, phase: i * 0.4,
        });
      }
    }
    coinLine(x, y, n, step) {
      for (let i = 0; i < n; i++) {
        this.coins.push({ x: x + i * step, y, w: C.COIN, h: C.COIN, phase: i * 0.4 });
      }
    }
  }

  g.World = World;
})(window);
