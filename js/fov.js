const FOV = (() => {
  function update(gameState) {
    const { dungeon } = gameState;
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        if (dungeon.tiles[y][x].visibility === 'LIT') {
          dungeon.tiles[y][x].visibility = 'SEEN';
        }
      }
    }
  }

  function compute(gameState) {
    const { dungeon, player, config } = gameState;
    const r = config.sightRadius;
    const px = player.x, py = player.y;

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) > config.sightRadius) continue;
        const tx = px + dx, ty = py + dy;
        if (tx < 0 || tx >= dungeon.width || ty < 0 || ty >= dungeon.height) continue;

        if (hasLineOfSight(dungeon, px, py, tx, ty)) {
          dungeon.tiles[ty][tx].visibility = 'LIT';
        }
      }
    }
  }

  function hasLineOfSight(dungeon, x0, y0, x1, y1) {
    let x = x0, y = y0;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      if (x === x1 && y === y1) return true;
      // If this intermediate tile is a wall, it blocks sight past it
      if (x !== x0 || y !== y0) {
        const tile = Dungeon.getTile(dungeon, x, y);
        if (tile === null || tile.type === 'WALL') return false;
      }
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  return { update, compute };
})();
