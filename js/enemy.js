const Enemy = (() => {
  function typePool(floor) {
    if (floor >= 7) return ['GOBLIN', 'ORC', 'TROLL'];
    if (floor >= 4) return ['GOBLIN', 'ORC'];
    return ['GOBLIN'];
  }

  function randomFloorTile(room, dungeon) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = room.x + Math.floor(Math.random() * room.width);
      const y = room.y + Math.floor(Math.random() * room.height);
      const tile = Dungeon.getTile(dungeon, x, y);
      if (tile && tile.type === 'FLOOR' && !tile.entity) return { x, y, tile };
    }
    return null;
  }

  function placeForFloor(dungeon, floor) {
    const count = Math.floor(1 + floor / 3);
    for (let i = 1; i < dungeon.rooms.length; i++) {
      const room = dungeon.rooms[i];
      const pool = typePool(floor);
      for (let j = 0; j < count; j++) {
        const spot = randomFloorTile(room, dungeon);
        if (!spot) continue;
        const type = pool[Math.floor(Math.random() * pool.length)];
        const enemy = {
          x: spot.x,
          y: spot.y,
          type,
          glyph: GLYPHS[type],
          hp: BASE_HP[type] + floor * HP_SCALE[type],
          maxHp: BASE_HP[type] + floor * HP_SCALE[type],
          attack: BASE_ATT[type] + floor * ATT_SCALE[type],
          alive: true,
          sightRange: CONFIG.enemySightRange,
          roomId: room.id,
          active: false
        };
        spot.tile.entity = enemy;
        GameState.enemies.push(enemy);
      }
    }
  }

  function tryMove(enemy, dx, dy, dungeon) {
    if (dx === 0 && dy === 0) return false;
    const nx = enemy.x + dx;
    const ny = enemy.y + dy;
    if (!Dungeon.isWalkable(dungeon, nx, ny)) return false;
    const target = Dungeon.getTile(dungeon, nx, ny);
    if (target.entity && target.entity !== enemy) return false;
    Dungeon.getTile(dungeon, enemy.x, enemy.y).entity = null;
    enemy.x = nx;
    enemy.y = ny;
    target.entity = enemy;
    return true;
  }

  function ai(enemy, gameState) {
    if (!enemy.alive) return;
    if (!enemy.active) return;

    const player = gameState.player;
    const dx = Math.sign(player.x - enemy.x);
    const dy = Math.sign(player.y - enemy.y);
    const chebyshev = Math.max(Math.abs(player.x - enemy.x), Math.abs(player.y - enemy.y));

    if (chebyshev <= 1) {
      if (typeof Combat !== 'undefined') Combat.enemyAttack(enemy, gameState);
      return;
    }

    const absDx = Math.abs(player.x - enemy.x);
    const absDy = Math.abs(player.y - enemy.y);
    if (absDx >= absDy) {
      if (!tryMove(enemy, dx, 0, gameState.dungeon)) tryMove(enemy, 0, dy, gameState.dungeon);
    } else {
      if (!tryMove(enemy, 0, dy, gameState.dungeon)) tryMove(enemy, dx, 0, gameState.dungeon);
    }
  }

  return { placeForFloor, ai };
})();

function processEnemyPhase(gameState) {
  gameState.enemies.forEach(e => Enemy.ai(e, gameState));
  gameState.enemies = gameState.enemies.filter(e => e.alive);
}
