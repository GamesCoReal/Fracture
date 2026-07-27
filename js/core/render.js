const Renderer = (() => {
  const SHAPE_FILL = '#34343a';
  const SHAPE_STROKE = 'rgba(255,255,255,0.06)';

  function rot(x, y, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [x * c - y * s, x * s + y * c];
  }

  function drawCrossGreek(ctx, r) {
    const a = r * 0.32;
    const pts = [[a,a],[a,r],[-a,r],[-a,a],[-r,a],[-r,-a],[-a,-a],[-a,-r],[a,-r],[a,-a],[r,-a],[r,a]];
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
    ctx.closePath();
  }

  function drawCrossSwiss(ctx, r) {
    const a = r * 0.3, rad = r * 0.09;
    const pts = [[a,a],[a,r],[-a,r],[-a,a],[-r,a],[-r,-a],[-a,-a],[-a,-r],[a,-r],[a,-a],[r,-a],[r,a]];
    const n = pts.length;
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      ctx.arcTo(p2[0], p2[1], p3[0], p3[1], rad);
    }
    ctx.closePath();
  }

  function drawCrossMaltese(ctx, r) {
    const innerW = r * 0.16, outerW = r * 0.4, innerLen = r * 0.24, outerLen = r * 0.95;
    const arm = [[innerW, innerLen], [outerW, outerLen], [-outerW, outerLen], [-innerW, innerLen]];
    let first = true;
    for (let i = 0; i < 4; i++) {
      const ang = i * Math.PI / 2;
      arm.forEach(([x, y]) => {
        const [rx, ry] = rot(x, y, ang);
        if (first) { ctx.moveTo(rx, ry); first = false; } else ctx.lineTo(rx, ry);
      });
    }
    ctx.closePath();
  }

  function drawHourglass(ctx, r) {
    const w = r * 0.6, h = r;
    ctx.moveTo(-w, -h); ctx.lineTo(w, -h); ctx.lineTo(-w, h); ctx.lineTo(w, h); ctx.closePath();
  }

  function drawBowtie(ctx, r) {
    const w = r, h = r * 0.6;
    ctx.moveTo(-w, -h); ctx.lineTo(-w, h); ctx.lineTo(w, -h); ctx.lineTo(w, h); ctx.closePath();
  }

  function drawRing(ctx, r) {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.moveTo(r * 0.55, 0);
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2, true);
  }

  function drawGear(ctx, r, teeth) {
    const inner = r * 0.75, outer = r, toothWidthRatio = 0.5;
    const step = (Math.PI * 2) / teeth;
    let first = true;
    for (let i = 0; i < teeth; i++) {
      const a0 = i * step;
      const tw = step * toothWidthRatio;
      const mid = a0 + step / 2;
      const p1a = mid - tw / 2, p1b = mid + tw / 2;
      const ix0 = Math.cos(a0) * inner, iy0 = Math.sin(a0) * inner;
      const ox0 = Math.cos(p1a) * outer, oy0 = Math.sin(p1a) * outer;
      const ox1 = Math.cos(p1b) * outer, oy1 = Math.sin(p1b) * outer;
      if (first) { ctx.moveTo(ix0, iy0); first = false; } else ctx.lineTo(ix0, iy0);
      ctx.lineTo(ox0, oy0);
      ctx.lineTo(ox1, oy1);
    }
    ctx.closePath();
  }

  function drawFlower(ctx, r, petals) {
    const step = (Math.PI * 2) / petals;
    ctx.moveTo(0, 0);
    for (let i = 0; i < petals; i++) {
      const a = i * step;
      const tipX = Math.cos(a) * r, tipY = Math.sin(a) * r;
      const c1a = a - step * 0.28, c2a = a + step * 0.28;
      const c1x = Math.cos(c1a) * r * 0.55, c1y = Math.sin(c1a) * r * 0.55;
      const c2x = Math.cos(c2a) * r * 0.55, c2y = Math.sin(c2a) * r * 0.55;
      ctx.quadraticCurveTo(c1x, c1y, tipX, tipY);
      ctx.quadraticCurveTo(c2x, c2y, 0, 0);
    }
    ctx.closePath();
  }

  function drawClover(ctx, r, lobes) {
    const lobeR = r * 0.55, dist = r * 0.5;
    for (let i = 0; i < lobes; i++) {
      const a = (Math.PI * 2 * i) / lobes - Math.PI / 2;
      const cx = Math.cos(a) * dist, cy = Math.sin(a) * dist;
      ctx.moveTo(cx + lobeR, cy);
      ctx.arc(cx, cy, lobeR, 0, Math.PI * 2);
    }
  }

  function drawShield(ctx, r) {
    const w = r * 0.85;
    ctx.moveTo(-w, -r * 0.5);
    ctx.quadraticCurveTo(-w, -r, 0, -r);
    ctx.quadraticCurveTo(w, -r, w, -r * 0.5);
    ctx.lineTo(w, r * 0.15);
    ctx.quadraticCurveTo(w, r * 0.6, 0, r);
    ctx.quadraticCurveTo(-w, r * 0.6, -w, r * 0.15);
    ctx.closePath();
  }

  function drawChevron(ctx, r) {
    const w = r, h = r * 0.8, thick = r * 0.32;
    ctx.moveTo(-w, -h);
    ctx.lineTo(0, -h + thick * 0.2);
    ctx.lineTo(w, -h);
    ctx.lineTo(w, -h + thick);
    ctx.lineTo(0, h);
    ctx.lineTo(-w, -h + thick);
    ctx.closePath();
  }

  function drawSpike(ctx, r) {
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.35, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.35, 0); ctx.closePath();
  }

  function drawGem(ctx, r) {
    const topW = r * 0.5, midW = r, topY = -r * 0.6, midY = 0, botY = r;
    ctx.moveTo(-topW, topY);
    ctx.lineTo(topW, topY);
    ctx.lineTo(midW, midY);
    ctx.lineTo(0, botY);
    ctx.lineTo(-midW, midY);
    ctx.closePath();
  }

  function drawCompass(ctx, r) {
    const outer = r, inner = r * 0.22, n = 4;
    let first = true;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const tipX = Math.cos(a) * outer, tipY = Math.sin(a) * outer;
      const midA = a + Math.PI / n;
      const concaveX = Math.cos(midA) * inner, concaveY = Math.sin(midA) * inner;
      if (first) { ctx.moveTo(tipX, tipY); first = false; } else ctx.lineTo(tipX, tipY);
      ctx.quadraticCurveTo(concaveX * 0.6, concaveY * 0.6, concaveX, concaveY);
    }
    ctx.closePath();
  }

  function drawGearFlower(ctx, r) {
    const waves = 10, amp = r * 0.12, steps = waves * 2;
    let first = true;
    for (let i = 0; i <= steps; i++) {
      const a = (Math.PI * 2 * i) / steps;
      const rr = r + Math.sin(a * waves) * amp;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawPuzzle(ctx, r) {
    const w = r, tabR = r * 0.28;
    ctx.moveTo(-w, -w);
    ctx.lineTo(-tabR, -w);
    ctx.arc(0, -w, tabR, Math.PI, 0, true);
    ctx.lineTo(w, -w);
    ctx.lineTo(w, w);
    ctx.lineTo(tabR, w);
    ctx.arc(0, w, tabR, 0, Math.PI, true);
    ctx.lineTo(-w, w);
    ctx.closePath();
  }

  const KIND_DRAWERS = {
    cross(ctx, def, r) {
      if (def.variant === 'maltese') return drawCrossMaltese(ctx, r);
      if (def.variant === 'swiss') return drawCrossSwiss(ctx, r);
      return drawCrossGreek(ctx, r);
    },
    ring: (ctx, def, r) => drawRing(ctx, r),
    gear: (ctx, def, r) => drawGear(ctx, r, def.teeth || 8),
    flower: (ctx, def, r) => drawFlower(ctx, r, def.petals || 6),
    hourglass: (ctx, def, r) => drawHourglass(ctx, r),
    bowtie: (ctx, def, r) => drawBowtie(ctx, r),
    gem: (ctx, def, r) => drawGem(ctx, r),
    spike: (ctx, def, r) => drawSpike(ctx, r),
    clover: (ctx, def, r) => drawClover(ctx, r, def.lobes || 4),
    shield: (ctx, def, r) => drawShield(ctx, r),
    chevron: (ctx, def, r) => drawChevron(ctx, r),
    compass: (ctx, def, r) => drawCompass(ctx, r),
    gearflower: (ctx, def, r) => drawGearFlower(ctx, r),
    puzzle: (ctx, def, r) => drawPuzzle(ctx, r),
  };

  // Novel shapes fill with the evenodd rule (needed for the Ring's hole);
  // it's harmless for the rest since none of their subpaths overlap in a
  // way that changes the result under evenodd vs nonzero.
  function fillRuleFor(def) {
    return def && def.kind ? 'evenodd' : 'nonzero';
  }

  function drawGeometry(ctx, def, radius) {
    ctx.beginPath();
    if (def && def.kind) {
      const drawer = KIND_DRAWERS[def.kind];
      if (drawer) { drawer(ctx, def, radius); return; }
    }
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
        ctx.fill(fillRuleFor(def));
        ctx.strokeStyle = 'rgba(217,169,255,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        drawGeometry(ctx, def, r);
        ctx.fillStyle = s.hitFlash > 0 ? shade(SHAPE_FILL, s.hitFlash) : SHAPE_FILL;
        ctx.fill(fillRuleFor(def));
        ctx.strokeStyle = SHAPE_STROKE;
        ctx.lineWidth = 1;
        ctx.stroke();
        if (def && def.kind === 'gem') {
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.6); ctx.lineTo(0, r);
          ctx.moveTo(-r * 0.5, -r * 0.6); ctx.lineTo(-r, 0);
          ctx.moveTo(r * 0.5, -r * 0.6); ctx.lineTo(r, 0);
          ctx.stroke();
        }
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
