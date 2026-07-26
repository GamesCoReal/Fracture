const PowerSystem = (() => {
  const SIZE_MUL = { small: 1, medium: 1.6, large: 2.4 };

  function upgradeValue(defUpgrade, level) {
    return defUpgrade.base + defUpgrade.step * level;
  }

  function getUpLevel(state, groupKey, id, upId) {
    const g = state[groupKey][id];
    if (!g || !g.level) return 0;
    return g.level[upId] || 0;
  }

  function getPowerValue(state, powerId, upId) {
    const def = PowersConfig.getDef(powerId);
    const up = def.upgrades[upId];
    const lvl = getUpLevel(state, 'powers', powerId, upId);
    return upgradeValue(up, lvl);
  }

  function getAbilityValue(state, abilityId, upId) {
    const def = AbilitiesConfig.getDef(abilityId);
    const up = def.upgrades[upId];
    const lvl = getUpLevel(state, 'abilities', abilityId, upId);
    return upgradeValue(up, lvl);
  }

  function resolveShapeHit(world, state, shape, ctx, opts = {}) {
    const def = ShapeConfig.getById(shape.shapeId);
    if (!def) return;
    shape.hitFlash = 1;
    const rarityIdx = Math.max(0, ShapeConfig.rarityOrder.indexOf(def.rarity));
    const reward = Math.max(1, Math.round((1 + rarityIdx * 1.5) * (SIZE_MUL[shape.size] || 1) * (opts.rewardMul || 1)));

    if (shape.corrupted) {
      world.spawnParticles(shape.x, shape.y, '#c026d3', 14);
      ctx.addCurrency(reward, shape.x, shape.y, true);
      ctx.sound.corruptPop();
      const lockedShapeId = world.randomLockedShapeId(state);
      const newId = lockedShapeId || shape.shapeId;
      const nextSize = EntitySystem.SIZE_DOWN[shape.size] || 'small';
      if (newId) {
        if (lockedShapeId && !state.encounteredShapes[newId]) {
          state.encounteredShapes[newId] = true;
        }
        world.spawnCopies(shape, 1, newId, nextSize);
        world.transformShape(shape, newId, nextSize, false);
      }
      state.stats.totalCorruptedEncountered++;
      state.stats.totalDestroyed++;
      return;
    }

    if (shape.size === 'small') {
      const burstX = shape.x;
      const burstY = shape.y;
      world.spawnParticles(burstX, burstY, '#b9c4d0', 16);

      const i = world.shapes.indexOf(shape);
      if (i >= 0) {
        world.shapes.splice(i, 1);
      }
      
      ctx.ringFx(burstX, burstY, 28);
      ctx.addCurrency(reward, burstX, burstY, false);
      ctx.sound.tapSmall();
      state.stats.totalDestroyed++;
      return;
    }

    // Medium and Large shapes transform down one tier while creating another shape.
    const previousSize = shape.size;
    const nextSize = EntitySystem.SIZE_DOWN[shape.size];
    world.spawnParticles(shape.x, shape.y, '#6a6a72', 10);
    const children = world.spawnCopies(shape, 1, shape.shapeId, nextSize);
    world.transformShape(shape, shape.shapeId, nextSize, false);
    // roll corruption on freshly split medium/large children
    if (children.length && children[0].size !== 'small') {
      const cChanceBase = UpgradesConfig.getDef('corruption_chance').base;
      const cChance = Math.min(0.4, cChanceBase + (state.globalUpgrades.corruption_chance || 0) * 0.01);
      [shape, ...children].forEach(c => { if (Math.random() < cChance) c.corrupted = true; });
    }
    ctx.addCurrency(reward, shape.x, shape.y, false);
    ctx.sound.split(previousSize);
    state.stats.totalDestroyed++;
  }

  function findTopShapeAt(world, x, y) {
    for (let i = world.shapes.length - 1; i >= 0; i--) {
      const s = world.shapes[i];
      const dist = Math.hypot(s.x - x, s.y - y);
      if (dist <= s.radius * 1.05) return s;
    }
    return null;
  }

  function applyTap(world, state, x, y, ctx) {
    state.stats.totalTaps++;
    const active = state.activePower;

    if (!active) {
      const shape = findTopShapeAt(world, x, y);
      if (shape) resolveShapeHit(world, state, shape, ctx);
      return;
    }

    if (active === 'shockwave') {
      const radius = getPowerValue(state, 'shockwave', 'radius');
      const extraChance = getPowerValue(state, 'shockwave', 'strength');
      const hits = world.shapes.filter(s => Math.hypot(s.x - x, s.y - y) <= radius).slice();
      hits.forEach(s => {
        resolveShapeHit(world, state, s, ctx);
        if (Math.random() < extraChance) {
          const again = findTopShapeAt(world, s.x, s.y);
          if (again) resolveShapeHit(world, state, again, ctx, { rewardMul: 0.6 });
        }
      });
      ctx.sound.powerFire();
      ctx.ringFx(x, y, radius);
      return;
    }

    if (active === 'chain_lightning') {
      const start = findTopShapeAt(world, x, y);
      if (!start) return;
      const jumps = Math.round(getPowerValue(state, 'chain_lightning', 'jumps'));
      const range = getPowerValue(state, 'chain_lightning', 'jumpRange');
      let current = start;
      const hitSet = new Set();
      const chainPoints = [{ x: current.x, y: current.y }];
      resolveShapeHit(world, state, current, ctx);
      hitSet.add(current.uid);
      state.stats.chainHits++;
      for (let i = 0; i < jumps; i++) {
        let next = null, bestDist = Infinity;
        for (const s of world.shapes) {
          if (hitSet.has(s.uid)) continue;
          const d = Math.hypot(s.x - current.x, s.y - current.y);
          if (d <= range && d < bestDist) { bestDist = d; next = s; }
        }
        if (!next) break;
        chainPoints.push({ x: next.x, y: next.y });
        resolveShapeHit(world, state, next, ctx, { rewardMul: 0.8 });
        hitSet.add(next.uid);
        current = next;
        state.stats.chainHits++;
      }
      ctx.sound.powerFire();
      ctx.lightningFx(chainPoints);
      return;
    }

    if (active === 'implosion') {
      const pullRadius = getPowerValue(state, 'implosion', 'pullRadius');
      const pullStrength = getPowerValue(state, 'implosion', 'pullStrength');
      world.shapes.forEach(s => {
        const dx = x - s.x, dy = y - s.y;
        const dist = Math.hypot(dx, dy);
        if (dist > pullRadius || dist < 1) return;
        const f = pullStrength * (1 - dist / pullRadius) * 60;
        s.vx += (dx / dist) * f;
        s.vy += (dy / dist) * f;
      });
      const hits = world.shapes.filter(s => Math.hypot(s.x - x, s.y - y) <= pullRadius * 0.42).slice();
      hits.forEach(s => resolveShapeHit(world, state, s, ctx, { rewardMul: 1.1 }));
      ctx.sound.powerFire();
      ctx.ringFx(x, y, pullRadius * 0.42, true);
      return;
    }

    if (active === 'resonance') {
      const speed = getPowerValue(state, 'resonance', 'speed');
      const life = getPowerValue(state, 'resonance', 'life');
      world.rings = world.rings || [];
      world.rings.push({ x, y, r: 0, speed, life, maxLife: life, hitSet: new Set() });
      ctx.sound.powerFire();
      return;
    }
  }

  function updateRings(world, state, dt, ctx) {
    if (!world.rings || !world.rings.length) return;
    for (let i = world.rings.length - 1; i >= 0; i--) {
      const ring = world.rings[i];
      ring.r += ring.speed * dt;
      ring.life -= dt;
      world.shapes.forEach(s => {
        if (ring.hitSet.has(s.uid)) return;
        const d = Math.hypot(s.x - ring.x, s.y - ring.y);
        if (Math.abs(d - ring.r) < s.radius + 6) {
          resolveShapeHit(world, state, s, ctx, { rewardMul: 0.85 });
          ring.hitSet.add(s.uid);
        }
      });
      if (ring.life <= 0) world.rings.splice(i, 1);
    }
  }

  return { resolveShapeHit, findTopShapeAt, applyTap, updateRings, getPowerValue, getAbilityValue, getUpLevel };
})();
