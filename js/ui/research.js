const ResearchUI = (() => {
  const BRANCH_LABELS = {
    origin: 'Origin', hybrid: 'Hybrids', polygon: 'Polygons', star: 'Stars', 'polygon-deep': 'Deep Polygons', novel: 'Novel Shapes',
  };
  const BRANCH_ORDER = ['origin', 'hybrid', 'polygon', 'star', 'polygon-deep', 'novel'];
  let activeFilter = 'all';
  let layoutCache = null;

  function computeLayout() {
    if (layoutCache) return layoutCache;
    const spacingX = 92, spacingY = 96, padX = 60, padY = 50;
    const positions = {};
    BRANCH_ORDER.forEach((branch, laneIdx) => {
      const nodes = ShapeConfig.ALL.filter(s => s.branch === branch).sort((a, b) => a.level - b.level);
      nodes.forEach((node, i) => {
        positions[node.id] = { x: padX + i * spacingX, y: padY + laneIdx * spacingY, branch };
      });
    });
    let maxX = 0, maxY = 0;
    Object.values(positions).forEach(p => { maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    layoutCache = { positions, width: maxX + padX, height: maxY + padY };
    return layoutCache;
  }

  function nodeCost(state, def) {
    if (def.branch === 'origin') {
      if (state.startedOrigin === def.id) return 0;
      return 150;
    }
    return def.cost;
  }

  function requirementsMet(state, def) {
    if (!def.requirement) return true;
    const req = def.requirement;
    const unlockedCount = Object.keys(state.unlockedShapes).length;
    if (req.minShapes && unlockedCount < req.minShapes) return false;
    if (req.minEarned && state.totalEarned < req.minEarned) return false;
    return true;
  }

  // For the deep polygon chain: lets a player buy a node without owning its
  // immediate predecessor, as long as they own SOME earlier node in that
  // chain (or the chain's root, Icosagon). Cost is multiplied by how many
  // steps are being skipped, so it stays a deliberate, expensive choice
  // rather than a way to avoid the normal path.
  function leapfrogInfo(state, def) {
    if (def.branch !== 'polygon-deep' || def.chainStep === undefined) return null;
    const directParentOwned = def.parents.every(p => state.unlockedShapes[p]);
    if (directParentOwned) return null;
    if (def.chainStep === 0) return null; // first node just needs Icosagon, handled by normal parent check
    let lastOwnedStep = -1;
    for (const other of ShapeConfig.ALL) {
      if (other.branch === 'polygon-deep' && other.chainStep !== undefined && other.chainStep < def.chainStep) {
        if (state.unlockedShapes[other.id]) lastOwnedStep = Math.max(lastOwnedStep, other.chainStep);
      }
    }
    if (lastOwnedStep < 0) return null;
    const skipped = def.chainStep - lastOwnedStep - 1;
    if (skipped <= 0) return null;
    const premiumMul = 1 + skipped * 0.5;
    return { skipped, cost: Math.round(nodeCost(state, def) * premiumMul) };
  }

  function nodeStatus(state, def) {
    if (state.unlockedShapes[def.id]) return 'unlocked';
    if (def.branch === 'origin') {
      if (!state.startedOrigin) return 'choose';
      return state.currency >= nodeCost(state, def) ? 'affordable' : 'locked-cost';
    }
    const parentsOwned = def.parents.every(p => state.unlockedShapes[p]);
    const leapfrog = !parentsOwned ? leapfrogInfo(state, def) : null;
    if (!parentsOwned && !leapfrog) return 'locked';
    if (!requirementsMet(state, def)) return 'locked-requirement';
    const cost = leapfrog ? leapfrog.cost : nodeCost(state, def);
    return state.currency >= cost ? 'affordable' : 'locked-cost';
  }

  function render(state) {
    if (!state.startedOrigin) {
      return renderOriginPicker(state);
    }
    const layout = computeLayout();
    const unlockedCount = Object.keys(state.unlockedShapes).length;

    let filterChips = ['all', ...BRANCH_ORDER].map(f => {
      const label = f === 'all' ? 'All' : BRANCH_LABELS[f];
      return `<div class="filterChip ${activeFilter === f ? 'active' : ''}" data-filter="${f}">${label}</div>`;
    }).join('');

    let svgNodes = '', svgEdges = '';
    const visibleShapeIds = new Set(ShapeConfig.ALL
      .filter(def => activeFilter === 'all' || def.branch === activeFilter)
      .map(def => def.id));
    ShapeConfig.ALL.forEach(def => {
      if (!visibleShapeIds.has(def.id)) return;
      const pos = layout.positions[def.id];
      if (!pos) return;
      def.parents.forEach(pid => {
        if (!visibleShapeIds.has(pid)) return;
        const ppos = layout.positions[pid];
        if (!ppos) return;
        svgEdges += `<path class="rt-edge" d="M${ppos.x},${ppos.y} C${(ppos.x+pos.x)/2},${ppos.y} ${(ppos.x+pos.x)/2},${pos.y} ${pos.x},${pos.y}"/>`;
      });
    });

    ShapeConfig.ALL.forEach(def => {
      const pos = layout.positions[def.id];
      if (!pos) return;
      if (!visibleShapeIds.has(def.id)) return;
      const status = nodeStatus(state, def);
      const discovered = state.encounteredShapes[def.id] && status !== 'unlocked';
      let cls = 'locked';
      if (status === 'unlocked') cls = 'unlocked';
      else if (status === 'affordable' || status === 'choose') cls = 'affordable';
      const r = 22;
      const leapfrog = status !== 'unlocked' ? leapfrogInfo(state, def) : null;
      let priceLabel;
      if (status === 'unlocked') priceLabel = 'Owned';
      else if (status === 'locked-requirement') {
        const req = def.requirement;
        priceLabel = req.minShapes ? `Need ${req.minShapes} shapes` : `Need ◆${req.minEarned} earned`;
      } else if (leapfrog) priceLabel = `⇒ ◆ ${leapfrog.cost}`;
      else priceLabel = `◆ ${nodeCost(state, def)}`;
      svgNodes += `
        <g class="rt-node" data-shape="${def.id}" transform="translate(${pos.x},${pos.y})">
          <circle class="rt-node-bg ${cls}" r="${r}" stroke-width="${discovered ? 2.4 : 1.4}" ${discovered ? 'stroke="#c98bff"' : ''}></circle>
          <g transform="scale(0.62)" class="rt-shape-wrap" opacity="${status === 'locked' ? 0.35 : 1}">${shapeGlyph(def)}</g>
          <text class="rt-label" y="${r + 12}" text-anchor="middle">${def.name}</text>
          <text class="rt-cost ${status === 'unlocked' ? 'owned' : ''}" y="${r + 23}" text-anchor="middle">${priceLabel}</text>
        </g>`;
    });

    return `
      <div class="panelTitle">Research</div>
      <div class="panelSubtitle">${unlockedCount} / ${ShapeConfig.ALL.length} shapes unlocked. Pinch or drag to explore the tree.</div>
      <div class="filterRow">${filterChips}</div>
      <div id="researchTreeWrap" style="height:52vh;">
        <svg id="researchTreeSvg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
          <g>${svgEdges}${svgNodes}</g>
        </svg>
      </div>
      <div id="shapeDetailCard"></div>
    `;
  }

  const KIND_GLYPHS = {
    cross: (r) => { const a = r * 0.34; const pts = [[a,a],[a,r],[-a,r],[-a,a],[-r,a],[-r,-a],[-a,-a],[-a,-r],[a,-r],[a,-a],[r,-a],[r,a]]; return `M${pts.map(p => p.join(',')).join(' L')} Z`; },
    ring: (r) => `M${r},0 A${r},${r} 0 1,0 ${-r},0 A${r},${r} 0 1,0 ${r},0 M${r*0.55},0 A${r*0.55},${r*0.55} 0 1,1 ${-r*0.55},0 A${r*0.55},${r*0.55} 0 1,1 ${r*0.55},0`,
    hourglass: (r) => { const w = r*0.6; return `M${-w},${-r} L${w},${-r} L${-w},${r} L${w},${r} Z`; },
    bowtie: (r) => { const w = r, h = r*0.6; return `M${-w},${-h} L${-w},${h} L${w},${-h} L${w},${h} Z`; },
    spike: (r) => `M0,${-r} L${r*0.35},0 L0,${r} L${-r*0.35},0 Z`,
    gem: (r) => `M${-r*0.5},${-r*0.6} L${r*0.5},${-r*0.6} L${r},0 L0,${r} L${-r},0 Z`,
    shield: (r) => `M${-r*0.85},${-r*0.4} Q${-r*0.85},${-r} 0,${-r} Q${r*0.85},${-r} ${r*0.85},${-r*0.4} L${r*0.85},${r*0.15} Q${r*0.85},${r*0.6} 0,${r} Q${-r*0.85},${r*0.6} ${-r*0.85},${r*0.15} Z`,
    chevron: (r) => `M${-r},${-r*0.8} L0,${-r*0.55} L${r},${-r*0.8} L${r},${-r*0.35} L0,${r} L${-r},${-r*0.35} Z`,
    clover: (r) => { const lobeR = r*0.55, dist = r*0.5; let d = ''; for (let i=0;i<4;i++){ const a=(Math.PI*2*i)/4 - Math.PI/2; const cx=Math.cos(a)*dist, cy=Math.sin(a)*dist; d += `M${cx+lobeR},${cy} A${lobeR},${lobeR} 0 1,0 ${cx-lobeR},${cy} A${lobeR},${lobeR} 0 1,0 ${cx+lobeR},${cy} `; } return d; },
    gear: (r) => { const inner=r*0.75, teeth=8, step=(Math.PI*2)/teeth; let d=''; for(let i=0;i<teeth;i++){ const a0=i*step, mid=a0+step/2, tw=step*0.5; const p1a=mid-tw/2, p1b=mid+tw/2; const ix=Math.cos(a0)*inner, iy=Math.sin(a0)*inner; const ox0=Math.cos(p1a)*r, oy0=Math.sin(p1a)*r; const ox1=Math.cos(p1b)*r, oy1=Math.sin(p1b)*r; d += `${i===0?'M':'L'}${ix},${iy} L${ox0},${oy0} L${ox1},${oy1} `; } return d + 'Z'; },
    flower: (r) => { const petals=6, step=(Math.PI*2)/petals; let d='M0,0 '; for(let i=0;i<petals;i++){ const a=i*step; const tipX=Math.cos(a)*r, tipY=Math.sin(a)*r; const c1a=a-step*0.28, c2a=a+step*0.28; const c1x=Math.cos(c1a)*r*0.55, c1y=Math.sin(c1a)*r*0.55; const c2x=Math.cos(c2a)*r*0.55, c2y=Math.sin(c2a)*r*0.55; d += `Q${c1x},${c1y} ${tipX},${tipY} Q${c2x},${c2y} 0,0 `; } return d + 'Z'; },
    compass: (r) => { const inner=r*0.22, n=4; let d=''; for(let i=0;i<n;i++){ const a=(Math.PI*2*i)/n - Math.PI/2; const tipX=Math.cos(a)*r, tipY=Math.sin(a)*r; const midA=a+Math.PI/n; const cx=Math.cos(midA)*inner, cy=Math.sin(midA)*inner; d += `${i===0?'M':'L'}${tipX},${tipY} Q${cx*0.6},${cy*0.6} ${cx},${cy} `; } return d + 'Z'; },
    gearflower: (r) => { const waves=10, amp=r*0.12, steps=waves*2; let d=''; for(let i=0;i<=steps;i++){ const a=(Math.PI*2*i)/steps; const rr=r+Math.sin(a*waves)*amp; d += `${i===0?'M':'L'}${Math.cos(a)*rr},${Math.sin(a)*rr} `; } return d + 'Z'; },
    puzzle: (r) => { const w=r, tabR=r*0.28; return `M${-w},${-w} L${-tabR},${-w} A${tabR},${tabR} 0 0,0 ${tabR},${-w} L${w},${-w} L${w},${w} L${tabR},${w} A${tabR},${tabR} 0 0,0 ${-tabR},${w} L${-w},${w} Z`; },
  };

  function shapeGlyph(def) {
    const r = 20;
    if (def.kind) {
      const gen = KIND_GLYPHS[def.kind];
      if (gen) {
        const fillRule = def.kind === 'ring' ? ' fill-rule="evenodd"' : '';
        return `<path d="${gen(r)}" class="rt-shape"${fillRule}></path>`;
      }
    }
    if (def.sides === 0) return `<circle r="${r}" class="rt-shape"></circle>`;
    if (def.star) {
      const inner = r * (def.starInner || 0.5);
      const pts = def.sides * 2;
      let d = '';
      for (let i = 0; i < pts; i++) {
        const rr = i % 2 === 0 ? r : inner;
        const a = (Math.PI * 2 * i) / pts - Math.PI / 2;
        d += `${i === 0 ? 'M' : 'L'}${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)} `;
      }
      return `<path d="${d}Z" class="rt-shape"></path>`;
    }
    let d = '';
    for (let i = 0; i < def.sides; i++) {
      const a = (Math.PI * 2 * i) / def.sides - Math.PI / 2;
      d += `${i === 0 ? 'M' : 'L'}${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)} `;
    }
    return `<path d="${d}Z" class="rt-shape"></path>`;
  }

  function renderOriginPicker(state) {
    const opts = ShapeConfig.ORIGIN_IDS.map(id => {
      const def = ShapeConfig.getById(id);
      return `
        <div class="card" data-origin-pick="${id}" style="text-align:center;">
          <svg width="72" height="72" viewBox="-24 -24 48 48">${shapeGlyph(def)}</svg>
          <div class="cardTitle" style="margin-top:6px;">${def.name}</div>
          <div class="cardMeta">Price: Free</div>
          <div class="buyBtn" style="margin:10px auto 0;">Begin with ${def.name}</div>
        </div>`;
    }).join('');
    return `
      <div class="panelTitle">Choose your origin</div>
      <div class="panelSubtitle">Every world starts from one shape. The other two remain reachable later, at a cost.</div>
      <div style="display:flex; gap:8px;">${opts}</div>
    `;
  }

  function purchaseShape(state, shapeId, ctx) {
    const def = ShapeConfig.getById(shapeId);
    if (!def) return false;
    if (state.unlockedShapes[shapeId]) return false;
    let cost = nodeCost(state, def);
    if (def.branch !== 'origin') {
      const parentsOwned = def.parents.every(p => state.unlockedShapes[p]);
      if (!parentsOwned) {
        const leapfrog = leapfrogInfo(state, def);
        if (!leapfrog) { ctx.sound.error(); return false; }
        cost = leapfrog.cost;
      }
      if (!requirementsMet(state, def)) { ctx.sound.error(); return false; }
    }
    if (state.currency < cost) { ctx.sound.error(); return false; }
    state.currency -= cost;
    state.unlockedShapes[shapeId] = true;
    delete state.encounteredShapes[shapeId];
    ctx.sound.unlockChime();
    return true;
  }

  function selectOrigin(state, shapeId, ctx) {
    if (state.startedOrigin) return false;
    state.startedOrigin = shapeId;
    state.unlockedShapes[shapeId] = true;
    ctx.sound.unlockChime();
    return true;
  }

  function handleClick(e, state, ctx) {
    const pick = e.target.closest('[data-origin-pick]');
    if (pick) {
      selectOrigin(state, pick.dataset.originPick, ctx);
      ctx.refreshPanel();
      return true;
    }
    const chip = e.target.closest('[data-filter]');
    if (chip) {
      activeFilter = chip.dataset.filter;
      ctx.refreshPanel();
      return true;
    }
    const node = e.target.closest('[data-shape]');
    if (node) {
      const shapeId = node.dataset.shape;
      const def = ShapeConfig.getById(shapeId);
      const status = nodeStatus(state, def);
      if (status === 'unlocked') { ctx.refreshPanel(); return true; }
      const ok = purchaseShape(state, shapeId, ctx);
      ctx.refreshPanel();
      return true;
    }
    return false;
  }

  return { render, handleClick, nodeCost, nodeStatus };
})();
