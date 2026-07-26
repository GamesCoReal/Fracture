/*
 * AbilitiesConfig — persistent systems, distinct from tap-triggered Powers.
 */
const AbilitiesConfig = {
  DEFS: [
    {
      id: 'gravity_well',
      name: 'Gravity Well',
      desc: 'Long-press anywhere to anchor a gravity point. Shapes drift and orbit toward it.',
      unlockCost: 200,
      requiredShapes: 3,
      upgrades: {
        strength: { label: 'Pull Strength', base: 18, step: 4, costBase: 50, costMul: 1.35, max: 24 },
        range: { label: 'Range', base: 220, step: 24, costBase: 45, costMul: 1.32, max: 22 },
      },
    },
    {
      id: 'auto_tapper',
      name: 'Auto Tapper',
      desc: 'Automatically taps shapes for you. No passive income exists until purchased.',
      unlockCost: 400,
      requiredShapes: 6,
      upgrades: {
        speed: { label: 'Tap Speed', base: 1.0, step: 0.22, costBase: 60, costMul: 1.38, max: 30, suffix: '/s' },
        count: { label: 'Auto Tappers', base: 1, step: 1, costBase: 220, costMul: 1.8, max: 8 },
        targeting: { label: 'Targeting Precision', base: 0, step: 1, costBase: 80, costMul: 1.3, max: 10 },
      },
    },
  ],

  PRIORITY_MODES: [
    { id: 'closest', label: 'Closest First' },
    { id: 'largest', label: 'Largest First' },
    { id: 'smallest', label: 'Smallest First' },
    { id: 'corrupted', label: 'Corrupted First' },
    { id: 'rarity', label: 'Highest Rarity First' },
    { id: 'custom', label: 'Custom Shape Priority' },
  ],

  getDef(id) { return this.DEFS.find(d => d.id === id); },
};
