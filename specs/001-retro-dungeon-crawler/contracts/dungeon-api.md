# Contract: Dungeon Generation API

**Module**: `js/dungeon.js`
**Branch**: `001-retro-dungeon-crawler`

---

## Overview

The dungeon module is responsible for BSP dungeon generation. It takes the game config and floor number and produces a fully initialized `Dungeon` object — tiles, rooms, corridors, stairs placed. It also places enemies and items according to floor scaling.

---

## Public Interface

### `Dungeon.generate(config, floor)`

Generates a new dungeon floor.

**Parameters**:
- `config` — `GameState.config` object (reads `dungeonWidth`, `dungeonHeight`, `minPartition`, `minRoomSize`)
- `floor` — number (1–10); used to scale enemy count and item placement

**Returns**: A `Dungeon` object (see [game-state.md](./game-state.md)):
```js
{
  tiles: Tile[][],      // Fully initialized; all tiles start as WALL with HIDDEN visibility
  rooms: Room[],        // Generated rooms in BSP order; first room = player start
  width: number,
  height: number,
  stairPos: { x, y }    // Set to center of last room in BSP order
}
```

**Side effects**: Also populates `GameState.enemies` and `GameState.items` with entities placed in rooms.

**Postconditions**:
- All rooms in `rooms[]` are connected via corridors (BSP guarantee).
- `rooms.length >= 8` for default config (SC-002).
- `stairPos` is walkable (type `STAIR_DOWN`).
- Player start position = center of `rooms[0]`.
- No room or corridor tile overlaps the dungeon border (row 0, row height-1, col 0, col width-1).

---

### `Dungeon.getTile(dungeon, x, y)`

Safe tile accessor. Returns `null` if `(x, y)` is out of bounds.

**Parameters**:
- `dungeon` — `GameState.dungeon`
- `x`, `y` — tile coordinates

**Returns**: `Tile | null`

---

### `Dungeon.isWalkable(dungeon, x, y)`

Returns `true` if `(x, y)` is in bounds and tile type is `FLOOR`, `DOOR`, `STAIR_DOWN`, or `ITEM_GROUND`.

**Parameters**: same as `getTile`

**Returns**: `boolean`

---

## BSP Generation Algorithm Contract

1. Initialize all tiles as `WALL`, `HIDDEN`.
2. Create root partition: `{ x: 1, y: 1, width: config.dungeonWidth - 2, height: config.dungeonHeight - 2 }`.
3. Recursively split partitions:
   - Stop if `width < 2 * config.minPartition` AND `height < 2 * config.minPartition`.
   - Otherwise split along the longer axis (horizontal if `height > width`, else vertical).
   - Split point chosen randomly in the range `[minPartition, dimension - minPartition]`.
4. For each leaf partition, place one room:
   - Room width: random in `[config.minRoomSize, partition.width - 2]`.
   - Room height: random in `[config.minRoomSize, partition.height - 2]`.
   - Room position: random offset within partition with 1-tile padding.
   - Set all tiles in room to `FLOOR`.
5. Connect sibling rooms (post-order tree traversal):
   - Compute center of left-subtree room and right-subtree room.
   - Carve L-shaped corridor: horizontal segment first, then vertical (or vice versa, randomly).
   - Set corridor tiles to `FLOOR`.
6. Place staircase: `tiles[stairY][stairX].type = STAIR_DOWN`, glyph = `>`.
7. Place enemies: call `Enemy.placeForFloor(dungeon, floor)` — populates `GameState.enemies`.
8. Place items: call `Items.placeForFloor(dungeon, floor)` — populates `GameState.items`, sets `tile.type = ITEM_GROUND`, `tile.entity = item`.

---

## Enemy Placement Contract (`Enemy.placeForFloor`)

Called by `Dungeon.generate`. Signature:
```js
Enemy.placeForFloor(dungeon, floor)
// Modifies GameState.enemies in place
// Places enemies in rooms 1..N (skips room 0 = player start)
// Enemy count per room: floor(1 + floor / 3) enemies, randomly distributed
// Enemy type distribution: floor 1-3 → GOBLINs; floor 4-6 → GOBLINs + ORCs; floor 7+ → all types
```

---

## Item Placement Contract (`Items.placeForFloor`)

Called by `Dungeon.generate`. Signature:
```js
Items.placeForFloor(dungeon, floor)
// Modifies GameState.items in place
// Places 1-3 items per room (random); avoids player start room (rooms[0])
// Item type distribution: weighted toward POTIONs on early floors, weapons/armor on later floors
// Sets tile.type = ITEM_GROUND and tile.entity = item for each placed item
```
