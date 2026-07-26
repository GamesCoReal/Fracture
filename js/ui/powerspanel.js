const PowersUI = (() => {
  function upCost(up, level) { return Math.round(up.costBase * Math.pow(up.costMul, level)); }

  function ownedShapeCount(state) {
    return Object.keys(state.unlockedShapes).length;
  }

  function meetsShapeRequirement(state, def) {
    return ownedShapeCount(state) >= (def.requiredShapes || 0);
  }

  function requirementMeta(state, def, owned) {
    if (!def.requiredShapes) return '';
    const count = ownedShapeCount(state);
    const met = count >= def.requiredShapes;
    const label = owned ? `Unlocked after owning ${def.requiredShapes} shapes` : `Own ${def.requiredShapes} shapes · ${count}/${def.requiredShapes}`;
    return `<div class="cardMeta requirement ${met ? 'met' : ''}">${label}</div>`;
  }

  function renderPowerCard(state, def) {
    const owned = !!(state.powers[def.id] && state.powers[def.id].owned);
    const isActive = state.activePower === def.id;
    const requirementMet = meetsShapeRequirement(state, def);
    let body = `
      <div class="cardRow">
        <div>
          <div class="cardTitle">${def.name}</div>
          <div class="cardDesc">${def.desc}</div>
          ${requirementMeta(state, def, owned)}
        </div>
        ${owned
          ? `<div class="buyBtn ${isActive ? 'active-state' : ''}" data-select-power="${def.id}">${isActive ? 'Active' : 'Select'}</div>`
          : `<div class="buyBtn ${!requirementMet || state.currency < def.unlockCost ? 'disabled' : ''}" data-unlock-power="${def.id}">${requirementMet ? '◆ ' + def.unlockCost : 'Locked'}</div>`}
      </div>`;

    if (owned) {
      const upRows = Object.entries(def.upgrades).map(([upId, up]) => {
        const level = (state.powers[def.id].level && state.powers[def.id].level[upId]) || 0;
        const maxed = level >= up.max;
        const cost = upCost(up, level);
        const value = up.base + up.step * level;
        const display = up.isChance ? `${Math.round(value * 100)}%` : UI.formatDecimal(value);
        return `
          <div class="cardRow" style="margin-top:8px;">
            <div class="cardDesc">${up.label} · Lv ${level}${maxed ? '' : ''} <span style="color:var(--text-primary)">(${display}${up.suffix || ''})</span></div>
            <div class="buyBtn ${maxed ? 'owned' : (state.currency < cost ? 'disabled' : '')}" data-power-up="${def.id}:${upId}" style="min-width:64px; padding:6px 10px; font-size:11.5px;">
              ${maxed ? 'MAX' : '◆ ' + cost}
            </div>
          </div>`;
      }).join('');
      body += `<div style="margin-top:4px;">${upRows}</div>`;
    }
    return `<div class="card">${body}</div>`;
  }

  function renderAbilityCard(state, def) {
    const owned = !!(state.abilities[def.id] && state.abilities[def.id].owned);
    const requirementMet = meetsShapeRequirement(state, def);
    let body = `
      <div class="cardRow">
        <div>
          <div class="cardTitle">${def.name}</div>
          <div class="cardDesc">${def.desc}</div>
          ${requirementMeta(state, def, owned)}
        </div>
        ${owned
          ? `<div class="buyBtn owned">Owned</div>`
          : `<div class="buyBtn ${!requirementMet || state.currency < def.unlockCost ? 'disabled' : ''}" data-unlock-ability="${def.id}">${requirementMet ? '◆ ' + def.unlockCost : 'Locked'}</div>`}
      </div>`;
    if (owned) {
      const upRows = Object.entries(def.upgrades).map(([upId, up]) => {
        const level = (state.abilities[def.id].level && state.abilities[def.id].level[upId]) || 0;
        const maxed = level >= up.max;
        const cost = upCost(up, level);
        const value = up.base + up.step * level;
        return `
          <div class="cardRow" style="margin-top:8px;">
            <div class="cardDesc">${up.label} · Lv ${level} <span style="color:var(--text-primary)">(${UI.formatDecimal(value)}${up.suffix || ''})</span></div>
            <div class="buyBtn ${maxed ? 'owned' : (state.currency < cost ? 'disabled' : '')}" data-ability-up="${def.id}:${upId}" style="min-width:64px; padding:6px 10px; font-size:11.5px;">
              ${maxed ? 'MAX' : '◆ ' + cost}
            </div>
          </div>`;
      }).join('');
      body += `<div style="margin-top:4px;">${upRows}</div>`;
      if (def.id === 'auto_tapper') body += renderAutoTapperSettings(state);
      if (def.id === 'gravity_well') body += `<div class="cardDesc" style="margin-top:8px;">Long-press anywhere in the world to move the anchor.</div>`;
    }
    return `<div class="card">${body}</div>`;
  }

  function renderAutoTapperSettings(state) {
    const rows = AbilitiesConfig.PRIORITY_MODES.map(m => `
      <div class="priorityItem ${state.autoTapper.priority === m.id ? 'selected' : ''}" data-priority="${m.id}">
        <span>${m.label}</span>${state.autoTapper.priority === m.id ? '<span>✓</span>' : ''}
      </div>`).join('');

    let customRow = '';
    if (state.autoTapper.priority === 'custom') {
      const chips = Object.keys(state.unlockedShapes).map(id => {
        const def = ShapeConfig.getById(id);
        if (!def) return '';
        const idx = state.autoTapper.custom.indexOf(id);
        return `<div class="filterChip ${idx >= 0 ? 'active' : ''}" data-custom-shape="${id}">${idx >= 0 ? (idx + 1) + '. ' : ''}${def.name}</div>`;
      }).join('');
      customRow = `<div class="cardDesc" style="margin-top:8px;">Tap shapes in the order you want them prioritized:</div><div class="filterRow" style="flex-wrap:wrap; margin-top:6px;">${chips}</div>`;
    }

    return `<div class="sectionLabel" style="margin-top:14px;">Targeting Priority</div><div class="priorityList">${rows}</div>${customRow}`;
  }

  function render(state) {
    const powers = PowersConfig.DEFS.map(d => renderPowerCard(state, d)).join('');
    const abilities = AbilitiesConfig.DEFS.map(d => renderAbilityCard(state, d)).join('');
    const noneActive = !state.activePower;
    return `
      <div class="panelTitle">Powers</div>
      <div class="panelSubtitle">One power active at a time — it changes what your tap does.</div>
      <div class="card">
        <div class="cardRow">
          <div class="cardTitle">No Power (plain tap)</div>
          <div class="buyBtn ${noneActive ? 'active-state' : ''}" data-select-power="none">${noneActive ? 'Active' : 'Select'}</div>
        </div>
      </div>
      ${powers}
      <div class="sectionLabel">Abilities</div>
      ${abilities}
    `;
  }

  function handleClick(e, state, ctx) {
    const unlockP = e.target.closest('[data-unlock-power]');
    if (unlockP) {
      const id = unlockP.dataset.unlockPower;
      const def = PowersConfig.getDef(id);
      if (meetsShapeRequirement(state, def) && state.currency >= def.unlockCost && !(state.powers[id] && state.powers[id].owned)) {
        state.currency -= def.unlockCost;
        state.powers[id] = { owned: true, level: {} };
        state.activePower = id;
        ctx.sound.unlockChime();
      } else ctx.sound.error();
      ctx.refreshPanel();
      return true;
    }
    const selP = e.target.closest('[data-select-power]');
    if (selP) {
      state.activePower = selP.dataset.selectPower === 'none' ? null : selP.dataset.selectPower;
      ctx.sound.uiTap();
      ctx.refreshPanel();
      ctx.refreshBadge();
      return true;
    }
    const upP = e.target.closest('[data-power-up]');
    if (upP) {
      const [id, upId] = upP.dataset.powerUp.split(':');
      const def = PowersConfig.getDef(id);
      const up = def.upgrades[upId];
      const g = state.powers[id];
      const level = (g.level && g.level[upId]) || 0;
      if (level < up.max) {
        const cost = upCost(up, level);
        if (state.currency >= cost) {
          state.currency -= cost;
          g.level = g.level || {};
          g.level[upId] = level + 1;
          ctx.sound.uiTap();
        } else ctx.sound.error();
      }
      ctx.refreshPanel();
      return true;
    }
    const unlockA = e.target.closest('[data-unlock-ability]');
    if (unlockA) {
      const id = unlockA.dataset.unlockAbility;
      const def = AbilitiesConfig.getDef(id);
      if (meetsShapeRequirement(state, def) && state.currency >= def.unlockCost && !(state.abilities[id] && state.abilities[id].owned)) {
        state.currency -= def.unlockCost;
        state.abilities[id] = { owned: true, level: {} };
        ctx.sound.unlockChime();
      } else ctx.sound.error();
      ctx.refreshPanel();
      return true;
    }
    const upA = e.target.closest('[data-ability-up]');
    if (upA) {
      const [id, upId] = upA.dataset.abilityUp.split(':');
      const def = AbilitiesConfig.getDef(id);
      const up = def.upgrades[upId];
      const g = state.abilities[id];
      const level = (g.level && g.level[upId]) || 0;
      if (level < up.max) {
        const cost = upCost(up, level);
        if (state.currency >= cost) {
          state.currency -= cost;
          g.level = g.level || {};
          g.level[upId] = level + 1;
          ctx.sound.uiTap();
        } else ctx.sound.error();
      }
      ctx.refreshPanel();
      return true;
    }
    const prio = e.target.closest('[data-priority]');
    if (prio) {
      state.autoTapper.priority = prio.dataset.priority;
      ctx.sound.uiTap();
      ctx.refreshPanel();
      return true;
    }
    const customShape = e.target.closest('[data-custom-shape]');
    if (customShape) {
      const id = customShape.dataset.customShape;
      const idx = state.autoTapper.custom.indexOf(id);
      if (idx >= 0) state.autoTapper.custom.splice(idx, 1);
      else state.autoTapper.custom.push(id);
      ctx.sound.uiTap();
      ctx.refreshPanel();
      return true;
    }
    return false;
  }

  return { render, handleClick };
})();
