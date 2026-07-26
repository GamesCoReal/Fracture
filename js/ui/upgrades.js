const UpgradesUI = (() => {
  function globalCost(def, level) {
    return Math.round(def.costBase * Math.pow(def.costMul, level));
  }

  function shapeSpawnCost(def, level) {
    const rarityIdx = Math.max(0, ShapeConfig.rarityOrder.indexOf(def.rarity));
    return Math.round((20 + rarityIdx * 25) * Math.pow(1.22, level));
  }

  function render(state) {
    const globalCards = UpgradesConfig.GLOBAL.map(def => {
      const level = state.globalUpgrades[def.id] || 0;
      const maxed = level >= def.max;
      const cost = globalCost(def, level);
      const value = def.base + def.step * level;
      const display = def.isChance ? `${Math.round(value * 100)}%` : value.toFixed(2);
      return `
        <div class="card">
          <div class="cardRow">
            <div>
              <div class="cardTitle">${def.name}</div>
              <div class="cardDesc">${def.desc}</div>
              <div class="cardMeta">Level ${level}${def.max ? ' / ' + def.max : ''} · current ${display}</div>
            </div>
            <div class="buyBtn ${maxed ? 'owned' : (state.currency < cost ? 'disabled' : '')}" data-global-up="${def.id}">
              ${maxed ? 'MAX' : '◆ ' + cost}
            </div>
          </div>
        </div>`;
    }).join('');

    const unlockedShapeIds = Object.keys(state.unlockedShapes);
    const shapeCards = unlockedShapeIds.map(id => ShapeConfig.getById(id)).filter(Boolean)
      .sort((a, b) => ShapeConfig.rarityOrder.indexOf(a.rarity) - ShapeConfig.rarityOrder.indexOf(b.rarity))
      .map(def => {
        const level = state.shapeSpawnLevel[def.id] || 0;
        const cost = shapeSpawnCost(def, level);
        const maxed = level >= 40;
        return `
          <div class="card">
            <div class="cardRow">
              <div>
                <div class="cardTitle">${def.name} <span class="rarity-${def.rarity}" style="font-size:11px;">● ${def.rarity}</span></div>
                <div class="cardDesc">Increases how often ${def.name} appears in the world.</div>
                <div class="cardMeta">Spawn level ${level}</div>
              </div>
              <div class="buyBtn ${maxed ? 'owned' : (state.currency < cost ? 'disabled' : '')}" data-spawn-up="${def.id}">
                ${maxed ? 'MAX' : '◆ ' + cost}
              </div>
            </div>
          </div>`;
      }).join('');

    return `
      <div class="panelTitle">Upgrades</div>
      <div class="panelSubtitle">Endless improvements. Costs rise with each level.</div>
      <div class="sectionLabel">World</div>
      ${globalCards}
      <div class="sectionLabel">Favorite Shapes</div>
      ${shapeCards || '<div class="cardDesc">Unlock shapes in Research to tune their spawn rate here.</div>'}
    `;
  }

  function handleClick(e, state, ctx) {
    const gbtn = e.target.closest('[data-global-up]');
    if (gbtn) {
      const id = gbtn.dataset.globalUp;
      const def = UpgradesConfig.getDef(id);
      const level = state.globalUpgrades[id] || 0;
      if (level >= def.max) return true;
      const cost = globalCost(def, level);
      if (state.currency < cost) { ctx.sound.error(); return true; }
      state.currency -= cost;
      state.globalUpgrades[id] = level + 1;
      ctx.sound.uiTap();
      ctx.refreshPanel();
      return true;
    }
    const sbtn = e.target.closest('[data-spawn-up]');
    if (sbtn) {
      const id = sbtn.dataset.spawnUp;
      const def = ShapeConfig.getById(id);
      const level = state.shapeSpawnLevel[id] || 0;
      if (level >= 40) return true;
      const cost = shapeSpawnCost(def, level);
      if (state.currency < cost) { ctx.sound.error(); return true; }
      state.currency -= cost;
      state.shapeSpawnLevel[id] = level + 1;
      ctx.sound.uiTap();
      ctx.refreshPanel();
      return true;
    }
    return false;
  }

  return { render, handleClick };
})();
