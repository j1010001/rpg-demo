# Data Model: Retro Dungeon Crawler RPG

**Phase**: 1
**Branch**: `001-retro-dungeon-crawler`

---

## Tile

The atomic unit of the dungeon map. Every cell in the grid is a Tile.

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `type` | enum string | `WALL`, `FLOOR`, `DOOR`, `STAIR_DOWN`, `ITEM_GROUND`, `EMPTY` | `EMPTY` = outside generated bounds (never rendered) |
| `visibility` | enum string | `HIDDEN`, `SEEN`, `LIT` | `HIDDEN` = never visited; `SEEN` = visited, dimmed; `LIT` = in current FOV |
| `glyph` | string (1 char) | `#`, `.`, `+`, `>`, item glyph, ` ` | Derived from type; overridden when an entity occupies the tile |
| `entity` | object or null | Enemy, Item, or null | Reference to entity on this tile; null for most tiles |

**State transitions**:
- `HIDDEN → LIT`: player FOV scan reaches tile for first time
- `LIT → SEEN`: player moves away (tile leaves FOV radius)
- `SEEN → LIT`: player returns within FOV radius
- `HIDDEN` tiles never become `SEEN` directly — they must be `LIT` first

---

## Room

A rectangular region of floor tiles within a BSP leaf partition.

| Field | Type | Notes |
|-------|------|-------|
| `x` | number | Top-left column (tile coordinate) |
| `y` | number | Top-left row (tile coordinate) |
| `width` | number | Tile count, min 4 |
| `height` | number | Tile count, min 4 |
| `id` | number | Unique per floor |
| `connected` | boolean | True once a corridor links this room to the tree |

**Invariant**: All rooms on a floor are connected (BSP construction guarantee, FR-013).

---

## Dungeon

The full floor state: tile grid + room list.

| Field | Type | Notes |
|-------|------|-------|
| `tiles` | `Tile[][]` | 2D array indexed `[y][x]`; dimensions = `config.dungeonWidth` × `config.dungeonHeight` |
| `rooms` | `Room[]` | All rooms on this floor, in BSP generation order |
| `width` | number | Tile columns (default: 80) |
| `height` | number | Tile rows (default: 50) |
| `stairPos` | `{x, y}` | Position of `STAIR_DOWN` tile; guaranteed placed in last room of BSP order |

---

## Player

Single entity; persists across floors within a run.

| Field | Type | Initial value | Notes |
|-------|------|---------------|-------|
| `x` | number | Start room center | Current tile column |
| `y` | number | Start room center | Current tile row |
| `hp` | number | 20 | Current hit points |
| `maxHp` | number | 20 | Cap for HP restoration; does not increase per floor |
| `attack` | number | 3 | Base attack; increased by equipping weapons |
| `defense` | number | 0 | Damage reduction; increased by equipping armor |
| `level` | number | 1 | Display only; equals `floor` (FR-016) |
| `floor` | number | 1 | Current dungeon floor (1–10) |
| `inventory` | `Item[]` | `[]` | Max 10 items; ordered by pickup time |
| `equippedWeapon` | `Item` or null | null | Weapon slot; contributes attack bonus |
| `equippedArmor` | `Item` or null | null | Armor slot; contributes defense bonus |
| `enemiesDefeated` | number | 0 | Running total; shown on game-over screen (FR-008) |

**Derived values** (not stored; computed when needed):
- `totalAttack = player.attack + (player.equippedWeapon?.effect ?? 0)` — used in combat damage formula
- `totalDefense = player.defense + (player.equippedArmor?.effect ?? 0)` — used in damage reduction

---

## Enemy

Placed per floor during dungeon generation; removed on death.

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | Unique per floor |
| `x` | number | Current tile column |
| `y` | number | Current tile row |
| `type` | string | `GOBLIN`, `ORC`, `TROLL` |
| `glyph` | string | `g`, `o`, `T` |
| `hp` | number | Current HP |
| `maxHp` | number | Base HP for this enemy type × floor multiplier |
| `attack` | number | Base attack for this enemy type × floor multiplier |
| `sightRange` | number | Default: 6 tiles; enemy engages player within this range |
| `alive` | boolean | Set to false when HP ≤ 0; removed from `GameState.enemies` after enemy phase |

**Floor scaling formula**:
```
maxHp = BASE_HP[type] + floor * HP_SCALE[type]
attack = BASE_ATT[type] + floor * ATT_SCALE[type]
```
Constants defined in `constants.js`.

---

## Item

Exists either on the dungeon floor (has position) or in the player's inventory (no position).

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | Unique per floor |
| `type` | string | `POTION`, `WEAPON`, `ARMOR` |
| `glyph` | string | `!`, `/`, `[` |
| `name` | string | e.g. `"Health Potion"`, `"Iron Sword"`, `"Leather Armor"` |
| `effect` | number | HP restored (potion) / attack bonus (weapon) / defense bonus (armor) |
| `x` | number or null | Tile column; null when in inventory |
| `y` | number or null | Tile row; null when in inventory |

**Item use rules**:
- POTION: `player.hp = min(player.hp + item.effect, player.maxHp)`; remove from inventory
- WEAPON: if `item.effect > (player.equippedWeapon?.effect ?? 0)`, equip it; displaced weapon goes to inventory if space allows
- ARMOR: same pattern as WEAPON for defense

---

## Run

A single playthrough session. Not stored as an object — represents the lifecycle of `GameState`.

**Phases**:
- `PLAYING`: normal gameplay
- `GAME_OVER`: player HP ≤ 0; game-over screen displayed
- `VICTORY`: player steps on `STAIR_DOWN` on floor 10 (pending D5 vote)

**Permadeath**: no persistence between browser sessions. Page reload = new run.

---

## GameState (top-level singleton)

The single shared object on `window.GameState`. All modules read from and write to this.

```js
GameState = {
  dungeon: Dungeon,          // current floor's tile grid
  player: Player,            // persists across floors
  enemies: Enemy[],          // alive enemies on current floor
  items: Item[],             // items currently on the floor (not in inventory)
  phase: "PLAYING" | "GAME_OVER" | "VICTORY",
  log: string[],             // HUD combat log; capped at last 8 entries (FR-018)
  config: {
    dungeonWidth: 80,
    dungeonHeight: 50,
    sightRadius: 5,          // D3 deferred — tunable constant
    maxFloors: 10,
    inventoryCap: 10,
    minPartition: 8,
    minRoomSize: 4,
  }
}
```

---

## State Transitions Summary

```
Run start
  └─► GameState.phase = PLAYING
        └─► Player placed in first room of floor 1
              └─► Dungeon.tiles generated (BSP)
                    └─► Enemies/items placed per floor scaling
                          └─► FOV computed from player.x, player.y

Player action (keydown)
  ├─► Move: player position updates → FOV recomputed → new tiles lit → item pickup if any
  ├─► Bump-attack: enemy.hp -= damage → if hp ≤ 0: enemy.alive = false → player.enemiesDefeated++
  └─► Stair step: floor++ → if floor > 10: phase = VICTORY; else: new Dungeon generated, enemies/items placed

Enemy phase (after each player action)
  └─► Each alive enemy: if in sight → pursue/attack; else idle

Player HP ≤ 0
  └─► GameState.phase = GAME_OVER → game-over overlay shown
```
