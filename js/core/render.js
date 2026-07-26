const Renderer = (() => {
  const SHAPE_FILL = '#34343a';
  const SHAPE_STROKE = 'rgba(255,255,255,0.06)';

  function drawGeometry(ctx, def, radius) {
    ctx.beginPath();
    if (!def || def.sides === 0) {
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.closePath();
      return;
    }
    const sides = def.sides;
    if (def.star) {
      const inner = radius * (def.starInner || 0.5);
      const pts = sides * 2;
      for (let i = 0; i < pts; i++) {
        const r = i % 2 === 0 ? radius : inner;
        const a = (Math.PI * 2 * i) / pts - Math.PI / 2;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      return;
    }
    const rounding = def.rounded || 0;
    if (Math.abs(rounding) < 0.02) {
      for (let i = 0; i < sides; i++) {
        const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const x = Math.cos(a) * radius, y = Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      return;
    }
    // rounded / spurred hybrid: quadratic-curve between vertices
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
      pts.push([Math.cos(a) * radius, Math.sin(a) * radius]);
    }
    const bulge = rounding; // positive = rounded outward, negative = spurred inward
    for (let i = 0; i < sides; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % sides];
      const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
      const dist = Math.hypot(mx, my) || 1;
      const factor = 1 + bulge * 0.5;
      const cx = (mx / dist) * dist * factor;
      const cy = (my / dist) * dist * factor;
      if (i === 0) ctx.moveTo(p0[0], p0[1]);
      ctx.quadraticCurveTo(cx, cy, p1[0], p1[1]);
    }
    ctx.closePath();
  }

  function render(ctx, canvas, world, state, dpr) {
    const w = canvas.width / dpr, h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    // vignette depth
    const grad = ctx.createRadialGradient(w / 2, h * 0.4, h * 0.1, w / 2, h * 0.5, h * 0.85);
    grad.addColorStop(0, 'rgba(255,255,255,0.015)');
    grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // gravity well visual
    if (world.gravityAnchor) {
      const gx = world.gravityAnchor.x, gy = world.gravityAnchor.y;
      const pulse = 1 + Math.sin(performance.now() / 260) * 0.08;
      const rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 90 * pulse);
      rg.addColorStop(0, 'rgba(124,58,237,0.22)');
      rg.addColorStop(1, 'rgba(124,58,237,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(gx, gy, 90 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,180,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(gx, gy, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // particles
    for (const p of world.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // transient effects (ring pulses, lightning arcs)
    if (world.fx && world.fx.length) {
      const now = performance.now();
      for (let i = world.fx.length - 1; i >= 0; i--) {
        const fx = world.fx[i];
        const elapsed = (now - fx.t0) / 1000;
        if (elapsed > fx.duration) { world.fx.splice(i, 1); continue; }
        const t = elapsed / fx.duration;
        if (fx.type === 'ring') {
          ctx.globalAlpha = 1 - t;
          ctx.strokeStyle = fx.implosion ? 'rgba(255,180,120,0.8)' : 'rgba(160,200,255,0.7)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, fx.r * (fx.implosion ? (1 - t * 0.3) : (0.4 + t * 0.6)), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (fx.type === 'lightning' && fx.points.length > 1) {
          ctx.globalAlpha = 1 - t;
          ctx.strokeStyle = 'rgba(210,230,255,0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          fx.points.forEach((p, i2) => { if (i2 === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    // shapes
    for (const s of world.shapes) {
      const def = ShapeConfig.getById(s.shapeId);
      const scale = 0.6 + 0.4 * easeOutBack(s.spawnT);
      const r = s.radius * scale;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);

      if (s.corrupted) {
        const t = performance.now() / 500;
        const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.6);
        glow.addColorStop(0, 'rgba(192,38,211,0.35)');
        glow.addColorStop(1, 'rgba(124,58,237,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
        ctx.fill();

        drawGeometry(ctx, def, r);
        const cgrad = ctx.createLinearGradient(-r, -r, r, r);
        cgrad.addColorStop(0, '#3a1f52');
        cgrad.addColorStop(0.5 + Math.sin(t) * 0.15, '#5b2a7a');
        cgrad.addColorStop(1, '#7c3aed');
        ctx.fillStyle = cgrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(217,169,255,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        drawGeometry(ctx, def, r);
        ctx.fillStyle = s.hitFlash > 0 ? shade(SHAPE_FILL, s.hitFlash) : SHAPE_FILL;
        ctx.fill();
        ctx.strokeStyle = SHAPE_STROKE;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  function shade(hex, amt) {
    const c = parseInt(hex.slice(1), 16);
    let r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
    r = Math.min(255, r + 255 * amt * 0.5);
    g = Math.min(255, g + 255 * amt * 0.5);
    b = Math.min(255, b + 255 * amt * 0.5);
    return `rgb(${r|0},${g|0},${b|0})`;
  }

  function easeOutBack(t) {
    const c1 = 1.7, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  return { render, drawGeometry };
})();
