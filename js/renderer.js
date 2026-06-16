const Renderer = (() => {
  const CELL_SIZE = 14;
  const VIEWPORT_COLS = 40;
  const VIEWPORT_ROWS = 28;

  function init(config) {
    const dungeon = document.getElementById('dungeon');
    dungeon.innerHTML = '';
    dungeon.style.gridTemplateColumns = `repeat(${config.dungeonWidth}, ${CELL_SIZE}px)`;
    dungeon.style.gridTemplateRows = `repeat(${config.dungeonHeight}, ${CELL_SIZE}px)`;

    for (let y = 0; y < config.dungeonHeight; y++) {
      for (let x = 0; x < config.dungeonWidth; x++) {
        const span = document.createElement('span');
        span.id = `cell-${y}-${x}`;
        dungeon.appendChild(span);
      }
    }
  }

  function render(gameState) {
    const { dungeon, player, enemies } = gameState;

    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.tiles[y][x];
        const cell = document.getElementById(`cell-${y}-${x}`);
        if (!cell) continue;

        if (tile.visibility === 'HIDDEN') {
          cell.textContent = ' ';
          cell.className = 'tile-hidden';
          continue;
        }

        if (tile.visibility === 'SEEN') {
          cell.textContent = tile.glyph;
          cell.className = 'tile-seen';
          continue;
        }

        // LIT
        const liveEnemy = tile.entity && tile.entity.alive === true ? tile.entity : null;
        if (liveEnemy) {
          cell.textContent = liveEnemy.glyph;
          cell.className = 'tile-enemy-' + liveEnemy.type.toLowerCase();
        } else if (player.x === x && player.y === y) {
          cell.textContent = '@';
          cell.className = 'tile-player';
        } else if (tile.entity && tile.type === 'ITEM_GROUND') {
          cell.textContent = tile.entity.glyph;
          cell.className = 'tile-item';
        } else {
          cell.textContent = tile.glyph;
          cell.className = 'tile-' + tile.type.toLowerCase();
        }
      }
    }

    const vp = document.getElementById('viewport');
    vp.scrollLeft = (player.x - Math.floor(VIEWPORT_COLS / 2)) * CELL_SIZE;
    vp.scrollTop = (player.y - Math.floor(VIEWPORT_ROWS / 2)) * CELL_SIZE;
  }

  return { init, render };
})();
