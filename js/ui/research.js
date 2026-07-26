const ResearchUI = (() => {
  const BRANCH_LABELS = {
    origin: 'Origin', hybrid: 'Hybrids', polygon: 'Polygons', star: 'Stars', 'polygon-deep': 'Deep Polygons',
  };
  const BRANCH_ORDER = ['origin', 'hybrid', 'polygon', 'star', 'polygon-deep'];
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

  function nodeStatus(state, def) {
    if (state.unlockedShapes[def.id]) return 'unlocked';
    if (def.branch === 'origin') {
      if (!state.startedOrigin) return 'choose';
      return state.currency >= nodeCost(state, def) ? 'affordable' : 'locked-cost';
    }
    const parentsOwned = def.parents.every(p => state.unlockedShapes[p]);
    if (!parentsOwned) return 'locked';
    return state.currency >= nodeCost(state, def) ? 'affordable' : 'locked-cost';
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
      const priceLabel = status === 'unlocked' ? 'Owned' : `◆ ${nodeCost(state, def)}`;
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

  function shapeGlyph(def) {
    const r = 20;
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
    if (def.branch !== 'origin' && !def.parents.every(p => state.unlockedShapes[p])) {
      ctx.sound.error();
      return false;
    }
    const cost = nodeCost(state, def);
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
