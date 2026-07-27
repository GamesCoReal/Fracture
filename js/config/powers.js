/*
 * PowersConfig — powers trigger on tap. Only one can be "active" at a time,
 * selected from the Powers panel. Plain taps (no power active) just hit the
 * single shape under the finger.
 */
const PowersConfig = {
  DEFS: [
    {
      id: 'shockwave',
      name: 'Shockwave',
      desc: 'Every tap sends a ring outward. Shapes it touches lose one layer.',
      unlockCost: 90,
      requiredShapes: 4,
      upgrades: {
        radius: { label: 'Radius', base: 70, step: 8, costBase: 65, costMul: 1.48, max: 70 },
        strength: { label: 'Extra Layer Chance', base: 0, step: 0.015, costBase: 85, costMul: 1.52, max: 55, isChance: true },
      },
    },
    {
      id: 'chain_lightning',
      name: 'Chain Lightning',
      desc: 'Tap a shape to hit it, then arcs to nearby shapes, each losing one layer.',
      unlockCost: 220,
      requiredShapes: 8,
      upgrades: {
        jumps: { label: 'Chain Jumps', base: 2, step: 1, costBase: 90, costMul: 1.58, max: 34 },
        jumpRange: { label: 'Jump Range', base: 90, step: 7, costBase: 70, costMul: 1.48, max: 55 },
      },
    },
    {
      id: 'implosion',
      name: 'Implosion',
      desc: 'Tap pulls nearby shapes inward before releasing a splitting pulse.',
      unlockCost: 520,
      requiredShapes: 14,
      upgrades: {
        pullRadius: { label: 'Pull Radius', base: 100, step: 9, costBase: 105, costMul: 1.5, max: 50 },
        pullStrength: { label: 'Pull Strength', base: 1, step: 0.12, costBase: 95, costMul: 1.52, max: 45 },
      },
    },
    {
      id: 'resonance',
      name: 'Resonance Pulse',
      desc: 'Tap emits a slow expanding ring that keeps splitting shapes as it travels.',
      unlockCost: 1100,
      requiredShapes: 22,
      upgrades: {
        speed: { label: 'Ring Speed', base: 220, step: 12, costBase: 130, costMul: 1.5, max: 45 },
        life: { label: 'Ring Lifetime', base: 0.8, step: 0.06, costBase: 120, costMul: 1.5, max: 45 },
      },
    },
  ],

  getDef(id) { return this.DEFS.find(d => d.id === id); },
};
