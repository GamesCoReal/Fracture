const Physics = (() => {
  const MASS = { small: 1, medium: 1.8, large: 3 };
  const DRAG = 0.995;

  function sizeMass(size) { return MASS[size] || 1; }

  function step(world, dt, state, abilities) {
    const shapes = world.shapes;
    const n = shapes.length;

    // ambient float: gentle wander force
    for (let i = 0; i < n; i++) {
      const s = shapes[i];
      s.spawnT = Math.min(1, s.spawnT + dt * 4);
      if (s.hitFlash > 0) s.hitFlash = Math.max(0, s.hitFlash - dt * 3.2);

      const wanderAngle = (s.uid * 12.9898 + performance.now() * 0.00025) % (Math.PI * 2);
      s.vx += Math.cos(wanderAngle) * 3.2 * dt;
      s.vy += Math.sin(wanderAngle) * 3.2 * dt;

      s.vx *= DRAG;
      s.vy *= DRAG;
    }

    // subtle mutual gravity, O(n^2) but n is capped by PerfSystem
    if (n < 140) {
      for (let i = 0; i < n; i++) {
        const a = shapes[i];
        for (let j = i + 1; j < n; j++) {
          const b = shapes[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          let distSq = dx * dx + dy * dy;
          if (distSq < 400) continue;
          if (distSq > 60000) continue;
          const dist = Math.sqrt(distSq);
          const force = (0.02 * sizeMass(a.size) * sizeMass(b.size)) / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx * dt * 1000;
          a.vy += fy * dt * 1000;
          b.vx -= fx * dt * 1000;
          b.vy -= fy * dt * 1000;
        }
      }
    }

    // gravity well ability
    if (abilities && abilities.gravityActive) {
      const gx = abilities.gravityX, gy = abilities.gravityY;
      const strength = abilities.gravityStrength, range = abilities.gravityRange;
      for (let i = 0; i < n; i++) {
        const s = shapes[i];
        const dx = gx - s.x, dy = gy - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist > range) continue;
        const falloff = 1 - dist / range;
        const pull = strength * falloff * dt;
        s.vx += (dx / dist) * pull;
        s.vy += (dy / dist) * pull;
        // tangential component so shapes orbit rather than pile up at center
        if (dist < 40) {
          s.vx += (-dy / dist) * pull * 1.4;
          s.vy += (dx / dist) * pull * 1.4;
        } else {
          s.vx += (-dy / dist) * pull * 0.5;
          s.vy += (dx / dist) * pull * 0.5;
        }
      }
    }

    // integrate + bounds
    for (let i = 0; i < n; i++) {
      const s = shapes[i];
      const speed = Math.hypot(s.vx, s.vy);
      const maxSpeed = 140;
      if (speed > maxSpeed) {
        s.vx = (s.vx / speed) * maxSpeed;
        s.vy = (s.vy / speed) * maxSpeed;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rotation += s.rotSpeed * dt;
      world.clampInBounds(s);
    }

    // collisions (simple elastic separation), skipped when very crowded for perf
    if (n < 160) {
      for (let i = 0; i < n; i++) {
        const a = shapes[i];
        for (let j = i + 1; j < n; j++) {
          const b = shapes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const minDist = a.radius + b.radius;
          if (dist < minDist) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist, ny = dy / dist;
            a.x -= nx * overlap; a.y -= ny * overlap;
            b.x += nx * overlap; b.y += ny * overlap;
            const relVx = b.vx - a.vx, relVy = b.vy - a.vy;
            const rel = relVx * nx + relVy * ny;
            if (rel < 0) {
              const impulse = -rel * 0.6;
              a.vx -= nx * impulse; a.vy -= ny * impulse;
              b.vx += nx * impulse; b.vy += ny * impulse;
            }
          }
        }
      }
    }

    // particles
    for (let i = world.particles.length - 1; i >= 0; i--) {
      const p = world.particles[i];
      p.life -= dt;
      if (p.life <= 0) { world.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
  }

  return { step, sizeMass };
})();
