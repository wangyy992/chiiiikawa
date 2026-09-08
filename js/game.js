/*
 * 核心状态机：
 *   RUN —— 开启重力、允许跳跃、与地面/高台做严格碰撞
 *   FLY —— 关闭重力加速度、方向键二维自由移动、取消地面判定，改为全屏边界限制
 * 进入 FLY 的两种途径：
 *   1) 吃到吉他道具（flyReason='item'）：无敌 10 秒，撞碎障碍，倒计时结束落回地面
 *   2) 前方地面断开进入飞行区（flyReason='zone'）：由区块生成器驱动，飞出区块自动落地
 */
(function (g) {
  const C = g.CFG, U = g.U, Art = g.Art, Sfx = g.Sfx;

  class Game {
    constructor(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.world = new g.World();
      this.keys = new Set();
      this.pointer = { down: false, x: 0, y: 0 };
      this.onGameOver = () => {};
      this.best = Math.max(0, Number(g.Save.get('chii_best', 0)) || 0);
      this.phase = 'ready';           // ready | playing | paused | over
      this.reset();
    }

    reset() {
      this.world.reset();
      this.t = 0;
      this.camX = 0;
      this.distance = 0;
      this.coins = 0;
      this.combo = 0;
      this.bestCombo = 0;
      this.comboTimer = 0;
      this.certLevel = 0;
      this.keys.clear();
      this.pointer.down = false;
      this.speed = C.BASE_SPEED;
      this.shake = 0;
      this.flash = 0;
      this.banner = null;
      this.warnedSkyX = -1;
      this.particles = [];
      this.lead = C.LEAD_START;
      this.chaserY = C.GROUND_Y;
      this.p = {
        px: C.PLAYER_HOME_X,
        y: C.GROUND_Y,
        vy: 0,
        vx: 0,
        state: 'RUN',
        flyReason: null,
        flyTimer: 0,
        jumps: 0,
        onGround: true,
        coyote: 0,
        buffer: 0,
        invuln: 0,
        liftTo: null,
      };
    }

    start() {
      this.reset();
      this.phase = 'playing';
      Sfx.init(); Sfx.resume();
    }

    get worldX() { return this.camX + this.p.px; }
    get invincible() { return this.p.invuln > 0 || (this.p.state === 'FLY' && this.p.flyReason === 'item'); }

    /* ---------------- 输入 ---------------- */
    pressJump() {
      if (this.phase !== 'playing') return;
      this.p.buffer = C.JUMP_BUFFER;
    }
    releaseJump() {
      if (this.p.state === 'RUN' && this.p.vy < 0) this.p.vy *= C.JUMP_CUT;
    }
    flyInput() {
      const k = this.keys;
      let x = 0, y = 0;
      if (k.has('ArrowLeft') || k.has('KeyA')) x -= 1;
      if (k.has('ArrowRight') || k.has('KeyD')) x += 1;
      if (k.has('ArrowUp') || k.has('KeyW') || k.has('Space')) y -= 1;
      if (k.has('ArrowDown') || k.has('KeyS')) y += 1;
      if (!x && !y && this.pointer.down) {
        const dx = this.pointer.x - this.p.px;
        const dy = this.pointer.y - (this.p.y - C.PLAYER_H / 2);
        const d = Math.hypot(dx, dy);
        if (d > 14) { x = dx / d; y = dy / d; }
      }
      const len = Math.hypot(x, y) || 1;
      return { x: x / len, y: y / len, active: !!(x || y) };
    }

    /* ---------------- 主循环 ---------------- */
    update(dt) {
      if (this.phase !== 'playing') return;
      this.t += dt;

      this.speed = U.clamp(C.BASE_SPEED + this.distance * C.SPEED_PER_M, C.BASE_SPEED, C.MAX_SPEED);
      this.camX += this.speed * dt;
      this.distance = this.camX / 10;                      // 10px = 1m
      this.world.update(this.camX, this.distance);
      const level = Math.min(5, Math.floor(this.distance / C.CERT_STEP));
      if (level > this.certLevel) {
        this.certLevel = level;
        this.certBest = Math.max(this.certBest || 0, level);
        g.Save.set('chii_cert', this.certBest);
        this.banner = {text: '除草检定合格！获得' + ['','五级','四级','三级','二级','一级'][level] + '证书', life: 3};
        this.lead = Math.min(C.LEAD_MAX, this.lead + 50);
        this.spark(this.worldX, this.p.y - 45, '#f1c966', 32);
        Sfx.power();
      }

      this.updateStateMachine(dt);
      if (this.p.state === 'RUN') this.updateRun(dt); else this.updateFly(dt);
      this.updateHazards(dt);
      this.collect();
      this.hazardCheck();
      this.updateChaser(dt);
      this.updateFx(dt);

      if (this.p.y > C.H + 80) this.gameOver('fall');
      if (this.lead <= 0) this.gameOver('caught');
    }

    updateStateMachine(dt) {
      const p = this.p;
      const aheadType = this.world.typeAt(this.worldX + 60);
      const hereType = this.world.typeAt(this.worldX);
      const incoming = this.world.spanAt(this.worldX + 320);

      if (p.state === 'RUN' && incoming?.type === 'sky' && incoming.x0 !== this.warnedSkyX) {
        this.warnedSkyX = incoming.x0;
        this.banner = { text: '前方裂谷 · 准备控制飞行方向', life: 1.5 };
      }

      // 1) 道具计时
      if (p.state === 'FLY' && p.flyReason === 'item') {
        p.flyTimer -= dt;
        if (p.flyTimer <= 0) {
          if (hereType === 'sky') { p.flyReason = 'zone'; }
          else this.exitFly();
        }
      }
      // 2) 区域切换：地面断开 → 上升气流托起
      //    hereType 的判断是安全网：任何原因导致角色处在飞行区上空都会被接住，不会掉海里
      if (p.state === 'RUN' && (aheadType === 'sky' || hereType === 'sky')) this.enterFly('zone');
      // 3) 飞行区结束 → 落回地面
      if (p.state === 'FLY' && p.flyReason === 'zone' && hereType === 'ground') this.exitFly();
    }

    enterFly(reason, time = 0) {
      const p = this.p;
      const already = p.state === 'FLY';
      p.state = 'FLY';
      p.flyReason = reason;
      if (reason === 'item') p.flyTimer = time || C.ITEM_FLY_TIME;
      if (!already) {
        p.vy = -260;                 // 关闭重力，给一次上升冲量
        p.liftTo = 300;              // 托到舒适高度，避免贴着海面飞
        p.vx = 0;
      }
      this.banner = {
        text: reason === 'item' ? '🎸 应援模式！无敌 10 秒' : '☁️ 前方地面断裂 · 进入飞行区',
        life: 2.2,
      };
      this.flash = Math.max(this.flash, reason === 'item' ? 0.6 : 0.3);
    }

    exitFly() {
      const p = this.p;
      p.state = 'RUN';
      p.flyReason = null;
      p.flyTimer = 0;
      p.vy = Math.max(p.vy, 0);      // 重力重新接管
      p.vx = 0;
      p.jumps = C.MAX_JUMPS;         // 落地后才恢复跳跃次数
      p.liftTo = null;
      p.onGround = false;
      this.banner = { text: '⬇️ 落地！继续跑', life: 1.4 };
    }

    /* —— 地面状态：重力 + 严格地面碰撞 —— */
    updateRun(dt) {
      const p = this.p;
      // 落地后把屏幕位置拉回默认站位，但绝不把角色拉回断崖外侧
      const wantPx = U.damp(p.px, C.PLAYER_HOME_X, 6, dt);
      if (this.world.typeAt(this.camX + wantPx) === 'ground') p.px = wantPx;

      // 跳跃输入
      p.buffer -= dt;
      p.coyote -= dt;
      if (p.buffer > 0) {
        const canFirst = p.onGround || p.coyote > 0;
        if (canFirst) {
          p.vy = C.JUMP_V; p.jumps = 1; p.onGround = false; p.coyote = 0;
          p.buffer = 0; Sfx.jump();
          this.puff(this.worldX, p.y);
        } else if (p.jumps < C.MAX_JUMPS) {
          p.vy = C.JUMP_V * (this.character === 'usagi' ? 1.03 : 0.88); p.jumps++;
          p.buffer = 0; Sfx.jump();
          this.puff(this.worldX, p.y, '#cfe8ff');
        }
      }

      // 重力积分
      p.vy = Math.min(p.vy + C.GRAVITY * dt, C.MAX_FALL);
      const prevY = p.y;
      let newY = p.y + p.vy * dt;

      // 地面 / 高台碰撞：只在下落时判定，允许从下方穿过高台
      const surfaces = this.world.surfacesAt(this.worldX, 12);
      let landed = false;
      if (p.vy >= 0) {
        for (const sy of surfaces) {
          if (prevY <= sy + 0.5 && newY >= sy) { newY = sy; landed = true; break; }
        }
      }
      p.y = newY;

      if (landed) {
        if (!p.onGround) this.puff(this.worldX, p.y);
        p.vy = 0; p.onGround = true; p.jumps = 0; p.coyote = C.COYOTE;
      } else {
        // 脚下是否还有支撑（跑出高台边缘 / 地面断开）
        const support = this.world.surfacesAt(this.worldX, 12);
        const still = support.some((sy) => Math.abs(p.y - sy) < 3);
        if (p.onGround && !still) { p.onGround = false; p.coyote = C.COYOTE; }
      }
    }

    /* —— 飞行状态：无重力，二维自由移动 + 全屏边界 —— */
    updateFly(dt) {
      const p = this.p;
      const inp = this.flyInput();
      // 入场上升气流：托到舒适高度，玩家一操作就交还控制权
      if (p.liftTo !== null) {
        if (inp.active || p.y <= p.liftTo) p.liftTo = null;
        else p.vy = U.damp(p.vy, -330, 5, dt);
      }
      if (inp.active) {
        p.vx += inp.x * C.FLY_ACCEL * dt;
        p.vy += inp.y * C.FLY_ACCEL * dt;
      } else {
        p.vx = U.damp(p.vx, 0, C.FLY_DRAG, dt);
        p.vy = U.damp(p.vy, Math.sin(this.t * 2.4) * C.FLY_BOB, C.FLY_DRAG, dt);
      }
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > C.FLY_MAX_V) { p.vx = (p.vx / sp) * C.FLY_MAX_V; p.vy = (p.vy / sp) * C.FLY_MAX_V; }

      p.px += p.vx * dt;
      p.y += p.vy * dt;

      // 取消地面判定，改为全屏边界限制
      if (p.px < C.FLY_MIN_X) { p.px = C.FLY_MIN_X; p.vx = 0; }
      if (p.px > C.FLY_MAX_X) { p.px = C.FLY_MAX_X; p.vx = 0; }
      if (p.y < C.FLY_MIN_Y) { p.y = C.FLY_MIN_Y; p.vy = 0; }
      if (p.y > C.FLY_MAX_Y) { p.y = C.FLY_MAX_Y; p.vy = 0; }
    }

    /* ---------------- 实体与碰撞 ---------------- */
    playerRect() {
      return {
        x: this.worldX - 14, y: this.p.y - C.PLAYER_H + 6,
        w: 28, h: C.PLAYER_H - 8,
      };
    }

    updateHazards(dt) {
      for (const h of this.world.hazards) {
        if (h.kind === 'mob' && h.hop) {
          h.y = h.baseY - Math.abs(Math.sin(this.t * 3 + h.phase)) * 46;
        } else if (h.kind === 'flyer') {
          h.y = h.baseY + Math.sin(this.t * h.speed + h.phase) * h.amp;
        }
      }
    }

    collect() {
      const pr = this.playerRect();
      const coinRect = this.character === 'hachiware'
        ? { x: pr.x - 24, y: pr.y - 22, w: pr.w + 48, h: pr.h + 44 }
        : pr;
      for (const c of this.world.coins) {
        if (c.dead) continue;
        if (U.aabb(coinRect, { x: c.x - 11, y: c.y - 11, w: 22, h: 22 })) {
          c.dead = true;
          this.coins++;
          this.combo++;
          this.bestCombo = Math.max(this.bestCombo, this.combo);
          this.comboTimer = 2.1;
          if (this.combo % 5 === 0) {
            this.coins++;
            this.lead = Math.min(C.LEAD_MAX, this.lead + 12);
            this.banner = { text: this.combo + ' 连续报酬 · 额外金币！', life: 1.2 };
            this.spark(c.x, c.y, '#fff2a8', 12);
          }
          Sfx.coin();
          this.spark(c.x, c.y, '#ffd34d', 5);
        }
      }
      for (const pu of this.world.powerups) {
        if (pu.dead) continue;
        if (U.aabb(pr, { x: pu.x - 18, y: pu.y - 22, w: 36, h: 44 })) {
          pu.dead = true;
          Sfx.power();
          this.spark(pu.x, pu.y, '#ffec96', 16);
          this.enterFly('item');
        }
      }
    }

    hazardCheck() {
      const pr = this.playerRect();
      for (const h of this.world.hazards) {
        if (h.dead) continue;
        const box = { x: h.x + 4, y: h.y + 4, w: h.w - 8, h: h.h - 8 };
        if (!U.aabb(pr, box)) continue;

        if (this.p.state === 'FLY' && this.p.flyReason === 'item') {
          h.dead = true;                       // 无敌撞碎障碍，换成工资
          this.coins += 2;
          this.shake = Math.max(this.shake, 8);
          this.spark(h.x + h.w / 2, h.y + h.h / 2, '#ffd9a0', 14);
          Sfx.smash();
        } else if (this.p.invuln <= 0) {
          this.hurt();
        }
      }
    }

    hurt() {
      const p = this.p;
      p.invuln = C.HIT_INVULN;
      this.lead -= C.LEAD_HIT * (this.character === 'chiikawa' ? 0.72 : 1);
      this.combo = 0;
      this.comboTimer = 0;
      this.shake = 14;
      this.flash = 0.5;
      Sfx.hit();
      this.spark(this.worldX, p.y - 20, '#ff8fa3', 12);
      if (p.state === 'RUN') p.vy = Math.min(p.vy, -260);
      else { p.vx -= 120; p.vy -= 60; }
      this.banner = { text: '撞到了！讨伐怪逼近', life: 1.1 };
    }

    updateChaser(dt) {
      const p = this.p;
      if (p.invuln > 0) p.invuln -= dt;
      this.lead = U.clamp(this.lead + C.LEAD_REGEN * dt, -1, C.LEAD_MAX);
      const target = this.world.typeAt(this.worldX - this.lead) === 'sky'
        ? U.clamp(p.y, 120, C.FLY_MAX_Y) : C.GROUND_Y;
      this.chaserY = U.damp(this.chaserY, target, 4, dt);
    }

    updateFx(dt) {
      this.shake = Math.max(0, this.shake - dt * 40);
      this.flash = Math.max(0, this.flash - dt * 1.8);
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) this.combo = 0;
      }
      if (this.banner) { this.banner.life -= dt; if (this.banner.life <= 0) this.banner = null; }
      for (const q of this.particles) {
        q.life -= dt;
        q.vy += 900 * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
      }
      this.particles = this.particles.filter((q) => q.life > 0);
    }

    spark(x, y, color, n) {
      for (let i = 0; i < n; i++) {
        this.particles.push({
          x, y, color,
          vx: U.rand(-160, 160), vy: U.rand(-260, 60),
          life: U.rand(0.25, 0.6), r: U.rand(2, 4.5),
        });
      }
    }
    puff(x, y) {
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: x + U.rand(-8, 8), y, color: 'rgba(255,255,255,.9)',
          vx: U.rand(-90, -20), vy: U.rand(-90, -20),
          life: U.rand(0.2, 0.4), r: U.rand(2, 5),
        });
      }
    }

    gameOver(reason) {
      if (this.phase === 'over') return;
      this.phase = 'over';
      Sfx.dead();
      const d = Math.floor(this.distance);
      if (d > this.best) { this.best = d; g.Save.set('chii_best', d); }
      this.onGameOver({
        reason, distance: d, coins: this.coins, best: this.best,
        cert: Math.floor(this.distance / C.CERT_STEP),
      });
    }
  }

  g.Game = Game;
})(window);
