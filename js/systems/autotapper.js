const AutoTapperSystem = (() => {
  let accum = 0;

  function pickTarget(world, state) {
    if (!world.shapes.length) return null;
    const mode = state.autoTapper.priority;
    const cx = world.width / 2, cy = world.height / 2;

    if (mode === 'corrupted') {
      const corrupted = world.shapes.filter(s => s.corrupted);
      if (corrupted.length) return corrupted[Math.floor(Math.random() * corrupted.length)];
    }
    if (mode === 'largest') {
      return world.shapes.reduce((a, b) => sizeRank(b.size) > sizeRank(a.size) ? b : a);
    }
    if (mode === 'smallest') {
      return world.shapes.reduce((a, b) => sizeRank(b.size) < sizeRank(a.size) ? b : a);
    }
    if (mode === 'rarity') {
      let best = null, bestRank = -1;
      world.shapes.forEach(s => {
        const def = ShapeConfig.getById(s.shapeId);
        const rank = def ? ShapeConfig.rarityOrder.indexOf(def.rarity) : -1;
        if (rank > bestRank) { bestRank = rank; best = s; }
      });
      return best;
    }
    if (mode === 'custom' && state.autoTapper.custom && state.autoTapper.custom.length) {
      for (const shapeId of state.autoTapper.custom) {
        const found = world.shapes.find(s => s.shapeId === shapeId);
        if (found) return found;
      }
    }
    // default: closest to center (proxy for "closest" since there's no cursor position)
    return world.shapes.reduce((a, b) => {
      const da = Math.hypot(a.x - cx, a.y - cy);
      const db = Math.hypot(b.x - cx, b.y - cy);
      return db < da ? b : a;
    });
  }

  function sizeRank(size) { return size === 'large' ? 2 : size === 'medium' ? 1 : 0; }

  function tick(world, state, dt, ctx) {
    if (!AbilitySystem.isOwned(state, 'auto_tapper')) return;
    const speed = PowerSystem.getAbilityValue(state, 'auto_tapper', 'speed');
    const count = Math.round(PowerSystem.getAbilityValue(state, 'auto_tapper', 'count'));
    const rate = speed * count;
    if (rate <= 0) return;
    accum += dt * rate;
    let taps = Math.floor(accum);
    accum -= taps;
    taps = Math.min(taps, 12);
    for (let i = 0; i < taps; i++) {
      const target = pickTarget(world, state);
      if (!target) break;
      PowerSystem.applyTap(world, state, target.x, target.y, ctx);
    }
  }

  return { tick, pickTarget };
})();
