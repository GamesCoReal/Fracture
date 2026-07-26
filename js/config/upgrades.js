/*
 * UpgradesConfig — global endless upgrades not tied to a specific power/ability.
 * Per-shape spawn-chance upgrades are generated dynamically from ShapeConfig
 * (see ui/research.js) rather than listed here.
 */
const UpgradesConfig = {
  GLOBAL: [
    {
      id: 'corruption_chance',
      name: 'Corruption Chance',
      desc: 'Chance for a spawning Medium or Large shape to be Corrupted.',
      base: 0.02, step: 0.01, costBase: 45, costMul: 1.3, max: 30,
      isChance: true, capValue: 0.4,
    },
    {
      id: 'corruption_spawn_rate',
      name: 'Corrupted Spawn Rate',
      desc: 'How often the world naturally spawns extra Corrupted shapes.',
      base: 0, step: 0.15, costBase: 55, costMul: 1.32, max: 26,
    },
    {
      id: 'spawn_rate',
      name: 'World Spawn Rate',
      desc: 'Buy levels to make new shapes appear faster after the world reaches 35 shapes.',
      base: 1.0, step: 0.12, costBase: 35, costMul: 1.28, max: 30,
    },
    {
      id: 'large_bias',
      name: 'Large Shape Bias',
      desc: 'Increases the chance new shapes spawn as Large instead of Small.',
      base: 0.12, step: 0.02, costBase: 40, costMul: 1.3, max: 20,
      isChance: true, capValue: 0.55,
    },
  ],

  getDef(id) { return this.GLOBAL.find(d => d.id === id); },
};
