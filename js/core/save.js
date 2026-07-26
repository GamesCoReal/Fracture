const SaveSystem = (() => {
  const KEY = 'drift_save_v1';

  function defaultState() {
    return {
      version: 1,
      currency: 0,
      totalEarned: 0,
      startedOrigin: null, // circle | triangle | square
      unlockedShapes: {}, // id -> true
      encounteredShapes: {}, // discovered via corruption but not unlocked
      shapeSpawnLevel: {}, // id -> int level (spawn-chance upgrade)
      powers: {}, // id -> { owned, level:{upId:int} }
      activePower: null,
      abilities: {}, // id -> { owned, level:{upId:int} }
      gravityWell: { x: 0.5, y: 0.4, placed: false },
      autoTapper: { priority: 'closest', custom: [] },
      globalUpgrades: {}, // id -> int level
      stats: {
        totalTaps: 0,
        totalDestroyed: 0,
        totalCorruptedEncountered: 0,
        chainHits: 0,
        playTimeSec: 0,
        createdAt: Date.now(),
      },
      settings: {
        soundOn: true,
        sfxVolume: 0.7,
        performanceMode: 'auto', // auto | high | low
        reduceMotion: false,
      },
      lastSaveTime: Date.now(),
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // shallow-merge with defaults to survive future field additions
      const def = defaultState();
      const merged = Object.assign({}, def, parsed);
      merged.stats = Object.assign({}, def.stats, parsed.stats || {});
      merged.settings = Object.assign({}, def.settings, parsed.settings || {});
      merged.gravityWell = Object.assign({}, def.gravityWell, parsed.gravityWell || {});
      merged.autoTapper = Object.assign({}, def.autoTapper, parsed.autoTapper || {});
      return merged;
    } catch (e) {
      console.warn('Save load failed, starting fresh', e);
      return defaultState();
    }
  }

  let saveTimer = null;
  function save(state) {
    state.lastSaveTime = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Save failed', e);
    }
  }

  function saveDebounced(state, delay = 800) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => save(state), delay);
  }

  function hardReset() {
    localStorage.removeItem(KEY);
  }

  return { load, save, saveDebounced, hardReset, defaultState };
})();
