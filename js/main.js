(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx2d = canvas.getContext('2d');
  const gameArea = document.getElementById('gameArea');

  let state = SaveSystem.load();
  let world = new World(300, 500);
  world.fx = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2.5);

  // ---------- currency / feedback plumbing ----------
  let earnedThisSecond = 0;
  let rateDisplay = 0;
  let rateTimer = 0;

  const gameCtx = {
    addCurrency(amount, x, y, corrupted) {
      state.currency += amount;
      state.totalEarned += amount;
      earnedThisSecond += amount;
      UI.spawnFloatText(x, y, `+${UI.formatNum(amount)}`, corrupted);
    },
    sound: {
      tapSmall: () => AudioSystem.tapSmall(),
      split: (size) => AudioSystem.split(size),
      corruptPop: () => AudioSystem.corruptPop(),
      powerFire: () => AudioSystem.powerFire(),
      unlockChime: () => AudioSystem.unlockChime(),
      uiTap: () => AudioSystem.uiTap(),
      error: () => AudioSystem.error(),
    },
    ringFx(x, y, r, implosion) {
      world.fx.push({ type: 'ring', x, y, r, t0: performance.now(), duration: 0.42, implosion: !!implosion });
    },
    lightningFx(points) {
      world.fx.push({ type: 'lightning', points, t0: performance.now(), duration: 0.22 });
    },
  };

  function hardReset() {
    SaveSystem.hardReset();
    state = SaveSystem.defaultState();
    world.shapes = [];
    world.particles = [];
    world.fx = [];
    AbilitySystem.clearGravityWell(world, state);
    PerfSystem.setMode(state.settings.performanceMode);
    AudioSystem.setEnabled(state.settings.soundOn);
    AudioSystem.setVolume(state.settings.sfxVolume);
    UI.renderPanel();
    UI.refreshCurrency(state);
    UI.refreshBadge(state);
  }

  // ---------- sizing ----------
  function resize() {
    const rect = gameArea.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    world.resize(rect.width, rect.height);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));

  // ---------- input ----------
  const activePointers = new Map();

  function canvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener('pointerdown', (e) => {
    AudioSystem.unlock();
    const p = canvasPoint(e);
    const pointer = { x: p.x, y: p.y, t: performance.now(), longPressTimer: null, longPressFired: false };
    activePointers.set(e.pointerId, pointer);
    canvas.setPointerCapture(e.pointerId);
    UI.setEmptyHint(false);
    if (AbilitySystem.isOwned(state, 'gravity_well')) {
      pointer.longPressTimer = setTimeout(() => {
        pointer.longPressFired = true;
        pointer.longPressTimer = null;
        AbilitySystem.placeGravityWell(world, state, p.x, p.y);
        AudioSystem.uiTap();
      }, 480);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const pointer = activePointers.get(e.pointerId);
    if (!pointer) return;
    const p = canvasPoint(e);
    const dist = Math.hypot(p.x - pointer.x, p.y - pointer.y);
    if (dist > 14 && pointer.longPressTimer) {
      clearTimeout(pointer.longPressTimer);
      pointer.longPressTimer = null;
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    const pointer = activePointers.get(e.pointerId);
    if (!pointer) return;
    if (pointer.longPressTimer) clearTimeout(pointer.longPressTimer);
    activePointers.delete(e.pointerId);
    const p = canvasPoint(e);
    const dist = Math.hypot(p.x - pointer.x, p.y - pointer.y);
    const dt = performance.now() - pointer.t;
    if (pointer.longPressFired) return;
    if (dist < 20 && dt < 480) {
      PowerSystem.applyTap(world, state, p.x, p.y, gameCtx);
    }
  });

  canvas.addEventListener('pointercancel', (e) => {
    const pointer = activePointers.get(e.pointerId);
    if (pointer && pointer.longPressTimer) clearTimeout(pointer.longPressTimer);
    activePointers.delete(e.pointerId);
  });

  // ---------- game loop ----------
  let lastT = performance.now();
  let saveAccum = 0;

  function frame(now) {
    const dtMs = Math.min(now - lastT, 48);
    const dt = dtMs / 1000;
    lastT = now;

    PerfSystem.recordFrame(dtMs);
    state.stats.playTimeSec += dt;

    if (state.startedOrigin) {
      world.spawnMaybe(state, dt, PerfSystem.getMaxShapes());
    }

    const abilityCtx = AbilitySystem.physicsContext(world, state);
    Physics.step(world, dt, state, abilityCtx);
    PowerSystem.updateRings(world, state, dt, gameCtx);
    AutoTapperSystem.tick(world, state, dt, gameCtx);

    Renderer.render(ctx2d, canvas, world, state, dpr);

    UI.setEmptyHint(state.startedOrigin && world.shapes.length === 0 && !UI.isPanelOpen());

    rateTimer += dt;
    if (rateTimer >= 1) {
      rateDisplay = earnedThisSecond / rateTimer;
      UI.refreshRate(rateDisplay);
      earnedThisSecond = 0;
      rateTimer = 0;
    }
    UI.refreshCurrency(state);

    saveAccum += dt;
    if (saveAccum > 4) {
      saveAccum = 0;
      SaveSystem.save(state);
    }

    requestAnimationFrame(frame);
  }

  // ---------- lifecycle ----------
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) SaveSystem.save(state);
  });
  window.addEventListener('pagehide', () => SaveSystem.save(state));

  // ---------- init ----------
  function init() {
    resize();
    PerfSystem.setMode(state.settings.performanceMode);
    AudioSystem.setEnabled(state.settings.soundOn);
    AudioSystem.setVolume(state.settings.sfxVolume);
    if (world.gravityAnchor === null && state.gravityWell && state.gravityWell.placed) {
      world.gravityAnchor = { x: state.gravityWell.x * world.width, y: state.gravityWell.y * world.height };
    }
    UI.init(state, { hardReset });
    UI.setEmptyHint(!!state.startedOrigin);
    if (!state.startedOrigin) UI.openPanel('research');
    requestAnimationFrame((t) => { lastT = t; requestAnimationFrame(frame); });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  init();
})();
