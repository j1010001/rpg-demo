# Research: Retro Dungeon Crawler RPG

**Phase**: 0 — Pre-implementation research
**Branch**: `001-retro-dungeon-crawler`

All decisions below resolve either NEEDS CLARIFICATION items from the plan or dependency best-practices for the chosen tech stack.

---

## Decision 1: BSP Dungeon Generation Algorithm

**Decision**: Recursive Binary Space Partitioning with L-shaped corridor carving.

**Algorithm**:
1. Start with entire floor area (e.g. 80×50 tiles, 1-tile border reserved for outer walls).
2. Recursively split the area: alternate H/V splits, or pick the longer axis. Stop when a partition is smaller than `MIN_PARTITION` (8×8).
3. In each leaf partition, place a room: random width/height between `MIN_ROOM` (4×4) and partition size minus 2 (1-tile padding on each side).
4. Connect sibling leaf rooms: draw an L-shaped corridor — go horizontal from room A center, then vertical to room B center (or vice versa). Fill corridor tiles as floor.
5. Propagate connections up the BSP tree: interior nodes connect the rooms of their two child subtrees similarly.

**Rationale**: Guaranteed full connectivity by construction (every split creates a corridor between children) — no post-generation flood-fill or pathfinding needed. FR-017 explicitly mandates BSP. Produces rectangular rooms with clear separation, which is idiomatic for roguelikes. SC-002 (≥8 rooms) is met by choosing floor size/min-partition so the tree has ≥8 leaves (80×50 with min partition 8×8 produces 10–15 rooms typically).

**Alternatives considered**:
- Cellular automata caves: organic feel but poor room guarantees; can create disconnected regions; harder to place stairs/items predictably. Rejected.
- Pre-placed room grid (classic Rogue): simpler but less interesting layout variety. Rejected — BSP is mandated.
- Delaunay triangulation + MST corridors: produces well-connected layouts but adds complexity and requires a geometry library. Rejected (no external deps).

---

## Decision 2: DOM Rendering Architecture

**Decision**: CSS Grid layout, fixed 14px×14px cells, `<span>` elements as tiles, viewport clipping with CSS overflow:hidden, player-centered scroll via `scrollTo()` or CSS transform.

**Approach**:
- `#dungeon` container: `display: grid; grid-template-columns: repeat(WIDTH, 14px); grid-template-rows: repeat(HEIGHT, 14px); font-size: 13px; font-family: monospace`.
- Each tile = `<span>` with text content (glyph) and CSS class for color: `.tile-wall`, `.tile-floor`, `.tile-player`, etc.
- Viewport wrapper: fixed-size div (e.g. 560×392px = 40×28 cells visible) with `overflow: hidden`. Center on player by updating `scrollLeft`/`scrollTop` of wrapper to `(playerX - 20) * 14` / `(playerY - 14) * 14` each turn.
- Tile pool: create all `WIDTH × HEIGHT` span elements once on floor init; update `textContent` and `className` per-turn without DOM insertion/removal.

**Rationale**: FR-015 explicitly prohibits `<canvas>`. DOM approach is natural for text characters. Pre-allocating the cell pool avoids per-frame DOM churn. CSS class-based coloring avoids inline style updates. 14px monospace gives readable glyphs on typical desktop displays.

**Alternatives considered**:
- Canvas 2D API: prohibited by FR-015.
- Table-based grid: semantically wrong, slower to update individual cells.
- Absolutely-positioned spans: layout calculation in JS; harder to center. Rejected.
- CSS custom properties for per-cell color: overengineered; class names are sufficient.

---

## Decision 3: Fog-of-War (FOV) Algorithm

**Decision**: Simple radius scan with Bresenham line-of-sight check.

**Algorithm**:
```
for each tile T within radius R of player P:
  if Bresenham line from P to T hits a wall before reaching T:
    T remains hidden/seen (not lit)
  else:
    T.visibility = lit
    if T.visibility was hidden: set T.visited = true
```
After player moves:
- All previously-lit tiles set to `seen` (dimmed).
- Run FOV scan from new position.

**Visibility state rendering**:
- `hidden`: render as space/empty (dark background, no glyph)
- `seen`: render glyph in dim color (e.g. `#444` green or `#333` gray)
- `lit`: render glyph in full color per tile/entity type

**Sight radius**: D3 is deferred (probe defaults to 5). Stored in `GameState.config.sightRadius` so tuning is a single constant change.

**Rationale**: Bresenham line check is O(radius²) per turn which is ~78 checks at R=5 — negligible. More complex shadow-casting algorithms (recursive shadowcasting, MRPAS) are overkill for a retro game with simple rectangular rooms. The simple algorithm has correct behavior for all acceptance scenarios in User Story 1.

**Alternatives considered**:
- Recursive shadow casting: most accurate; significantly more complex to implement correctly. Overkill for this game.
- Flood-fill from player (no wall check): allows visibility "around corners"; breaks fog expectation. Rejected.
- Pre-computed visibility per room (room-based FOV): fast but cannot model partial visibility in corridors. Rejected.

---

## Decision 4: Turn Engine Architecture

**Decision**: Synchronous event-driven loop triggered by `keydown`.

**Flow**:
```
keydown → processPlayerAction(key) → if(playerMoved) processEnemyPhase() → expandDungeonIfNeeded() → renderAll() → idle
```

