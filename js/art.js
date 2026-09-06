/* 全部造型由代码绘制（原创简笔风格），不依赖任何图片素材 */
(function (g) {
  const { ellipse, roundRect } = g.U;
  const INK = '#4a3f3a';

  function outline(ctx, w = 3) {
    ctx.lineWidth = w;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  /* ---------- 主角：圆滚滚的白色小可爱 ---------- */
  /* x,y = 脚底中心；mode: 'run' | 'air' | 'fly' | 'hurt' */
  function drawHero(ctx, x, y, t, mode, opts = {}) {
    const s = opts.scale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    const runBob = mode === 'run' ? Math.sin(t * 16) * 2.2 : 0;
    const flyBob = mode === 'fly' ? Math.sin(t * 5) * 3.5 : 0;
    const tilt = mode === 'fly' ? Math.sin(t * 3) * 0.08 : 0;
    ctx.rotate(tilt);

    const cy = -26 + runBob + flyBob; // 身体中心

    // 影子（仅地面态）
    if (opts.shadow) {
      ctx.save();
      ctx.globalAlpha = opts.shadowAlpha ?? 0.18;
      ctx.fillStyle = '#000';
      ellipse(ctx, 0, 1, 20 * (opts.shadowScale ?? 1), 5 * (opts.shadowScale ?? 1));
      ctx.fill();
      ctx.restore();
    }

    // 腿
    ctx.fillStyle = '#fff';
    const legSwing = mode === 'run' ? Math.sin(t * 16) * 7 : mode === 'fly' ? 3 : 5;
    [-7, 7].forEach((lx, i) => {
      const off = i === 0 ? legSwing : -legSwing;
      ellipse(ctx, lx + off * 0.35, -6 + Math.abs(off) * 0.12, 5.5, 7);
      ctx.fill();
      outline(ctx, 2.5);
    });

    // 手
    const armSwing = mode === 'run' ? Math.sin(t * 16 + Math.PI) * 8 : mode === 'fly' ? -10 : -6;
    [-1, 1].forEach((sgn) => {
      ctx.save();
      ellipse(ctx, sgn * 16, cy + 6 + sgn * armSwing * 0.4, 5, 6.5);
      ctx.fillStyle = '#fff';
      ctx.fill();
      outline(ctx, 2.5);
      ctx.restore();
    });

    // 耳朵
    [-11, 11].forEach((ex) => {
      ellipse(ctx, ex, cy - 15, 6.5, 8);
      ctx.fillStyle = '#fff';
      ctx.fill();
      outline(ctx, 2.5);
    });

    // 身体
    ellipse(ctx, 0, cy, 17, 18.5);
    ctx.fillStyle = '#fff';
    ctx.fill();
    outline(ctx, 3);

    // 腮红
    ctx.fillStyle = '#ffc0cb';
    ellipse(ctx, -10, cy + 4, 4.2, 2.8); ctx.fill();
    ellipse(ctx, 10, cy + 4, 4.2, 2.8); ctx.fill();

    // 眼睛
    ctx.fillStyle = INK;
    if (mode === 'hurt') {
      ctx.lineWidth = 2.4; ctx.strokeStyle = INK;
      [-6, 6].forEach((ex) => {
        ctx.beginPath();
        ctx.moveTo(ex - 3, cy - 5); ctx.lineTo(ex + 3, cy + 1);
        ctx.moveTo(ex + 3, cy - 5); ctx.lineTo(ex - 3, cy + 1);
        ctx.stroke();
      });
    } else {
      ellipse(ctx, -6, cy - 2, 2.6, 3.2); ctx.fill();
      ellipse(ctx, 6, cy - 2, 2.6, 3.2); ctx.fill();
    }

    // 嘴：跑步张嘴喘气，飞行时“哇——”
    ctx.lineWidth = 2.2; ctx.strokeStyle = INK;
    if (mode === 'fly' || mode === 'hurt') {
      ctx.fillStyle = '#e57a8c';
      ellipse(ctx, 0, cy + 6, 4, 3.4); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-3.5, cy + 5.5);
      ctx.quadraticCurveTo(0, cy + 9, 3.5, cy + 5.5);
      ctx.stroke();
    }

    // 飞行时手里的应援吉他
    if (mode === 'fly' && opts.guitar !== false) {
      ctx.save();
      ctx.translate(18, cy + 4);
      ctx.rotate(-0.5 + Math.sin(t * 8) * 0.12);
      drawGuitarShape(ctx, 0.72);
      ctx.restore();
    }
    ctx.restore();
  }

  /* ---------- 讨伐怪 ---------- */
  function drawMob(ctx, x, y, t, opts = {}) {
    const s = opts.scale || 1;
    const hue = opts.hue ?? 268;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const bob = Math.sin(t * (opts.speed || 9) + (opts.phase || 0)) * (opts.bob ?? 3);
    const cy = -22 + bob;

    if (opts.shadow) {
      ctx.save();
      ctx.globalAlpha = 0.16; ctx.fillStyle = '#000';
      ellipse(ctx, 0, 1, 18, 4.5); ctx.fill();
      ctx.restore();
    }

    // 脚
    ctx.fillStyle = `hsl(${hue} 30% 32%)`;
    [-8, 8].forEach((lx) => { ellipse(ctx, lx, -4, 5.5, 5); ctx.fill(); outline(ctx, 2.4); });

    // 角
    ctx.fillStyle = `hsl(${hue} 35% 28%)`;
    [[-11, -1], [11, 1]].forEach(([hx, sgn]) => {
      ctx.beginPath();
      ctx.moveTo(hx, cy - 12);
      ctx.lineTo(hx + sgn * 7, cy - 24);
      ctx.lineTo(hx + sgn * 8.5, cy - 10);
      ctx.closePath();
      ctx.fill(); outline(ctx, 2.4);
    });

    // 身体
    const grad = ctx.createLinearGradient(0, cy - 18, 0, cy + 18);
    grad.addColorStop(0, `hsl(${hue} 42% 56%)`);
    grad.addColorStop(1, `hsl(${hue} 40% 38%)`);
    ctx.fillStyle = grad;
    ellipse(ctx, 0, cy, 17, 17);
    ctx.fill(); outline(ctx, 3);

    // 单只大眼 + 血盆小口
    ctx.fillStyle = '#fff';
    ellipse(ctx, 0, cy - 4, 8, 8.5); ctx.fill(); outline(ctx, 2.2);
    ctx.fillStyle = INK;
    ellipse(ctx, Math.sin(t * 2) * 1.6, cy - 4, 3.4, 4); ctx.fill();

    ctx.fillStyle = '#3a2530';
    ctx.beginPath();
    ctx.moveTo(-8, cy + 8);
    for (let i = 0; i <= 4; i++) {
      const px = -8 + (i * 16) / 4;
      ctx.lineTo(px, cy + 8 + (i % 2 ? 5 : 0));
    }
    ctx.lineTo(8, cy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ---------- 道具与地形件 ---------- */
  function drawGuitarShape(ctx, s = 1) {
    ctx.save();
    ctx.scale(s, s);
    ctx.fillStyle = '#e8683f';
    ctx.beginPath();
    ctx.ellipse(0, 6, 9, 11, 0, 0, Math.PI * 2);
    ctx.ellipse(0, -4, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill(); outline(ctx, 2.4);
    ctx.fillStyle = '#8a5a3b';
    roundRect(ctx, -2.5, -26, 5, 18, 2); ctx.fill(); outline(ctx, 2);
    ctx.fillStyle = '#3a2f2b';
    ellipse(ctx, 0, 6, 3, 3); ctx.fill();
    ctx.restore();
  }

  function drawPowerup(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 3) * 6);
    // 光环
    const r = 26 + Math.sin(t * 6) * 3;
    const gr = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
    gr.addColorStop(0, 'rgba(255,236,150,.85)');
    gr.addColorStop(1, 'rgba(255,236,150,0)');
    ctx.fillStyle = gr;
    ellipse(ctx, 0, 0, r, r); ctx.fill();
    ctx.rotate(Math.sin(t * 2) * 0.25);
    drawGuitarShape(ctx, 1);
    ctx.restore();
  }

  function drawCoin(ctx, x, y, t, phase = 0) {
    const w = Math.abs(Math.cos(t * 4 + phase));
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffd34d';
    ellipse(ctx, 0, 0, 11 * Math.max(0.28, w), 11);
    ctx.fill(); outline(ctx, 2.4);
    if (w > 0.55) {
      ctx.fillStyle = '#f0a92e';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('¥', 0, 1);
    }
    ctx.restore();
  }

  function drawBush(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#5fbf62';
    ctx.beginPath();
    const n = Math.max(3, Math.round(w / 16));
    for (let i = 0; i < n; i++) {
      const bx = -w / 2 + (w / (n - 1)) * i;
      ctx.moveTo(bx, 0);
      ctx.quadraticCurveTo(bx - 7, -h * 0.7, bx + (i % 2 ? 4 : -4), -h);
      ctx.quadraticCurveTo(bx + 8, -h * 0.6, bx + 9, 0);
    }
    ctx.closePath();
    ctx.fill(); outline(ctx, 2.6);
    ctx.restore();
  }

  function drawRock(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#b9a99c';
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w * 0.34, -h * 0.86);
    ctx.lineTo(w * 0.06, -h);
    ctx.lineTo(w * 0.42, -h * 0.7);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill(); outline(ctx, 3);
    ctx.strokeStyle = 'rgba(74,63,58,.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.1, -h * 0.9); ctx.lineTo(-w * 0.2, -h * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlatform(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#e8c98f';
    roundRect(ctx, x, y, w, h, 8); ctx.fill(); outline(ctx, 3);
    ctx.fillStyle = '#7ecb6f';
    roundRect(ctx, x + 2, y + 1, w - 4, 9, 5); ctx.fill();
    ctx.restore();
  }

  /* 飞行区的浮空障碍：漂浮的岩柱 */
  function drawPillar(ctx, x, y, w, h, from) {
    ctx.save();
    const gr = ctx.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, '#b3c6e2');
    gr.addColorStop(0.55, '#93aed3');
    gr.addColorStop(1, '#7d99bf');
    ctx.fillStyle = gr;
    roundRect(ctx, x, y, w, h, 14); ctx.fill(); outline(ctx, 3);
    // 顶端/末端的青苔，让浮空岩柱有上下之分
    ctx.fillStyle = '#7ecb6f';
    const capY = from === 'top' ? y + h - 20 : y + 2;
    roundRect(ctx, x + 3, capY, w - 6, 18, 9); ctx.fill();
    // 岩纹
    ctx.strokeStyle = 'rgba(74,63,58,.22)';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 2; i++) {
      const cy = y + (h * i) / 3;
      ctx.beginPath();
      ctx.moveTo(x + 8, cy);
      ctx.lineTo(x + w - 12, cy + 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCloud(ctx, x, y, s, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-24, 4, 16, 0, Math.PI * 2);
    ctx.arc(-4, -6, 22, 0, Math.PI * 2);
    ctx.arc(22, 4, 17, 0, Math.PI * 2);
    ctx.rect(-24, 4, 46, 14);
    ctx.fill();
    ctx.restore();
  }

  function drawPalm(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#8a6b4a'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.quadraticCurveTo(-8, -50, 6, -92);
    ctx.stroke();
    ctx.fillStyle = '#57a85c';
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.52;
      ctx.save();
      ctx.translate(6, -92); ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(34, 0, 34, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  g.Art = {
    INK, drawHero, drawMob, drawCoin, drawPowerup, drawGuitarShape,
    drawBush, drawRock, drawPlatform, drawPillar, drawCloud, drawPalm,
  };
})(window);
