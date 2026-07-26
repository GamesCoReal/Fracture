/*
 * ShapeConfig — builds the full shape research tree.
 *
 * Every shape node: {
 *   id, name, sides (0 = circle), star (bool), starInner (0..1 ratio),
 *   rounded (0..1 corner rounding for hybrid "soft" shapes),
 *   parents: [ids] (must own ALL parents to unlock; empty = independent root),
 *   branch: string (for research-tree filter chips / layout column),
 *   level: int (unlock-order depth, drives cost + rarity),
 *   cost: number,
 *   rarity: 'common'|'uncommon'|'rare'|'epic'|'legendary'
 * }
 */
const ShapeConfig = (() => {
  const NAMED = [
    null, null, null, 'Triangle', 'Square', 'Pentagon', 'Hexagon', 'Heptagon',
    'Octagon', 'Enneagon', 'Decagon', 'Hendecagon', 'Dodecagon', 'Tridecagon',
    'Tetradecagon', 'Pentadecagon', 'Hexadecagon', 'Heptadecagon', 'Octadecagon',
    'Enneadecagon', 'Icosagon'
  ];

  function nameForSides(n) {
    if (NAMED[n]) return NAMED[n];
    return `${n}-Gon`;
  }

  function rarityForLevel(level) {
    if (level <= 3) return 'common';
    if (level <= 9) return 'uncommon';
    if (level <= 22) return 'rare';
    if (level <= 45) return 'epic';
    return 'legendary';
  }

  function costForLevel(level, branchMultiplier = 1) {
    return Math.round(10 * Math.pow(1.24, level) * branchMultiplier);
  }

  function build() {
    const shapes = [];
    const byId = {};
    let autoId = 0;
    function add(node) {
      node.id = node.id || `s_${autoId++}`;
      node.rarity = node.rarity || rarityForLevel(node.level);
      node.cost = node.cost || costForLevel(node.level, node.costMul || 1);
      shapes.push(node);
      byId[node.id] = node;
      return node;
    }

    // --- Origin trio: player picks one to start, other two purchasable early ---
    const circle = add({ id: 'circle', name: 'Circle', sides: 0, parents: [], branch: 'origin', level: 0, cost: 0 });
    const triangle = add({ id: 'triangle', name: 'Triangle', sides: 3, parents: [], branch: 'origin', level: 0, cost: 0 });
    const square = add({ id: 'square', name: 'Square', sides: 4, parents: [], branch: 'origin', level: 0, cost: 0 });

    // --- Circle/Triangle/Square hybrid web ---
    const roundedTri = add({ id: 'rounded_triangle', name: 'Rounded Triangle', sides: 3, rounded: 0.4, parents: ['circle', 'triangle'], branch: 'hybrid', level: 4 });
    const roundedSq = add({ id: 'rounded_square', name: 'Rounded Square', sides: 4, rounded: 0.4, parents: ['circle', 'square'], branch: 'hybrid', level: 4 });
    const wedge = add({ id: 'tri_square', name: 'Triangular Square', sides: 4, rounded: -0.25, parents: ['triangle', 'square'], branch: 'hybrid', level: 5 });
    const triCircleSquare = add({ id: 'trilateral_disc', name: 'Trilateral Disc', sides: 3, rounded: 0.75, parents: ['rounded_triangle', 'rounded_square'], branch: 'hybrid', level: 9 });

    // --- Pentagon..Icosagon chain (independent branch, own progression) ---
    const polyChain = [];
    let prev = null;
    for (let n = 5; n <= 20; n++) {
      const node = add({
        name: nameForSides(n),
        sides: n,
        parents: prev ? [prev.id] : [],
        branch: 'polygon',
        level: n - 3,
      });
      polyChain.push(node);
      prev = node;
    }
    const pentagon = polyChain[0], hexagon = polyChain[1], heptagon = polyChain[2], octagon = polyChain[3];
    const enneagon = polyChain[4], decagon = polyChain[5], dodecagon = polyChain[7];

    // --- Star polygons (regular star shapes, drawn with alternating radius) ---
    const stars = [
      { n: 5, ratio: 0.5, parent: pentagon.id, level: 12 },
      { n: 6, ratio: 0.55, parent: hexagon.id, level: 10, extraParent: 'triangle' },
      { n: 7, ratio: 0.55, parent: heptagon.id, level: 16 },
      { n: 8, ratio: 0.6, parent: octagon.id, level: 18, extraParent: 'square' },
      { n: 9, ratio: 0.6, parent: enneagon.id, level: 20 },
      { n: 10, ratio: 0.62, parent: decagon.id, level: 23, extraParent: pentagon.id },
      { n: 12, ratio: 0.65, parent: dodecagon.id, level: 27, extraParent: hexagon.id },
    ];
    stars.forEach(s => {
      const parents = s.extraParent ? [s.parent, s.extraParent] : [s.parent];
      add({
        name: `${nameForSides(s.n)}ram`.replace('-Gonram', '-Gram'),
        sides: s.n, star: true, starInner: s.ratio,
        parents, branch: 'star', level: s.level,
      });
    });
    // fix the two irregular names manually (pentagram/hexagram/etc are the real terms)
    const starNameFix = { 5: 'Pentagram', 6: 'Hexagram', 7: 'Heptagram', 8: 'Octagram', 9: 'Enneagram', 10: 'Decagram', 12: 'Dodecagram' };
    shapes.filter(s => s.star).forEach(s => { if (starNameFix[s.sides]) s.name = starNameFix[s.sides]; });

    // --- Rounded hybrids of circle + each named polygon ---
    [5, 6, 7, 8, 9, 10, 12].forEach((n, i) => {
      const poly = polyChain.find(p => p.sides === n);
      add({
        name: `Rounded ${nameForSides(n)}`,
        sides: n, rounded: 0.35,
        parents: ['circle', poly.id],
        branch: 'hybrid', level: 30 + i * 3,
      });
    });

    // --- Angular hybrids of triangle + each named polygon (spiky variants) ---
    [5, 6, 8, 10].forEach((n, i) => {
      const poly = polyChain.find(p => p.sides === n);
      add({
        name: `Spurred ${nameForSides(n)}`,
        sides: n, rounded: -0.3,
        parents: ['triangle', poly.id],
        branch: 'hybrid', level: 34 + i * 3,
      });
    });

    // --- Continue the plain n-gon chain far beyond named terms to reach 150+ shapes ---
    let chainPrev = polyChain[polyChain.length - 1]; // icosagon (20)
    let n = 21;
    let level = 40;
    while (shapes.length < 150) {
      const node = add({
        name: nameForSides(n),
        sides: n,
        parents: [chainPrev.id],
        branch: 'polygon-deep',
        level,
      });
      chainPrev = node;
      n++;
      level += 2;
    }

    // A handful of extra elite hybrids at the top of progression, for flavor
    add({ name: 'Prismatic Circle', sides: 0, rounded: 1, star: false, parents: [chainPrev.id, 'trilateral_disc'], branch: 'hybrid', level: level + 6 });
    add({ name: 'Fractal Dodecagram', sides: 12, star: true, starInner: 0.4, parents: shapes.filter(s => s.star).slice(-1).map(s => s.id), branch: 'star', level: level + 10 });

    return { shapes, byId };
  }

  const { shapes, byId } = build();

  return {
    ALL: shapes,
    byId,
    ORIGIN_IDS: ['circle', 'triangle', 'square'],
    getById(id) { return byId[id]; },
    rarityOrder: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    rarityWeight: { common: 100, uncommon: 42, rare: 16, epic: 5, legendary: 1.4 },
    rarityColor: {
      common: '#9aa0a6', uncommon: '#6fd08c', rare: '#6fb3ff', epic: '#c98bff', legendary: '#ffcf6f'
    },
  };
})();
