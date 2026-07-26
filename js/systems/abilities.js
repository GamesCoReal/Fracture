const AbilitySystem = (() => {
  function isOwned(state, abilityId) {
    return !!(state.abilities[abilityId] && state.abilities[abilityId].owned);
  }

  function placeGravityWell(world, state, x, y) {
    if (!isOwned(state, 'gravity_well')) return false;
    world.gravityAnchor = { x, y };
    state.gravityWell.placed = true;
    state.gravityWell.x = x / world.width;
    state.gravityWell.y = y / world.height;
    return true;
  }

  function clearGravityWell(world, state) {
    world.gravityAnchor = null;
    state.gravityWell.placed = false;
  }

  function physicsContext(world, state) {
    if (!isOwned(state, 'gravity_well') || !world.gravityAnchor) {
      return { gravityActive: false };
    }
    return {
      gravityActive: true,
      gravityX: world.gravityAnchor.x,
      gravityY: world.gravityAnchor.y,
      gravityStrength: PowerSystem.getAbilityValue(state, 'gravity_well', 'strength'),
      gravityRange: PowerSystem.getAbilityValue(state, 'gravity_well', 'range'),
    };
  }

  return { isOwned, placeGravityWell, clearGravityWell, physicsContext };
})();
