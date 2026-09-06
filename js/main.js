(function (g) {
  const C = g.CFG, Sfx = g.Sfx;
  const cv = document.getElementById('game');
  const game = new g.Game(cv);
  g.__g = game;   // 方便控制台/自动化测试查看状态

  const overlay = document.getElementById('overlay');
  const goScreen = document.getElementById('gameover');
  const CERT = ['见习除草员', '正式除草员', '除草能手', '除草大师', '传说中的除草王'];

  game.onGameOver = (r) => {
    document.getElementById('go-title').textContent =
      r.reason === 'caught' ? '被讨伐怪追上了……' : '掉进海里了……';
    document.getElementById('go-dist').textContent = r.distance;
    document.getElementById('go-coins').textContent = r.coins;
    document.getElementById('go-best').textContent = r.best;
    document.getElementById('go-cert').textContent =
      `除草证等级：${CERT[Math.min(r.cert, CERT.length - 1)]}`;
    goScreen.classList.remove('hidden');
  };

  function startGame() {
    overlay.classList.add('hidden');
    goScreen.classList.add('hidden');
    game.start();
  }
  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-retry').addEventListener('click', startGame);

  /* ---------- 键盘 ---------- */
  const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
  addEventListener('keydown', (e) => {
    if (JUMP_KEYS.has(e.code) || e.code === 'ArrowDown') e.preventDefault();
    if (e.repeat) { game.keys.add(e.code); return; }
    game.keys.add(e.code);

    if (e.code === 'KeyM') { Sfx.muted = !Sfx.muted; return; }
    if (e.code === 'KeyP') {
      if (game.phase === 'playing') game.phase = 'paused';
      else if (game.phase === 'paused') game.phase = 'playing';
      return;
    }
    if (game.phase === 'ready' || game.phase === 'over') {
      if (JUMP_KEYS.has(e.code) || e.code === 'Enter') startGame();
      return;
    }
    if (JUMP_KEYS.has(e.code) && game.p.state === 'RUN') game.pressJump();
  });
  addEventListener('keyup', (e) => {
    game.keys.delete(e.code);
    if (JUMP_KEYS.has(e.code)) game.releaseJump();
  });

  /* ---------- 触摸 / 鼠标 ---------- */
  function toCanvas(ev) {
    const r = cv.getBoundingClientRect();
    return {
      x: ((ev.clientX - r.left) / r.width) * C.W,
      y: ((ev.clientY - r.top) / r.height) * C.H,
    };
  }
  cv.addEventListener('pointerdown', (ev) => {
    cv.setPointerCapture(ev.pointerId);
    const p = toCanvas(ev);
    game.pointer = { down: true, x: p.x, y: p.y };
    Sfx.init(); Sfx.resume();
    if (game.phase === 'playing' && game.p.state === 'RUN') game.pressJump();
  });
  cv.addEventListener('pointermove', (ev) => {
    if (!game.pointer.down) return;
    const p = toCanvas(ev);
    game.pointer.x = p.x; game.pointer.y = p.y;
  });
  const endPointer = () => {
    game.pointer.down = false;
    game.releaseJump();
  };
  cv.addEventListener('pointerup', endPointer);
  cv.addEventListener('pointercancel', endPointer);

  /* ---------- HiDPI ---------- */
  function fit() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = C.W * dpr;
    cv.height = C.H * dpr;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', fit);
  fit();

  /* ---------- 主循环（固定步长积分，避免掉帧时穿模） ---------- */
  const STEP = 1 / 120;
  let acc = 0, last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;          // 切后台回来时不要一次性推进太多
    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard++ < 8) { game.update(STEP); acc -= STEP; }
    game.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})(window);
