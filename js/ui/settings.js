const SettingsUI = (() => {
  function render(state) {
    const s = state.settings;
    return `
      <div class="panelTitle">Settings</div>
      <div class="panelSubtitle">Tune the feel of your world.</div>

      <div class="card">
        <div class="toggleRow">
          <div>
            <div class="cardTitle">Sound</div>
            <div class="cardDesc">Tap, split, and power sound effects.</div>
          </div>
          <div class="switch ${s.soundOn ? 'on' : ''}" data-toggle="soundOn"><div class="knob"></div></div>
        </div>
        <div class="toggleRow">
          <div style="width:100%;">
            <div class="cardTitle" style="margin-bottom:8px;">Volume</div>
            <input type="range" class="slider" min="0" max="1" step="0.05" value="${s.sfxVolume}" data-slider="sfxVolume">
          </div>
        </div>
      </div>

      <div class="sectionLabel">Performance</div>
      <div class="card">
        <div class="filterRow">
          ${['auto', 'high', 'low'].map(m => `<div class="filterChip ${s.performanceMode === m ? 'active' : ''}" data-perf-mode="${m}">${m[0].toUpperCase() + m.slice(1)}</div>`).join('')}
        </div>
        <div class="cardDesc">Auto keeps the game at 60 FPS by adjusting how many shapes are active. High keeps every shape and effect on. Low prioritizes battery and older devices.</div>
      </div>

      <div class="toggleRow" style="border:none;">
        <div>
          <div class="cardTitle">Reduce Motion</div>
          <div class="cardDesc">Calms shape wobble and particle bursts.</div>
        </div>
        <div class="switch ${s.reduceMotion ? 'on' : ''}" data-toggle="reduceMotion"><div class="knob"></div></div>
      </div>

      <div class="sectionLabel">Data</div>
      <button class="dangerBtn" id="resetProgressBtn">Reset All Progress</button>
    `;
  }

  function handleClick(e, state, ctx) {
    const toggle = e.target.closest('[data-toggle]');
    if (toggle) {
      const key = toggle.dataset.toggle;
      state.settings[key] = !state.settings[key];
      if (key === 'soundOn') AudioSystem.setEnabled(state.settings.soundOn);
      ctx.sound.uiTap();
      ctx.refreshPanel();
      return true;
    }
    const perf = e.target.closest('[data-perf-mode]');
    if (perf) {
      state.settings.performanceMode = perf.dataset.perfMode;
      PerfSystem.setMode(perf.dataset.perfMode);
      ctx.sound.uiTap();
      ctx.refreshPanel();
      return true;
    }
    const reset = e.target.closest('#resetProgressBtn');
    if (reset) {
      if (confirm('Reset all progress? This cannot be undone.')) {
        ctx.hardReset();
      }
      return true;
    }
    return false;
  }

  function handleInput(e, state, ctx) {
    const slider = e.target.closest('[data-slider]');
    if (slider) {
      const key = slider.dataset.slider;
      state.settings[key] = parseFloat(slider.value);
      AudioSystem.setVolume(state.settings[key]);
      return true;
    }
    return false;
  }

  return { render, handleClick, handleInput };
})();