All operations are synchronous. No `requestAnimationFrame` loop for game logic. The DOM updates once per turn after all state changes, avoiding intermediate render states.

**Player action types**:
- Move: attempt to move to adjacent tile → if floor: move, trigger fog update, check item pickup, check stair → if enemy: attack enemy instead of moving (bump-to-attack)
- Wait (`.` or `s` while not moving): consume a turn, enemies act
- Inventory open (`i`): toggle inventory overlay, does not consume a turn

**Enemy phase**:
- Iterate all alive enemies in order.
- If enemy is within sight range of player and has line-of-sight: move one tile toward player (A* or simple step toward, avoiding walls and other enemies); if adjacent: attack player instead.
- If enemy outside sight range: idle (stay put).

**Rationale**: Synchronous turn processing is idiomatic for roguelikes and guarantees deterministic state. No timing bugs, no animation stutters, no async edge cases. Matches "turn-based" in FR-007.

**Alternatives considered**:
- Animation frame loop with delta time: appropriate for real-time games; wrong for turn-based. Rejected.
- Web Workers for generation: unnecessary for BSP which runs in <5ms. Rejected.
- Promise-based async combat: adds complexity with no benefit for synchronous turn logic. Rejected.

---

## Decision 5: Module Communication Pattern

**Decision**: Shared mutable `window.GameState` object; modules are plain JS objects/functions loaded via `<script>` in dependency order.

**Structure**:
- All modules attach to `window` (e.g. `window.Dungeon`, `window.Player`, `window.Renderer`).
- `GameState` is the single source of truth: `{ dungeon, player, enemies, items, floor, config, phase }`.
- Modules expose functions that accept and mutate `GameState` directly.
- No module pattern (no IIFE closures, no ES modules) — keeps the mental model flat for a single-file game.

**Script load order** (bottom of `<body>`):
```
constants.js → dungeon.js → fov.js → items.js → player.js → enemy.js → combat.js → renderer.js → ui.js → game.js
```

**Rationale**: ES modules require a server (file:// doesn't support `import` by default in most browsers). Classic scripts with ordered loading is simpler and guaranteed to work on file:// URLs. For a game of this scope (~1000 LOC total), a shared state object is maintainable and avoids event-bus boilerplate.

**Alternatives considered**:
- ES module `import`/`export`: requires server or --allow-file-access-from-files flag in Chrome. Violates "works on file://" constraint. Rejected.
- Event bus / observer pattern: adds indirection without benefit at this scale. Rejected.
- Single-file `index.html` with inline script: works but makes the code harder to navigate. Rejected in favor of separate JS files.

---

## Decision 6: Enemy AI Approach

**Decision**: Simple greedy step-toward-player AI for engaged enemies; stationary for non-engaged.

**Engagement**: An enemy engages when the player is within its sight range AND has line-of-sight. D8 (adjacency-only vs room-wide aggro) is deferred; probe defaults to room-wide aggro (all enemies in a room activate when player enters).

**Movement**: On each enemy turn, compute Manhattan direction toward player (`dx = sign(player.x - enemy.x)`, `dy = sign(player.y - enemy.y)`). Try to move in the dominant axis first; if blocked by wall or other enemy, try the other axis; if both blocked, stay.

**Attack**: If enemy is adjacent to player (Chebyshev distance 1), attack instead of moving. Damage = `enemy.attack - player.defense` (min 1).

**Rationale**: Simple greedy AI is sufficient for a retro roguelike. Enemy pathing through winding corridors works acceptably with greedy step-toward because BSP corridors are short and straight. True A* would be correct but is overkill for the enemy density (5–10 per floor at early floors).

**Alternatives considered**:
- A* pathfinding: correct; adds ~100 LOC. Enemies may path through corridors optimally. Deferred — can upgrade in Phase 2.
- Random walk: too easy to exploit; not engaging. Rejected.
- BFS pathfinding: simpler than A*, still heavier than greedy step. Deferred with A*.

---

## Decision 7: Item and Drop System

**Decision**: Three item types (potion/weapon/armor), defined as constant objects; placed in rooms during dungeon generation; floor-scaled drop tables.

**Item types**:
- `POTION`: restores `player.hp` by `effect` (e.g. 10–20 HP), consumed on use
- `WEAPON`: sets `player.attack` to `max(player.attack, item.effect)` when equipped (auto-equip on pickup if better)
- `ARMOR`: sets `player.defense` to `max(player.defense, item.effect)` when equipped (auto-equip on pickup if better)

**Placement**: After generating rooms, randomly place 1–3 items per room (scaled by floor). Items occupy their own tile type `ITEM_GROUND`; pickup is auto on player step.

**Inventory**: Array of up to 10 item objects. Potions accumulate; weapons/armor auto-equip and do not stack in inventory (old weapon/armor goes to inventory if displaced). Full inventory (10 slots): item stays on floor, HUD log says "Inventory full."

**Rationale**: Auto-equip weapons/armor reduces required UI interaction for a keyboard-only game. Potions stack conceptually but not by count (each potion is a separate slot) — keeps inventory model simple. FR-009, FR-010 satisfied.

**Alternatives considered**:
- Stacking items by type: adds inventory count tracking; complicates rendering. Deferred.
- Manual equip only (press key to equip): needs inventory screen interaction. Can be added in Phase 2 if D8 feedback requests it.
