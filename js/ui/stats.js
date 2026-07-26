const StatsUI = (() => {
  function fmtTime(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function render(state) {
    const s = state.stats;
    const unlockedCount = Object.keys(state.unlockedShapes).length;
    const rows = [
      ['Total Currency Earned', Math.round(state.totalEarned).toLocaleString()],
      ['Current Currency', Math.round(state.currency).toLocaleString()],
      ['Total Taps', s.totalTaps.toLocaleString()],
      ['Shapes Transformed', s.totalDestroyed.toLocaleString()],
      ['Corrupted Shapes Encountered', s.totalCorruptedEncountered.toLocaleString()],
      ['Chain Lightning Hits', s.chainHits.toLocaleString()],
      ['Shapes Unlocked', `${unlockedCount} / ${ShapeConfig.ALL.length}`],
      ['Powers Owned', `${Object.values(state.powers).filter(p => p.owned).length} / ${PowersConfig.DEFS.length}`],
      ['Abilities Owned', `${Object.values(state.abilities).filter(a => a.owned).length} / ${AbilitiesConfig.DEFS.length}`],
      ['Play Time', fmtTime(s.playTimeSec)],
    ];
    const cards = rows.map(([label, value]) => `
      <div class="card cardRow">
        <div class="cardTitle" style="font-weight:500;">${label}</div>
        <div class="cardTitle">${value}</div>
      </div>`).join('');
    return `
      <div class="panelTitle">Statistics</div>
      <div class="panelSubtitle">A record of your universe so far.</div>
      ${cards}
    `;
  }

  return { render };
})();
