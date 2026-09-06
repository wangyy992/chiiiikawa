/* 渲染层：给 Game 挂上 render()，把逻辑与画面分开 */
(function (g) {
  const C = g.CFG, U = g.U, Art = g.Art;
  const G = g.Game.prototype;

  G.render = function () {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, C.W, C.H);

    if (this.shake > 0.2) {
      ctx.translate(U.rand(-this.shake, this.shake) * 0.5, U.rand(-this.shake, this.shake) * 0.5);
    }

    this.drawSky(ctx);
    this.drawSea(ctx);
    this.drawTerrain(ctx);
    this.drawEntities(ctx);
    this.drawActors(ctx);
    this.drawParticles(ctx);
    ctx.restore();

    this.drawHud(ctx);
    if (this.flash > 0.01) {
      ctx.save();
      ctx.globalAlpha = this.flash * 0.5;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, C.W, C.H);
      ctx.restore();
    }
    if (this.phase === 'paused') {
      ctx.save();
      ctx.fillStyle = 'rgba(20,24,30,.55)';
      ctx.fillRect(0, 0, C.W, C.H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 46px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('暂停中（按 P 继续）', C.W / 2, C.H / 2);
      ctx.restore();
    }
  };

  G.drawSky = function (ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, C.H);
    sky.addColorStop(0, '#67c8f5');
    sky.addColorStop(0.55, '#b9ebff');
    sky.addColorStop(1, '#ffeecb');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, C.W, C.H);

    // 太阳
    ctx.save();
    const sx = 800, sy = 96;
    const gr = ctx.createRadialGradient(sx, sy, 10, sx, sy, 120);
    gr.addColorStop(0, 'rgba(255,246,190,.95)');
    gr.addColorStop(1, 'rgba(255,246,190,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(sx, sy, 120, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff6c0';
    ctx.beginPath(); ctx.arc(sx, sy, 40, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // 远景云（视差 0.3）
    const off = this.camX * 0.3;
    for (let i = -1; i < 5; i++) {
      const base = Math.floor(off / 520) + i;
      const x = base * 520 + ((base * 137) % 260) - off;
      const y = 70 + ((base * 71) % 130);
      Art.drawCloud(ctx, x, y, 0.7 + ((base * 31) % 40) / 100, 0.85);
    }
    // 远山（视差 0.45）
    const hoff = this.camX * 0.45;
    ctx.save();
    ctx.fillStyle = 'rgba(126,196,160,.55)';
    ctx.beginPath();
    ctx.moveTo(0, C.H);
    for (let x = 0; x <= C.W; x += 20) {
      const wx = x + hoff;
      const y = 372 - Math.sin(wx / 420) * 46 - Math.sin(wx / 130) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(C.W, C.H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  G.drawSea = function (ctx) {
    const top = C.GROUND_Y - 2;                 // 海面只在地面断开处露出来
    const sea = ctx.createLinearGradient(0, top, 0, C.H);
    sea.addColorStop(0, '#5cc0ec');
    sea.addColorStop(1, '#1c74b0');
    ctx.fillStyle = sea;
    ctx.fillRect(0, top, C.W, C.H - top);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.lineWidth = 3;
    for (let r = 0; r < 4; r++) {
      const y = C.GROUND_Y + 16 + r * 22;
      ctx.beginPath();
      for (let x = 0; x <= C.W; x += 12) {
        const wy = y + Math.sin((x + this.camX * (0.4 + r * 0.1)) / 42 + r) * 3.4;
        x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  G.drawTerrain = function (ctx) {
    const w = this.world;
    // 棕榈树（长在地面区块上）
    for (const d of w.decor) {
      const x = d.x - this.camX;
      if (x < -160 || x > C.W + 160) continue;
      Art.drawPalm(ctx, x, C.GROUND_Y + 4, d.s);
    }
    // 地面区块
    for (const s of w.spans) {
      if (s.type !== 'ground') continue;
      const x0 = s.x0 - this.camX, x1 = s.x1 - this.camX;
      if (x1 < -40 || x0 > C.W + 40) continue;
      const wdt = x1 - x0;
      const sand = ctx.createLinearGradient(0, C.GROUND_Y, 0, C.H);
      sand.addColorStop(0, '#f0d79b');
      sand.addColorStop(1, '#d8b374');
      ctx.fillStyle = sand;
      ctx.fillRect(x0, C.GROUND_Y, wdt, C.H - C.GROUND_Y);
      // 草皮
      ctx.fillStyle = '#7ecb6f';
      ctx.fillRect(x0, C.GROUND_Y, wdt, 12);
      ctx.fillStyle = '#5fbf62';
      for (let x = Math.max(x0, -20); x < Math.min(x1, C.W + 20); x += 26) {
        const wx = x + this.camX;
        ctx.beginPath();
        ctx.moveTo(x, C.GROUND_Y + 2);
        ctx.lineTo(x + 5, C.GROUND_Y - 7 - ((wx | 0) % 5));
        ctx.lineTo(x + 10, C.GROUND_Y + 2);
        ctx.closePath();
        ctx.fill();
      }
      // 断崖描边：只在与飞行区相邻的一侧画竖线，提示“地面到此为止”
      ctx.strokeStyle = Art.INK;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x0, C.GROUND_Y); ctx.lineTo(x1, C.GROUND_Y);
      ctx.stroke();
      if (w.typeAt(s.x0 - 1) === 'sky') {
        ctx.beginPath(); ctx.moveTo(x0, C.GROUND_Y); ctx.lineTo(x0, C.H); ctx.stroke();
      }
      if (w.typeAt(s.x1 + 1) === 'sky') {
        ctx.beginPath(); ctx.moveTo(x1, C.GROUND_Y); ctx.lineTo(x1, C.H); ctx.stroke();
      }
    }
  };

  G.drawEntities = function (ctx) {
    const w = this.world, t = this.t;
    for (const p of w.solids) {
      const x = p.x - this.camX;
      if (x < -260 || x > C.W + 60) continue;
      Art.drawPlatform(ctx, x, p.y, p.w, p.h);
    }
    for (const h of w.hazards) {
      if (h.dead) continue;
      const x = h.x - this.camX;
      if (x < -140 || x > C.W + 140) continue;
      switch (h.kind) {
        case 'bush': Art.drawBush(ctx, x + h.w / 2, h.y + h.h, h.w, h.h); break;
        case 'rock': Art.drawRock(ctx, x + h.w / 2, h.y + h.h, h.w, h.h); break;
        case 'mob': Art.drawMob(ctx, x + h.w / 2, h.y + h.h, t, { phase: h.phase, shadow: true }); break;
        case 'flyer': Art.drawMob(ctx, x + h.w / 2, h.y + h.h, t, { phase: h.phase, hue: 200, bob: 1 }); break;
        case 'pillar': Art.drawPillar(ctx, x, h.y, h.w, h.h, h.from); break;
      }
    }
    for (const c of w.coins) {
      if (c.dead) continue;
      const x = c.x - this.camX;
      if (x < -40 || x > C.W + 40) continue;
      Art.drawCoin(ctx, x, c.y, t, c.phase);
    }
    for (const pu of w.powerups) {
      if (pu.dead) continue;
      const x = pu.x - this.camX;
      if (x < -60 || x > C.W + 60) continue;
      Art.drawPowerup(ctx, x, pu.y, t);
    }
  };

  G.drawActors = function (ctx) {
    const p = this.p;
    // 后方讨伐怪小队
    for (let i = 0; i < 3; i++) {
      const x = p.px - this.lead - i * 34;
      if (x < -80) continue;
      Art.drawMob(ctx, x, this.chaserY + i * 2, this.t, {
        phase: i * 1.3, scale: 1 - i * 0.08, hue: 268 + i * 16,
        shadow: this.world.typeAt(this.camX + x) === 'ground',
      });
    }
    // 主角
    const mode = p.state === 'FLY' ? 'fly' : (p.invuln > 0 ? 'hurt' : (p.onGround ? 'run' : 'air'));
    const blink = p.invuln > 0 && Math.floor(this.t * 20) % 2 === 0;
    ctx.save();
    if (blink) ctx.globalAlpha = 0.4;
    if (p.state === 'FLY' && p.flyReason === 'item') {
      // 无敌光环
      const r = 56 + Math.sin(this.t * 9) * 6;
      const gr = ctx.createRadialGradient(p.px, p.y - 24, 8, p.px, p.y - 24, r);
      gr.addColorStop(0, 'rgba(255,232,120,.75)');
      gr.addColorStop(1, 'rgba(255,236,150,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(p.px, p.y - 24, r, 0, Math.PI * 2); ctx.fill();
    }
    Art.drawHero(ctx, p.px, p.y, this.t, mode, {
      guitar: p.flyReason === 'item',
      shadow: p.state === 'RUN',
      shadowAlpha: p.onGround ? 0.2 : 0.1,
      shadowScale: p.onGround ? 1 : 0.75,
    });
    ctx.restore();
  };

  G.drawParticles = function (ctx) {
    for (const q of this.particles) {
      ctx.save();
      ctx.globalAlpha = U.clamp(q.life * 2.2, 0, 1);
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x - this.camX, q.y, q.r, 0, Math.PI * 2);   // 粒子统一用世界坐标
      ctx.fill();
      ctx.restore();
    }
  };

  function panel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(255,247,236,.9)';
    U.roundRect(ctx, x, y, w, h, 14);
    ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = Art.INK; ctx.stroke();
  }

  G.drawHud = function (ctx) {
    ctx.save();
    ctx.textBaseline = 'middle';

    // 左上：工资 / 距离
    panel(ctx, 16, 16, 250, 62);
    ctx.fillStyle = Art.INK;
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`¥ ${this.coins}`, 34, 47);
    ctx.font = 'bold 20px system-ui';
    ctx.fillText(`${Math.floor(this.distance)} m`, 148, 47);

    // 右上：除草证进度
    const cert = this.distance / C.CERT_STEP;
    const stage = Math.floor(cert);
    panel(ctx, C.W - 266, 16, 250, 62);
    ctx.fillStyle = Art.INK;
    ctx.font = 'bold 15px system-ui';
    ctx.fillText(`除草证进度 Lv.${stage}`, C.W - 246, 36);
    ctx.fillStyle = 'rgba(74,63,58,.15)';
    U.roundRect(ctx, C.W - 246, 48, 210, 12, 6); ctx.fill();
    ctx.fillStyle = '#7ecb6f';
    U.roundRect(ctx, C.W - 246, 48, 210 * (cert - stage), 12, 6); ctx.fill();

    // 左下：与讨伐怪的距离
    const ratio = U.clamp(this.lead / C.LEAD_MAX, 0, 1);
    panel(ctx, 16, C.H - 74, 250, 58);
    ctx.fillStyle = Art.INK;
    ctx.font = 'bold 15px system-ui';
    ctx.fillText('讨伐怪距离', 34, C.H - 52);
    ctx.fillStyle = 'rgba(74,63,58,.15)';
    U.roundRect(ctx, 34, C.H - 38, 210, 12, 6); ctx.fill();
    ctx.fillStyle = ratio < 0.35 ? '#e8506b' : '#ff9db0';
    U.roundRect(ctx, 34, C.H - 38, 210 * ratio, 12, 6); ctx.fill();

    // 顶部中央：飞行倒计时
    if (this.p.state === 'FLY' && this.p.flyReason === 'item') {
      const r = U.clamp(this.p.flyTimer / C.ITEM_FLY_TIME, 0, 1);
      panel(ctx, C.W / 2 - 130, 16, 260, 54);
      ctx.fillStyle = Art.INK;
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`🎸 无敌飞行 ${this.p.flyTimer.toFixed(1)}s`, C.W / 2, 34);
      ctx.fillStyle = 'rgba(74,63,58,.15)';
      U.roundRect(ctx, C.W / 2 - 110, 48, 220, 10, 5); ctx.fill();
      ctx.fillStyle = '#ffc94d';
      U.roundRect(ctx, C.W / 2 - 110, 48, 220 * r, 10, 5); ctx.fill();
    } else if (this.p.state === 'FLY') {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.font = 'bold 18px system-ui';
      ctx.fillText('☁️ 飞行区 · 方向键 / 拖拽自由移动', C.W / 2, 34);
    }

    // 提示横幅
    if (this.banner) {
      ctx.globalAlpha = U.clamp(this.banner.life, 0, 1);
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px system-ui';
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.strokeText(this.banner.text, C.W / 2, 130);
      ctx.fillStyle = Art.INK;
      ctx.fillText(this.banner.text, C.W / 2, 130);
    }
    ctx.restore();
  };
})(window);
