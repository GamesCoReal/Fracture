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
      base: 0.02, step: 0.006, costBase: 70, costMul: 1.42, max: 80,
      isChance: true, capValue: 0.4,
    },
    {
      id: 'corruption_spawn_rate',
      name: 'Corrupted Spawn Rate',
      desc: 'How often the world naturally spawns extra Corrupted shapes.',
      base: 0, step: 0.08, costBase: 85, costMul: 1.44, max: 70,
    },
    {
      id: 'spawn_rate',
      name: 'World Spawn Rate',
      desc: 'Buy levels to make new shapes appear faster after the world reaches 35 shapes.',
      base: 1.0, step: 0.06, costBase: 60, costMul: 1.4, max: 100,
    },
    {
      id: 'large_bias',
      name: 'Large Shape Bias',
      desc: 'Increases the chance new shapes spawn as Large instead of Small.',
      base: 0.12, step: 0.01, costBase: 65, costMul: 1.42, max: 60,
      isChance: true, capValue: 0.55,
    },
  ],

  getDef(id) { return this.GLOBAL.find(d => d.id === id); },
};
