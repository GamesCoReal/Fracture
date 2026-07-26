let __shapeUid = 1;

class Shape {
  constructor(shapeId, size, x, y, corrupted = false) {
    this.uid = __shapeUid++;
    this.shapeId = shapeId;
    this.size = size; // 'small' | 'medium' | 'large'
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 18;
    this.vy = (Math.random() - 0.5) * 18;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.35;
    this.corrupted = corrupted;
    this.spawnT = 0; // pop-in progress 0..1
    this.hitFlash = 0;
    this.baseRadius = size === 'small' ? 20 : size === 'medium' ? 30 : 42;
    this.radius = this.baseRadius;
  }
}

const SIZE_DOWN = { large: 'medium', medium: 'small', small: null };
const SHAPE_RADII = { small: 20, medium: 30, large: 42 };

class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.shapes = [];
    this.particles = [];
    this.spawnAccum = 0;
    this.gravityAnchor = null; // {x,y} in world space, active when Gravity Well placed
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
  }

  clampInBounds(s) {
    const r = s.radius;
    if (s.x < r) { s.x = r; s.vx = Math.abs(s.vx); }
    if (s.x > this.width - r) { s.x = this.width - r; s.vx = -Math.abs(s.vx); }
    if (s.y < r) { s.y = r; s.vy = Math.abs(s.vy); }
    if (s.y > this.height - r) { s.y = this.height - r; s.vy = -Math.abs(s.vy); }
  }

  randomPos(margin = 50) {
    return {
      x: margin + Math.random() * Math.max(1, this.width - margin * 2),
      y: margin + Math.random() * Math.max(1, this.height - margin * 2),
    };
  }

  unlockedShapeIds(state) {
    return Object.keys(state.unlockedShapes);
  }

  weightedRandomShapeId(state) {
    const ids = this.unlockedShapeIds(state);
    if (!ids.length) return null;
    let total = 0;
    const weights = ids.map(id => {
      const def = ShapeConfig.getById(id);
      const rarity = def ? def.rarity : 'common';
      const spawnLevel = state.shapeSpawnLevel[id] || 0;
      const w = (ShapeConfig.rarityWeight[rarity] || 10) * (1 + spawnLevel * 0.35);
      total += w;
      return w;
    });
    let r = Math.random() * total;
    for (let i = 0; i < ids.length; i++) {
      r -= weights[i];
      if (r <= 0) return ids[i];
    }
    return ids[ids.length - 1];
  }

  randomLockedShapeId(state) {
    const locked = ShapeConfig.ALL.filter(s => !state.unlockedShapes[s.id]);
    if (!locked.length) return null;
    return locked[Math.floor(Math.random() * locked.length)].id;
  }

  spawnMaybe(state, dt, maxShapes) {
    const minimumPopulation = 35;
    const populationLimit = Math.max(minimumPopulation, maxShapes);
    if (this.shapes.length >= populationLimit) return;
    const rateUpgrade = 1 + (state.globalUpgrades.spawn_rate || 0) * 0.12;
    const baseInterval = this.shapes.length < minimumPopulation ? 0.055 : 0.36;
    this.spawnAccum += dt;
    const interval = baseInterval / rateUpgrade;
    if (this.spawnAccum < interval) return;
    this.spawnAccum -= interval;

    const shapeId = this.weightedRandomShapeId(state);
    if (!shapeId) return;

    const largeBiasBase = UpgradesConfig.getDef('large_bias').base;
    const largeBias = Math.min(0.55, largeBiasBase + (state.globalUpgrades.large_bias || 0) * 0.02);
    const roll = Math.random();
    let size = 'small';
    if (roll < largeBias * 0.4) size = 'large';
    else if (roll < largeBias * 1.6) size = 'medium';

    let corrupted = false;
    if (size !== 'small') {
      const corruptChanceBase = UpgradesConfig.getDef('corruption_chance').base;
      const corruptChance = Math.min(0.4, corruptChanceBase + (state.globalUpgrades.corruption_chance || 0) * 0.01);
      corrupted = Math.random() < corruptChance;
    }

    const pos = this.randomPos(60);
    this.addShape(shapeId, size, pos.x, pos.y, corrupted);

    // occasional bonus corrupted spawn driven by its own upgrade
    const extraCorruptRate = (state.globalUpgrades.corruption_spawn_rate || 0) * 0.15;
    if (Math.random() < extraCorruptRate * dt) {
      const p2 = this.randomPos(60);
      this.addShape(shapeId, Math.random() < 0.5 ? 'medium' : 'large', p2.x, p2.y, true);
    }
  }

  addShape(shapeId, size, x, y, corrupted = false) {
    const s = new Shape(shapeId, size, x, y, corrupted);
    this.shapes.push(s);
    return s;
  }

  transformShape(shape, shapeId, size, corrupted = false) {
    shape.shapeId = shapeId;
    shape.size = size;
    shape.corrupted = corrupted;
    shape.baseRadius = SHAPE_RADII[size];
    shape.radius = shape.baseRadius;
    shape.spawnT = 0;
    return shape;
  }

  spawnCopies(parentShape, count, shapeId, size) {
    const copies = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const offset = parentShape.radius * 0.55;
      const copy = this.addShape(
        shapeId || parentShape.shapeId,
        size || parentShape.size,
        parentShape.x + Math.cos(angle) * offset,
        parentShape.y + Math.sin(angle) * offset,
        false
      );
      const pushSpeed = 90 + Math.random() * 40;
      copy.vx = Math.cos(angle) * pushSpeed + parentShape.vx * 0.3;
      copy.vy = Math.sin(angle) * pushSpeed + parentShape.vy * 0.3;
      copies.push(copy);
    }
    return copies;
  }

  burstSmallShape(shape) {
    const angle = Math.random() * Math.PI * 2;
    const burstSpeed = 145;
    const offset = shape.radius * 0.65;
    const copy = this.addShape(
      shape.shapeId,
      'small',
      shape.x - Math.cos(angle) * offset,
      shape.y - Math.sin(angle) * offset,
      false
    );
    copy.vx = -Math.cos(angle) * burstSpeed;
    copy.vy = -Math.sin(angle) * burstSpeed;
    shape.x += Math.cos(angle) * offset;
    shape.y += Math.sin(angle) * offset;
    shape.vx = Math.cos(angle) * burstSpeed;
    shape.vy = Math.sin(angle) * burstSpeed;
    shape.rotation += Math.PI * 0.5;
    shape.rotSpeed = (Math.random() - 0.5) * 1.6;
    shape.spawnT = 0;
    return copy;
  }

  spawnChildren(parentShape, count, shapeIdOverride) {
    const nextSize = SIZE_DOWN[parentShape.size];
    if (!nextSize) return [];
    return this.spawnCopies(parentShape, count, shapeIdOverride, nextSize);
  }

  spawnParticles(x, y, color, count = 8) {
    if (!PerfSystem.getParticlesEnabled()) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        color,
      });
    }
  }
}

const EntitySystem = { SIZE_DOWN };
