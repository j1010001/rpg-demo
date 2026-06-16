const Player = (() => {
  function init(startRoom) {
    return {
      x: Math.floor(startRoom.x + startRoom.width / 2),
      y: Math.floor(startRoom.y + startRoom.height / 2),
      hp: 20,
      maxHp: 20,
      attack: 3,
      defense: 0,
      level: 1,
      floor: 1,
      inventory: [],
      equippedWeapon: null,
      equippedArmor: null,
      enemiesDefeated: 0
    };
  }

  function move(dx, dy, gameState) {
    const player = gameState.player;
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (!Dungeon.isWalkable(gameState.dungeon, nx, ny)) return;

    player.x = nx;
    player.y = ny;

    if (typeof FOV !== 'undefined') {
      if (FOV.update) FOV.update(gameState);
      if (FOV.compute) FOV.compute(gameState);
    }
  }

  return { init, move };
})();
