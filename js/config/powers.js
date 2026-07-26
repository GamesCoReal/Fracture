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
      unlockCost: 60,
      requiredShapes: 2,
      upgrades: {
        radius: { label: 'Radius', base: 70, step: 14, costBase: 40, costMul: 1.35, max: 26 },
        strength: { label: 'Extra Layer Chance', base: 0, step: 0.04, costBase: 55, costMul: 1.4, max: 20, isChance: true },
      },
    },
    {
      id: 'chain_lightning',
      name: 'Chain Lightning',
      desc: 'Tap a shape to hit it, then arcs to nearby shapes, each losing one layer.',
      unlockCost: 140,
      requiredShapes: 4,
      upgrades: {
        jumps: { label: 'Chain Jumps', base: 2, step: 1, costBase: 60, costMul: 1.5, max: 14 },
        jumpRange: { label: 'Jump Range', base: 90, step: 12, costBase: 45, costMul: 1.35, max: 22 },
      },
    },
    {
      id: 'implosion',
      name: 'Implosion',
      desc: 'Tap pulls nearby shapes inward before releasing a splitting pulse.',
      unlockCost: 320,
      requiredShapes: 7,
      upgrades: {
        pullRadius: { label: 'Pull Radius', base: 100, step: 16, costBase: 70, costMul: 1.35, max: 20 },
        pullStrength: { label: 'Pull Strength', base: 1, step: 0.25, costBase: 65, costMul: 1.4, max: 18 },
      },
    },
    {
      id: 'resonance',
      name: 'Resonance Pulse',
      desc: 'Tap emits a slow expanding ring that keeps splitting shapes as it travels.',
      unlockCost: 700,
      requiredShapes: 10,
      upgrades: {
        speed: { label: 'Ring Speed', base: 220, step: 24, costBase: 90, costMul: 1.35, max: 18 },
        life: { label: 'Ring Lifetime', base: 0.8, step: 0.12, costBase: 85, costMul: 1.35, max: 18 },
      },
    },
  ],

  getDef(id) { return this.DEFS.find(d => d.id === id); },
};
