const Dungeon = (() => {
  const WALKABLE = new Set(['FLOOR', 'DOOR', 'STAIR_DOWN', 'ITEM_GROUND']);

  function makeTile(type, glyph) {
    return { type, visibility: 'HIDDEN', glyph, entity: null };
  }

  function generate(config, floor) {
    const { dungeonWidth: W, dungeonHeight: H, minPartition, minRoomSize } = config;

    const tiles = [];
    for (let y = 0; y < H; y++) {
      tiles[y] = [];
      for (let x = 0; x < W; x++) {
        tiles[y][x] = makeTile('WALL', '#');
      }
    }

    const rooms = [];

    function carveH(y, x1, x2) {
      const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
      for (let x = lo; x <= hi; x++) {
        if (tiles[y][x].type === 'WALL') tiles[y][x] = makeTile('FLOOR', '.');
      }
    }

    function carveV(x, y1, y2) {
      const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
      for (let y = lo; y <= hi; y++) {
        if (tiles[y][x].type === 'WALL') tiles[y][x] = makeTile('FLOOR', '.');
      }
    }

    function connectRooms(a, b) {
      const ax = Math.floor(a.x + a.width / 2);
      const ay = Math.floor(a.y + a.height / 2);
      const bx = Math.floor(b.x + b.width / 2);
      const by = Math.floor(b.y + b.height / 2);
      if (Math.random() < 0.5) {
        carveH(ay, ax, bx);
        carveV(bx, ay, by);
      } else {
        carveV(ax, ay, by);
        carveH(by, ax, bx);
      }
    }

    // Returns representative room for parent corridor connection.
    function split(px, py, pw, ph) {
      const canH = ph >= 2 * minPartition;
      const canV = pw >= 2 * minPartition;

      if (!canH && !canV) {
        const maxW = pw - 2;
        const maxH = ph - 2;
        const rw = minRoomSize + Math.floor(Math.random() * (maxW - minRoomSize + 1));
        const rh = minRoomSize + Math.floor(Math.random() * (maxH - minRoomSize + 1));
        const rx = px + 1 + Math.floor(Math.random() * (pw - rw - 1));
        const ry = py + 1 + Math.floor(Math.random() * (ph - rh - 1));

        for (let y = ry; y < ry + rh; y++) {
          for (let x = rx; x < rx + rw; x++) {
            tiles[y][x] = makeTile('FLOOR', '.');
          }
        }

        const room = { id: rooms.length, x: rx, y: ry, width: rw, height: rh, connected: false };
        rooms.push(room);
        return room;
      }

      let leftRoom, rightRoom;

      if (canH && (!canV || ph >= pw)) {
        // Split along height (horizontal split line)
        const splitY = minPartition + Math.floor(Math.random() * (ph - 2 * minPartition + 1));
        leftRoom = split(px, py, pw, splitY);
        rightRoom = split(px, py + splitY, pw, ph - splitY);
      } else {
        // Split along width (vertical split line)
        const splitX = minPartition + Math.floor(Math.random() * (pw - 2 * minPartition + 1));
        leftRoom = split(px, py, splitX, ph);
        rightRoom = split(px + splitX, py, pw - splitX, ph);
      }

      connectRooms(leftRoom, rightRoom);
      leftRoom.connected = true;
      rightRoom.connected = true;
      return leftRoom;
    }

    split(1, 1, W - 2, H - 2);

    const lastRoom = rooms[rooms.length - 1];
    const stairX = Math.floor(lastRoom.x + lastRoom.width / 2);
    const stairY = Math.floor(lastRoom.y + lastRoom.height / 2);
    tiles[stairY][stairX] = makeTile('STAIR_DOWN', '>');

    const dungeon = { tiles, rooms, width: W, height: H, stairPos: { x: stairX, y: stairY } };

    if (typeof window !== 'undefined' && window.GameState) {
      window.GameState.dungeon = dungeon;
    }

    if (typeof Enemy !== 'undefined' && Enemy.placeForFloor) {
      Enemy.placeForFloor(dungeon, floor);
    }
    if (typeof Items !== 'undefined' && Items.placeForFloor) {
      Items.placeForFloor(dungeon, floor);
    }

    return dungeon;
  }

  function getTile(dungeon, x, y) {
    if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) return null;
    return dungeon.tiles[y][x];
  }

  function isWalkable(dungeon, x, y) {
    const tile = getTile(dungeon, x, y);
    return tile !== null && WALKABLE.has(tile.type);
  }

  return { generate, getTile, isWalkable };
})();
