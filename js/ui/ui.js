const UI = (() => {
  let activeTab = null;
  let els = {};
  let stateRef = null;
  let ctxRef = null;

  const PANELS = {
    upgrades: UpgradesUI,
    research: ResearchUI,
    powers: PowersUI,
    stats: StatsUI,
    settings: SettingsUI,
  };

  function init(state, ctx) {
    stateRef = state;
    ctxRef = ctx;
    els.currencyValue = document.getElementById('currencyValue');
    els.currencyRate = document.getElementById('currencyRate');
    els.panelSheet = document.getElementById('panelSheet');
    els.panelContent = document.getElementById('panelContent');
    els.panelHandle = document.getElementById('panelHandle');
    els.navTabs = document.querySelectorAll('.navTab');
    els.badge = document.getElementById('activePowerBadge');
    els.floatLayer = document.getElementById('floatingTextLayer');
    els.emptyHint = document.getElementById('emptyStateHint');

    els.navTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        AudioSystem.unlock();
        if (activeTab === tab) {
          closePanel();
        } else {
          openPanel(tab);
        }
      });
    });

    els.panelContent.addEventListener('click', (e) => onPanelClick(e));
    els.panelContent.addEventListener('input', (e) => onPanelInput(e));
    els.panelHandle.addEventListener('click', () => closePanel());
    els.badge.addEventListener('click', () => openPanel('powers'));

    refreshCurrency(state);
    refreshBadge(state);
  }

  function openPanel(tab) {
    activeTab = tab;
    els.panelSheet.classList.remove('hidden');
    els.navTabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    renderPanel();
  }

  function closePanel() {
    activeTab = null;
    els.panelSheet.classList.add('hidden');
    els.navTabs.forEach(b => b.classList.remove('active'));
  }

  function renderPanel() {
    if (!activeTab) return;
    const mod = PANELS[activeTab];
    els.panelContent.innerHTML = mod.render(stateRef);
  }

  function onPanelClick(e) {
    if (!activeTab) return;
    const mod = PANELS[activeTab];
    if (mod.handleClick) mod.handleClick(e, stateRef, panelCtx());
  }

  function onPanelInput(e) {
    if (!activeTab) return;
    const mod = PANELS[activeTab];
    if (mod.handleInput) mod.handleInput(e, stateRef, panelCtx());
  }

  function panelCtx() {
    return {
      sound: {
        uiTap: () => AudioSystem.uiTap(),
        error: () => AudioSystem.error(),
        unlockChime: () => AudioSystem.unlockChime(),
      },
      refreshPanel: () => { renderPanel(); refreshCurrency(stateRef); },
      refreshBadge: () => refreshBadge(stateRef),
      hardReset: () => ctxRef.hardReset(),
    };
  }

  function refreshCurrency(state) {
    els.currencyValue.textContent = formatNum(Math.floor(state.currency));
  }

  function refreshBadge(state) {
    if (state.activePower) {
      const def = PowersConfig.getDef(state.activePower);
      els.badge.textContent = `✦ ${def.name}`;
      els.badge.classList.remove('hidden');
    } else {
      els.badge.classList.add('hidden');
    }
  }

  function refreshRate(currencyPerSec) {
    els.currencyRate.textContent = currencyPerSec > 0.05 ? `+${formatNum(currencyPerSec)}/s` : '';
  }

  function setEmptyHint(show) {
    els.emptyHint.classList.toggle('hidden', !show);
  }

  function formatDecimal(n, maxDigits = 2) {
    return Number(n.toFixed(maxDigits)).toString();
  }

  function formatNum(n) {
    if (n < 1000) return formatDecimal(n);
    const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
    let u = 0;
    while (n >= 1000 && u < units.length - 1) { n /= 1000; u++; }
    const digits = n < 10 ? 2 : n < 100 ? 1 : 0;
    return formatDecimal(n, digits) + units[u];
  }

  function spawnFloatText(x, y, text, corrupted) {
    const el = document.createElement('div');
    el.className = 'floatText' + (corrupted ? ' corrupt' : '');
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.textContent = text;
    els.floatLayer.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function isPanelOpen() { return !!activeTab; }

  return { init, openPanel, closePanel, renderPanel, refreshCurrency, refreshBadge, refreshRate, setEmptyHint, spawnFloatText, formatDecimal, formatNum, isPanelOpen };
})();
