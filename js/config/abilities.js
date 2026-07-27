/*
 * AbilitiesConfig — persistent systems, distinct from tap-triggered Powers.
 */
const AbilitiesConfig = {
  DEFS: [
    {
      id: 'gravity_well',
      name: 'Gravity Well',
      desc: 'Long-press anywhere to anchor a gravity point. Shapes drift and orbit toward it.',
      unlockCost: 320,
      requiredShapes: 6,
      upgrades: {
        strength: { label: 'Pull Strength', base: 18, step: 2, costBase: 75, costMul: 1.5, max: 60 },
        range: { label: 'Range', base: 220, step: 12, costBase: 68, costMul: 1.48, max: 55 },
      },
    },
    {
      id: 'auto_tapper',
      name: 'Auto Tapper',
      desc: 'Automatically taps shapes for you. No passive income exists until purchased.',
      unlockCost: 650,
      requiredShapes: 12,
      upgrades: {
        speed: { label: 'Tap Speed', base: 1.0, step: 0.1, costBase: 90, costMul: 1.52, max: 80, suffix: '/s' },
        count: { label: 'Auto Tappers', base: 1, step: 1, costBase: 320, costMul: 1.95, max: 20 },
        targeting: { label: 'Targeting Precision', base: 0, step: 1, costBase: 120, costMul: 1.45, max: 26 },
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
