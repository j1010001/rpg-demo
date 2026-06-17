const Enemy = (() => {
  function typePool(floor) {
    if (floor >= 7) return ['GOBLIN', 'ORC', 'TROLL'];
    if (floor >= 4) return ['GOBLIN', 'ORC'];
    return ['GOBLIN'];
  }

  function makeEnemy(type, x, y, floor) {
    return {
      type,
      x,
      y,
      hp: BASE_HP[type] + floor * HP_SCALE[type],
      maxHp: BASE_HP[type] + floor * HP_SCALE[type],
      attack: BASE_ATT[type] + floor * ATT_SCALE[type],
      glyph: GLYPHS[type],
      alive: true,
      activated: false
    };
  }

  function placeForFloor(dungeon, floor) {
    const pool = typePool(floor);
    const countPerRoom = Math.floor(1 + floor / 3);

    // T029 verification: confirm type pool, count, scaling, and stairPos
    console.log(`[T029] Floor ${floor} — pool: [${pool.join(', ')}], enemies/room: ${countPerRoom}`);
    console.log('[T029] Floor scaling (all types):');
    for (const type of ['GOBLIN', 'ORC', 'TROLL']) {
      const hp = BASE_HP[type] + floor * HP_SCALE[type];
      const atk = BASE_ATT[type] + floor * ATT_SCALE[type];
      console.log(`  ${type}: HP=${hp} (${BASE_HP[type]} + ${floor}×${HP_SCALE[type]}), ATK=${atk}`);
    }
    console.log(`[T029] stairPos confirmed: (${dungeon.stairPos.x}, ${dungeon.stairPos.y})`);

    const rooms = dungeon.rooms;
    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      for (let n = 0; n < countPerRoom; n++) {
        let placed = false;
        for (let attempt = 0; attempt < 20 && !placed; attempt++) {
          const rx = room.x + Math.floor(Math.random() * room.width);
          const ry = room.y + Math.floor(Math.random() * room.height);
          const tile = dungeon.tiles[ry] && dungeon.tiles[ry][rx];
          if (tile && tile.type === 'FLOOR' && !tile.entity) {
            const type = pool[Math.floor(Math.random() * pool.length)];
            const enemy = makeEnemy(type, rx, ry, floor);
            tile.entity = enemy;
            GameState.enemies.push(enemy);
            placed = true;
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
    const dest = dungeon.tiles[ny] && dungeon.tiles[ny][nx];
    if (!dest || dest.entity) return false;
    dungeon.tiles[enemy.y][enemy.x].entity = null;
    enemy.x = nx;
    enemy.y = ny;
    dest.entity = enemy;
    return true;
  }

  function activateRoomEnemies(gameState) {
    const { player, dungeon, enemies } = gameState;
    const playerRoom = dungeon.rooms.find(r =>
      player.x >= r.x && player.x < r.x + r.width &&
      player.y >= r.y && player.y < r.y + r.height
    );
    if (!playerRoom) return;
    for (const enemy of enemies) {
      if (!enemy.activated &&
          enemy.x >= playerRoom.x && enemy.x < playerRoom.x + playerRoom.width &&
          enemy.y >= playerRoom.y && enemy.y < playerRoom.y + playerRoom.height) {
        enemy.activated = true;
      }
    }
  }

  function ai(enemy, gameState) {
    if (!enemy.alive) return;
    if (!enemy.activated) return;

    const player = gameState.player;
    const absDx = Math.abs(player.x - enemy.x);
    const absDy = Math.abs(player.y - enemy.y);
    const dist = Math.max(absDx, absDy);

    if (dist === 1) {
      if (typeof Combat !== 'undefined' && Combat.enemyAttack) {
        Combat.enemyAttack(enemy, gameState);
      }
      return;
    }

    const mx = Math.sign(player.x - enemy.x);
    const my = Math.sign(player.y - enemy.y);
    if (absDx >= absDy) {
      if (!tryMove(enemy, mx, 0, gameState.dungeon)) tryMove(enemy, 0, my, gameState.dungeon);
    } else {
      if (!tryMove(enemy, 0, my, gameState.dungeon)) tryMove(enemy, mx, 0, gameState.dungeon);
    }
  }

  return { placeForFloor, ai, activateRoomEnemies };
})();

function processEnemyPhase(gameState) {
  for (const enemy of gameState.enemies) {
    Enemy.ai(enemy, gameState);
  }
  gameState.enemies = gameState.enemies.filter(e => e.alive);
}
