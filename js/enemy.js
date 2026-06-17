const Enemy = (() => {
  function makeEnemy(type, x, y, floor, roomId) {
    return {
      type,
      x,
      y,
      glyph: GLYPHS[type],
      hp: BASE_HP[type] + floor * HP_SCALE[type],
      maxHp: BASE_HP[type] + floor * HP_SCALE[type],
      attack: BASE_ATT[type] + floor * ATT_SCALE[type],
      alive: true,
      roomId,
      active: false
    };
  }

  function typeForFloor(floor) {
    if (floor >= 7) {
      const r = Math.random();
      if (r < 0.33) return 'GOBLIN';
      if (r < 0.66) return 'ORC';
      return 'TROLL';
    }
    if (floor >= 4) return Math.random() < 0.5 ? 'GOBLIN' : 'ORC';
    return 'GOBLIN';
  }

  function placeForFloor(dungeon, floor) {
    const rooms = dungeon.rooms;
    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      const count = Math.floor(1 + floor / 3);
      for (let k = 0; k < count; k++) {
        for (let attempt = 0; attempt < 10; attempt++) {
          const x = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.width - 2));
          const y = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.height - 2));
          const tile = dungeon.tiles[y] && dungeon.tiles[y][x];
          if (tile && tile.type === 'FLOOR' && !tile.entity) {
            const type = typeForFloor(floor);
            const enemy = makeEnemy(type, x, y, floor, room.id);
            tile.entity = enemy;
            GameState.enemies.push(enemy);
            break;
          }
        }
      }
    }
  }

  function tryMove(enemy, dx, dy, dungeon) {
    if (dx === 0 && dy === 0) return false;
    const nx = enemy.x + dx;
    const ny = enemy.y + dy;
    if (!Dungeon.isWalkable(dungeon, nx, ny)) return false;
    const targetTile = dungeon.tiles[ny][nx];
    if (targetTile.entity && targetTile.entity !== enemy && targetTile.entity.alive) return false;
    dungeon.tiles[enemy.y][enemy.x].entity = null;
    enemy.x = nx;
    enemy.y = ny;
    dungeon.tiles[ny][nx].entity = enemy;
    return true;
  }

  function ai(enemy, gameState) {
    if (!enemy.alive || !enemy.active) return;
    const { player, dungeon } = gameState;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.max(Math.abs(dx), Math.abs(dy));

    if (dist <= 1) {
      Combat.enemyAttack(enemy, gameState);
      return;
    }

    const mx = Math.sign(dx);
    const my = Math.sign(dy);
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (tryMove(enemy, mx, 0, dungeon)) return;
      tryMove(enemy, 0, my, dungeon);
    } else {
      if (tryMove(enemy, 0, my, dungeon)) return;
      tryMove(enemy, mx, 0, dungeon);
    }
  }

  return { placeForFloor, ai };
})();
