const Enemy = (() => {
  const TYPE_GLYPHS = { GOBLIN: 'g', ORC: 'o', TROLL: 'T' };

  function randomType(floor) {
    if (floor >= 7) {
      const r = Math.random();
      return r < 0.33 ? 'GOBLIN' : r < 0.66 ? 'ORC' : 'TROLL';
    }
    if (floor >= 4) return Math.random() < 0.5 ? 'GOBLIN' : 'ORC';
    return 'GOBLIN';
  }

  function placeForFloor(dungeon, floor) {
    for (let i = 1; i < dungeon.rooms.length; i++) {
      const room = dungeon.rooms[i];
      const count = Math.floor(1 + floor / 3);
      let placed = 0, attempts = 0;
      while (placed < count && attempts < 100) {
        attempts++;
        const ex = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.width - 2));
        const ey = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.height - 2));
        if (ex >= dungeon.width || ey >= dungeon.height) continue;
        const tile = dungeon.tiles[ey][ex];
        if (tile.type !== 'FLOOR' || tile.entity) continue;

        const type = randomType(floor);
        const hp = BASE_HP[type] + floor * HP_SCALE[type];
        const att = BASE_ATT[type] + floor * ATT_SCALE[type];

        const enemy = {
          x: ex, y: ey,
          hp, maxHp: hp,
          attack: att,
          type,
          glyph: TYPE_GLYPHS[type],
          alive: true,
          roomId: room.id,   // R103: track which room this enemy belongs to
          active: false       // R103: inactive until player enters the room
        };

        tile.entity = enemy;
        GameState.enemies.push(enemy);
        placed++;
      }
    }
  }

  function tryMove(enemy, dx, dy, dungeon) {
    if (dx === 0 && dy === 0) return false;
    const nx = enemy.x + dx;
    const ny = enemy.y + dy;
    if (!Dungeon.isWalkable(dungeon, nx, ny)) return false;
    const target = dungeon.tiles[ny][nx];
    if (target.entity && target.entity !== enemy) return false;
    dungeon.tiles[enemy.y][enemy.x].entity = null;
    enemy.x = nx;
    enemy.y = ny;
    dungeon.tiles[ny][nx].entity = enemy;
    return true;
  }

  function ai(enemy, gameState) {
    if (!enemy.alive) return;
    // R103: only pursue if activated by room entry; inactive enemies stay put
    if (!enemy.active) return;

    const { player, dungeon } = gameState;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;

    if (Math.max(Math.abs(dx), Math.abs(dy)) <= 1) {
      Combat.enemyAttack(enemy, gameState);
      return;
    }

    const sdx = Math.sign(dx);
    const sdy = Math.sign(dy);
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (!tryMove(enemy, sdx, 0, dungeon)) tryMove(enemy, 0, sdy, dungeon);
    } else {
      if (!tryMove(enemy, 0, sdy, dungeon)) tryMove(enemy, sdx, 0, dungeon);
    }
  }

  return { placeForFloor, ai };
})();
