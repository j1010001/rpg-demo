# Tasks: Retro Dungeon Crawler RPG

**Feature**: `001-retro-dungeon-crawler`
**Input**: Design documents from `/specs/001-retro-dungeon-crawler/`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. No tests are included — this project uses manual browser validation per quickstart.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies between them)
- **[Story]**: Which user story this task belongs to ([US1]–[US4])
- All paths are relative to repository root

---

## Phase 0: Deployable Probe (Constitution Principle III — MANDATORY FIRST MILESTONE)

**Purpose**: Ship a complete playable core loop — open `index.html` via `file://`, move `@` with WASD/arrows, watch fog-of-war reveal new rooms. Proves FR-002, FR-003, FR-004, FR-015, FR-017. No enemies, items, combat, or stairs.

**⚠️ GATE**: Must work on `file://` URL — no build step, no server, no external deps.

- [x] T001 Create `index.html` with DOM structure: `#viewport > #dungeon`, `#hud` (with `#hud-hp`, `#hud-floor`, `#hud-level`, `#hud-enemies`, `#hud-log`), `#overlay` (hidden); ordered `<script>` tags at bottom of `<body>`: constants → dungeon → fov → items → player → enemy → combat → renderer → ui → game
- [x] T002 Create `style.css`: `#dungeon` as CSS grid (`grid-template-columns: repeat(80, 14px); grid-template-rows: repeat(50, 14px); font-size: 13px; font-family: monospace`); `#viewport` fixed-size with `overflow: hidden`; tile color classes (`.tile-hidden`, `.tile-seen`, `.tile-wall`, `.tile-floor`, `.tile-player`, `.tile-enemy-goblin`, `.tile-enemy-orc`, `.tile-enemy-troll`, `.tile-item`, `.tile-stair_down`); HUD layout fixed at top or side; `#overlay` centered overlay for game-over/victory
- [x] T003 [P] Create `js/constants.js`: `TILE_TYPES` object (`WALL`, `FLOOR`, `DOOR`, `STAIR_DOWN`, `ITEM_GROUND`, `EMPTY`); `VISIBILITY` object (`HIDDEN`, `SEEN`, `LIT`); `GLYPHS` map (tile types → chars, player `@`, enemies `g`/`o`/`t` (all lowercase — goblin/orc/troll), items `!`/`/`/`[`, stair `>`); enemy base stats `BASE_HP`, `BASE_ATT`, `HP_SCALE`, `ATT_SCALE` keyed by type; default `CONFIG` object (`dungeonWidth: 80`, `dungeonHeight: 50`, `sightRadius: 5`, `enemySightRange: 6`, `maxFloors: 10`, `inventoryCap: 10`, `minPartition: 8`, `minRoomSize: 4`)
- [x] T004 Create `js/dungeon.js`: `Dungeon.generate(config, floor)` — init all tiles as `{type: WALL, visibility: HIDDEN, glyph: '#', entity: null}`; recursive BSP split (stop when both axes `< 2×minPartition`; split on longer axis; split point in `[minPartition, dimension - minPartition]`); place one room per leaf (random size in `[minRoomSize, partition - 2]`, random offset with 1-tile padding, set tiles to FLOOR); connect siblings via L-shaped corridor (horizontal then vertical, randomly); place `STAIR_DOWN` at last-room center; return `{tiles, rooms, width, height, stairPos}`; `Dungeon.getTile(dungeon, x, y)` — returns `null` if out of bounds; `Dungeon.isWalkable(dungeon, x, y)` — returns `true` for FLOOR/DOOR/STAIR_DOWN/ITEM_GROUND in bounds
- [x] T005 Create `js/fov.js`: `FOV.update(gameState)` — set all tiles with `visibility === LIT` to `SEEN`; `FOV.compute(gameState)` — for each tile within `config.sightRadius` of player (circle scan), cast Bresenham line from player to tile; if line hits a WALL before reaching target tile, skip; else set `tile.visibility = LIT`
- [x] T006 Create `js/player.js`: `Player.init(startRoom)` — return player object `{x: roomCenterX, y: roomCenterY, hp: 20, maxHp: 20, attack: 3, defense: 0, level: 1, floor: 1, inventory: [], equippedWeapon: null, equippedArmor: null, enemiesDefeated: 0}`; `Player.move(dx, dy, gameState)` — compute target `(x+dx, y+dy)`; if `Dungeon.isWalkable`, update player position and call `FOV.update` + `FOV.compute`; enemy bump and item pickup handled in later phases
- [x] T007 Create `js/renderer.js`: `Renderer.init(config)` — create `config.dungeonWidth × config.dungeonHeight` `<span>` elements in `#dungeon`, each with `id="cell-{y}-{x}"`; `Renderer.render(gameState)` — iterate all tiles; HIDDEN → `textContent = ' '`, `className = 'tile-hidden'`; SEEN → wall/floor glyph, `className = 'tile-seen'`; LIT → if live enemy on tile: enemy glyph + `tile-enemy-{type.toLowerCase()}`; else if player at tile: `@` + `tile-player`; else if item on tile: item glyph + `tile-item`; else tile type glyph + `tile-{type.toLowerCase()}`; after tile loop, scroll `#viewport`: `scrollLeft = (player.x - 20) * 14`, `scrollTop = (player.y - 14) * 14`
- [x] T008 Create `js/ui.js`: `UI.render(gameState)` — set `#hud-hp` to `"HP: {hp} / {maxHp}"`, `#hud-floor` to `"Floor: {floor}"`, `#hud-level` to `"Level: {level}"`, `#hud-enemies` to `"Defeated: {enemiesDefeated}"`; update `#hud-log` with all entries from `GameState.log` as `<div>` elements newest at bottom (log is already capped at 8 by write paths — no second cap here); `UI.showGameOver(gameState)` stub (show `#overlay`, set placeholder text); `UI.showVictory(gameState)` stub
- [x] T009 Create `js/game.js`: initialize `window.GameState = {dungeon: null, player: null, enemies: [], items: [], phase: 'PLAYING', log: [], config: CONFIG}`; `initGame()` — call `Dungeon.generate(GameState.config, 1)`, assign to `GameState.dungeon`; call `Player.init(GameState.dungeon.rooms[0])`, assign to `GameState.player`; call `FOV.compute(GameState)` (note: `FOV.update` is intentionally skipped on init because no tile is LIT yet — resetting LIT→SEEN on a fresh map is a no-op; `Player.move` calls both `FOV.update` + `FOV.compute` each turn), `Renderer.init(GameState.config)`, `Renderer.render(GameState)`, `UI.render(GameState)`; `keydown` handler — map WASD/arrows to `(dx, dy)` deltas → call `Player.move(dx, dy, GameState)` → `Renderer.render(GameState)` + `UI.render(GameState)`; call `initGame()` on `DOMContentLoaded`
- [x] T010 Validate probe: open `index.html` via `file://` in browser; confirm `@` renders in first room; WASD/arrow keys move player; fog-of-war reveals tiles on approach; previously visited tiles remain dimmed; wall tiles block movement; HUD shows HP and floor number

**Checkpoint**: Probe deployed and manually validated — full implementation may now proceed

---

## Phase 1: Setup

**Note**: No additional setup required. This is a zero-build static project. All project files are created in Phase 0.

---

## Phase 2: Foundational

**Note**: `js/constants.js` (T003) and `window.GameState` schema (T009) are the blocking prerequisites for all user story modules — both created in Phase 0. No additional foundational tasks required.

---

## Phase 3: User Story 1 — Dungeon Exploration (Priority: P1) 🎯 MVP

**Goal**: Player explores a procedurally generated fog-of-war dungeon via keyboard — all four US1 acceptance scenarios from spec.md pass.

**Independent Test**: Open `index.html`; move through the dungeon; confirm all 4 scenarios from quickstart.md "User Story 1 — Dungeon Exploration" section pass manually.

- [x] T011 [US1] Verify stair tile `>` is placed in last room by `Dungeon.generate` (T004) and renders in cyan when LIT; stepping onto it must not crash (no activation logic yet — that is US4)
- [x] T012 [US1] Run quickstart.md User Story 1 validation: Scenario 1 (starting visibility), Scenario 2 (map expands on movement), Scenario 3 (visited tiles persist as SEEN), Scenario 4 (wall collision blocks); confirm SC-001 (map expands per step) and SC-002 (≥8 rooms) by visual inspection or `console.log(GameState.dungeon.rooms.length)`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 — Enemy Combat (Priority: P2)

**Goal**: Enemies placed in dungeon rooms, turn-based combat resolves with correct damage math, enemies pursue player, game-over overlay on player death.

**Independent Test**: Navigate to a room with enemies; bump into an enemy to attack; survive several turns; let HP reach 0 and confirm game-over overlay shows floor and enemies defeated.

- [x] T013 [P] [US2] Create `js/enemy.js`: `Enemy.placeForFloor(dungeon, floor)` — iterate rooms 1..N (skip rooms[0]); count `Math.floor(1 + floor / 3)` enemies per room; type distribution: floors 1–3 → GOBLIN only; floors 4–6 → GOBLIN + ORC; floors 7+ → all three types; for each enemy pick a random walkable floor tile in the room, set `tile.entity = enemy`, push to `GameState.enemies`; enemy stats from `BASE_HP[type] + floor * HP_SCALE[type]` and `BASE_ATT[type] + floor * ATT_SCALE[type]`; each enemy object carries `sightRange: CONFIG.enemySightRange` (default 6, from `js/constants.js`); `Enemy.ai(enemy, gameState)` — skip if `!enemy.alive`; compute Chebyshev distance to player; if distance > `enemy.sightRange`, idle; else compute `dx = Math.sign(player.x - enemy.x)`, `dy = Math.sign(player.y - enemy.y)`; if Chebyshev distance 1 (adjacent): call `Combat.enemyAttack(enemy, gameState)`; else try move on dominant axis, fallback to other axis, stay if both blocked
- [x] T014 [P] [US2] Create `js/combat.js`: `Combat.playerAttack(enemy, gameState)` — `damage = Math.max(1, player.totalAttack)`; `enemy.hp -= damage`; if `enemy.hp <= 0`: set `enemy.alive = false`, `player.enemiesDefeated++`, push `"You defeated the \(enemy.type)."` to `GameState.log`; else push `"You hit \(enemy.type) for \(damage)."` to log; cap log at 8 entries; `Combat.enemyAttack(enemy, gameState)` — `damage = Math.max(1, enemy.attack - player.totalDefense)`; `player.hp -= damage`; push `"\(enemy.type) hits you for \(damage)."` to log; cap log at 8 entries
- [ ] T015 [US2] Update `js/game.js`: in `initGame()`, after `Dungeon.generate` returns and `GameState.dungeon` is assigned, initialize `GameState.enemies = []` then call `Enemy.placeForFloor(GameState.dungeon, GameState.player.floor)` to populate `GameState.enemies`; `Dungeon.generate` must NOT call Enemy functions directly — `game.js` is the orchestrator that sequences generation → enemy placement → item placement → render (this keeps dungeon.js free of cross-module calls and satisfies the window.GameState communication principle)
- [ ] T016 [US2] Update `js/player.js`: add `Player.totalAttack(player)` returning `player.attack + (player.equippedWeapon?.effect ?? 0)` and `Player.totalDefense(player)` returning `player.defense + (player.equippedArmor?.effect ?? 0)`; in `Player.move(dx, dy, gameState)` — before walkable check, compute target tile; if target tile has a live enemy (`tile.entity && tile.entity.alive`), call `Combat.playerAttack(tile.entity, gameState)` and return without moving
- [ ] T017 [US2] Update `js/game.js`: after `Player.move`, call `processEnemyPhase(gameState)` — iterate `GameState.enemies`, call `Enemy.ai(enemy, gameState)` for each alive enemy, then filter out dead enemies (`GameState.enemies = GameState.enemies.filter(e => e.alive)`); after enemy phase, check `GameState.player.hp <= 0` → set `GameState.phase = 'GAME_OVER'` and call `UI.showGameOver(GameState)`; skip further render if phase is GAME_OVER
- [x] T018 [US2] Update `js/renderer.js`: in `Renderer.render`, LIT tile entity check — if `tile.entity` is an enemy object (has `.glyph` and `.alive === true`): set `textContent = tile.entity.glyph`, `className = 'tile-enemy-' + tile.entity.type.toLowerCase()`; this overrides floor tile rendering per render-contract.md priority order
- [x] T019 [P] [US2] Implement `UI.showGameOver(gameState)` in `js/ui.js`: remove `display:none` from `#overlay`; set inner HTML to "GAME OVER", `"Floor reached: \(player.floor)"`, `"Enemies defeated: \(player.enemiesDefeated)"`, `"[R] Restart"`; add one-time `keydown` listener: if key `r`/`R` → `window.location.reload()`
- [ ] T020 [US2] Validate US2 acceptance scenarios 1–5 from quickstart.md: enemy visible when room is LIT; bump-attack deals damage and logs message; enemy counterattacks and logs message; player death shows game-over overlay with correct stats; enemy removal on death clears tile glyph

**Checkpoint**: User Story 2 is fully functional and independently testable

---

## Phase 5: User Story 3 — Character Progression & Items (Priority: P3)

**Goal**: Items placed in dungeon rooms, auto-pickup on step, 10-slot inventory, potions restore HP, weapons/armor auto-equip if better, `I` opens inventory overlay, `1`–`0` use/equip items.

**Independent Test**: Pick up a potion, open inventory with `I`, press `1` to use it, confirm HP increases in HUD and potion disappears from inventory.

- [ ] T021 [P] [US3] Create `js/items.js`: define item pools — POTION: `[{name: "Health Potion", effect: 10}, {name: "Strong Potion", effect: 20}]`; WEAPON: `[{name: "Dagger", effect: 2}, {name: "Short Sword", effect: 4}, {name: "Broadsword", effect: 6}, {name: "War Axe", effect: 8}]`; ARMOR: `[{name: "Leather Armor", effect: 1}, {name: "Chain Mail", effect: 3}, {name: "Plate Armor", effect: 5}]`; `Items.placeForFloor(dungeon, floor)` — for each room except rooms[0], place 1–3 items; weight POTION at 60% on floors 1–3, 40% on floors 4–6, 20% on floors 7+; pick random walkable tile in room, set `tile.type = ITEM_GROUND`, `tile.entity = item`, push to `GameState.items`; `Items.pickup(item, gameState)` — if `inventory.length >= inventoryCap`: push "Inventory full." to log and return false; else push item, clear `tile.entity`, reset `tile.type = FLOOR`, auto-equip if weapon/armor better; return true; `Items.usePotion(index, gameState)` — `player.hp = Math.min(player.hp + item.effect, player.maxHp)`, remove from inventory, log, cap `GameState.log` at 8 entries; `Items.equipItem(index, gameState)` — equip weapon or armor if better, displace old to inventory if space; log result, cap `GameState.log` at 8 entries
- [ ] T022 [US3] Update `js/game.js`: in `initGame()` and floor-transition logic, after `Enemy.placeForFloor` is called, initialize `GameState.items = []` then call `Items.placeForFloor(GameState.dungeon, GameState.player.floor)`; confirm `tile.type = ITEM_GROUND` and `tile.entity = item` are set; `Dungeon.generate` must NOT call Items functions directly — game.js orchestrates the full sequence: generate → enemies → items → render
- [ ] T023 [US3] Update `js/player.js`: in `Player.move`, after successful move to new position, check if `tile.type === ITEM_GROUND` → call `Items.pickup(tile.entity, gameState)`; update `Player.totalAttack` and `Player.totalDefense` functions to reference `gameState.player.equippedWeapon` and `equippedArmor`
- [ ] T024 [US3] Update `js/renderer.js`: in `Renderer.render`, for LIT tiles where `tile.type === ITEM_GROUND` and no live enemy is present: set `textContent = tile.entity.glyph`, `className = 'tile-item'`
- [ ] T025 [P] [US3] Update `js/ui.js`: add `UI.renderInventory(gameState)` — populate a `#inventory` overlay element (add to index.html in T001 or add now) listing each inventory item as `"{slotNumber}: {item.name} ({item.type}, +{item.effect})"`, marking equipped items; add `UI.toggleInventory()` to toggle `display` on `#inventory`; add `#inventory` to `index.html` if not already present (hidden by default)
- [ ] T026 [US3] Update `js/game.js`: in `keydown` handler, add `I`/`i` → call `UI.toggleInventory()` (does not consume a turn, does not trigger enemy phase); add keys `1`–`0` (slots 0–9) → if inventory has item at that slot: POTION → `Items.usePotion(index, gameState)`; WEAPON/ARMOR → `Items.equipItem(index, gameState)`; then full re-render
- [ ] T027 [US3] Validate US3 acceptance scenarios 1–4 from quickstart.md: item auto-pickup on step; potion use restores HP up to max and removes potion; better weapon auto-equips and updates attack stat in HUD; `I` opens inventory listing all held items with effects

**Checkpoint**: User Story 3 is fully functional and independently testable

---

## Phase 6: User Story 4 — Floor Descent (Priority: P4)

**Goal**: Stepping on `>` generates a new deeper floor, player stats and inventory persist, enemies scale with floor, game ends with VICTORY on floor 10.

**Independent Test**: Find staircase tile, step on it, verify floor counter increments and HP/inventory unchanged; on floor 10 step on stair to see VICTORY overlay.

- [ ] T028 [P] [US4] Update `js/game.js`: add `descend(gameState)` helper — if `player.floor >= config.maxFloors` → set `GameState.phase = 'VICTORY'`, call `UI.showVictory(GameState)` and return; else `player.floor++`, `player.level = player.floor`, call `Dungeon.generate(GameState.config, player.floor)` (assigns new dungeon), then call `Enemy.placeForFloor` and `Items.placeForFloor` (same sequence as initGame — game.js is the orchestrator; staircase detection lives here rather than in player.js because descending requires calling Dungeon.generate and full re-placement, which is game-level orchestration, not a player-level concern), re-place player at `GameState.dungeon.rooms[0]` center, call `FOV.compute(GameState)`, full re-render; in the keydown handler post-move, call `descend(GameState)` if player tile is `STAIR_DOWN`
- [ ] T029 [P] [US4] Verify `js/dungeon.js` floor scaling end-to-end: `Enemy.placeForFloor` type distribution produces ORCs on floor 4+ and TROLLs on floor 7+ (validate via `console.log` or visual inspection); confirm `stairPos` is always placed; confirm floor scaling formulas in `js/constants.js` produce visibly stronger enemies at higher floors (higher HP = more hits to kill per combat log)
- [x] T030 [P] [US4] Implement `UI.showVictory(gameState)` in `js/ui.js`: remove `display:none` from `#overlay`; set inner HTML to "VICTORY", `"You survived all 10 floors!"`, `"Enemies defeated: \(player.enemiesDefeated)"`, `"[R] Play Again"`; add one-time `keydown` listener: if `r`/`R` → `window.location.reload()`
- [ ] T031 [US4] Validate US4 acceptance scenarios 1–4 from quickstart.md: stair step transitions to new generated floor; HP and inventory identical after descent; enemy stats visibly stronger on deeper floors (HUD log damage numbers); dying on any floor shows game-over with correct floor number; verify SC-004 (full run consistency) and SC-005 (no perceptible lag after 10 floors)

**Checkpoint**: User Story 4 complete. Full roguelike loop — explore → fight → loot → descend — is playable end-to-end.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Edge case robustness, browser compatibility verification, aesthetic polish, final success criteria validation.

- [x] T032 [P] Verify all CSS tile classes in `style.css` match render-contract.md color defaults: `.tile-hidden` black bg no glyph; `.tile-seen` dim `#2a2a2a`; `.tile-wall` `#888`; `.tile-floor` `#444`; `.tile-player` `#0f0`; `.tile-enemy-goblin` `#f00`; `.tile-enemy-orc` `#f60`; `.tile-enemy-troll` `#f0f`; `.tile-item` `#ff0`; `.tile-stair_down` `#0ff`
- [ ] T033 Validate full-inventory edge case in `index.html` via `js/items.js`: fill inventory to 10 items, step on an 11th item tile; confirm item stays on floor, HUD log appends "Inventory full.", and no crash or silent failure occurs
- [x] T034 Validate boundary movement in `index.html` via `js/dungeon.js` and `js/player.js`: move player to dungeon border (row 0, row 49, col 0, col 79); confirm `Dungeon.isWalkable` blocks movement, player position does not change, no `undefined` array access or console error
- [x] T035 [P] Run full quickstart.md success criteria checklist SC-001 through SC-006; document pass/fail for each criterion
- [x] T036 [P] Open `index.html` via `file://` in Chrome 90+, Firefox 88+, and Safari 14+; confirm no browser-specific console errors and all gameplay features work correctly per FR-014
- [x] T037 [P] Add persistent `#legend` element to `index.html` and `style.css`: fixed position (bottom-left), low opacity (0.6), retro monochrome styling matching HUD; content: controls section (WASD / ↑↓←→ = move, I = inventory, R = restart) and objective section (find `>` to descend, survive to floor 10); validates SC-006 (new player identifies objective within 60 seconds from visual cues alone without external instructions)

---

## Phase 7: Delta Requirements — Probe Decisions (R100–R103)

**Purpose**: Apply the four probe-decided requirements from the senate delta vote: Chebyshev FOV (R100), floor-10 victory-on-entry (R101), green-on-black palette (R102), room-wide enemy aggro (R103).

**Independent Test**: Open `index.html`; confirm all glyphs/HUD/log render green (#00ff00) on black (#000000) with no other foreground colors; enter a room and confirm all enemies immediately pursue without needing adjacency; descend from floor 9 and confirm victory screen appears on arrival at floor 10; move in open space and confirm the FOV lit area is square (Chebyshev), not circular.

- [ ] T038 [P] Update `style.css` for R102 (green-on-black): set `body` `color: #00ff00; background: #000000`; change every non-green tile class to `color: #00ff00` — `.tile-wall`, `.tile-floor`, `.tile-player`, `.tile-enemy-goblin`, `.tile-enemy-orc`, `.tile-enemy-troll`, `.tile-item`, `.tile-stair_down`; change `.tile-seen` to a dimmed green (`color: #006600`) to preserve the LIT/SEEN visual distinction; update `#hud`, `#hud-log`, `#overlay`, `#legend`, `#inventory` foreground to `#00ff00`; remove all non-green foreground color declarations from `style.css`
- [ ] T039 [P] Update `js/fov.js` for R100 (Chebyshev distance): in the radius scan loop that iterates candidate tiles, replace any Euclidean/circular distance condition (`dx*dx + dy*dy <= r*r` or equivalent) with the Chebyshev condition `Math.max(Math.abs(dx), Math.abs(dy)) <= config.sightRadius`; this makes the lit area a filled square of side `2*sightRadius+1` (11×11 at radius 5) centered on the player, exactly as R100 specifies; no other changes to the Bresenham wall-check logic
- [ ] T040 [P] Update `js/enemy.js` for R103 (room-wide aggro — data model): in `Enemy.placeForFloor`, add `roomId: room.id` and `active: false` to each enemy object at creation time; in `Enemy.ai`, replace the sight-range activation check with: if `enemy.active === false`, remain stationary and return; if `enemy.active === true`, always compute direction toward player and pursue (omit the `sightRange` distance/line-of-sight gate entirely for activated enemies)
- [ ] T041 Update `js/game.js` for R103 (room-wide aggro — activation trigger): add helper `activateRoomEnemies(gameState)` — iterate `gameState.dungeon.rooms`; find the room where `player.x >= room.x && player.x < room.x + room.width && player.y >= room.y && player.y < room.y + room.height`; if a room is found, set `enemy.active = true` for every enemy in `gameState.enemies` where `enemy.roomId === room.id`; call `activateRoomEnemies(GameState)` in the `keydown` handler immediately after `Player.move` returns and before `processEnemyPhase` so room aggro fires before the enemy phase each turn
- [ ] T042 Update `js/game.js` `descend()` for R101 (victory on entering floor 10): move the victory check to AFTER `player.floor++` — new order: `player.floor++; player.level = player.floor; if (player.floor >= config.maxFloors) { GameState.phase = 'VICTORY'; UI.showVictory(GameState); return; }` then proceed with `Dungeon.generate`, enemy/item placement, player repositioning, and re-render; this ensures entering floor 10 is itself the win condition (no staircase needed on floor 10 per R101); confirm no floor 11 is ever generated
- [ ] T043 Validate all four delta requirements in `index.html`: (R100) move player in an open room and confirm the FOV reveals a square halo of tiles (11×11 at radius 5) — Chebyshev, not a circle; (R101) descend from floor 9 → confirm victory screen fires immediately on arrival at floor 10 without stepping on any staircase; (R102) confirm every visible element — tile glyphs, `@`, enemy glyphs, `>`, `!`/`/`/`[`, `#`, `.`, HUD text, log lines, overlays, legend — renders in green on black, with no red, cyan, yellow, or magenta remaining; (R103) enter a room with multiple enemies and confirm all enemies in that room begin pursuing the player on the very next turn, even from across the room without line-of-sight

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Probe)**: No dependencies — implements core exploration loop and validates all US1 acceptance scenarios
- **Phase 1–2 (Setup/Foundational)**: Covered by Phase 0 outputs; no additional tasks
- **Phase 3 (US1)**: Depends on Phase 0 completion; confirms acceptance criteria formally
- **Phase 4 (US2)**: Depends on Phase 0 (`js/dungeon.js`, `js/player.js`, `js/renderer.js`, `js/game.js` all required)
- **Phase 5 (US3)**: Depends on Phase 4 (combat log infrastructure in `combat.js` is shared)
- **Phase 6 (US4)**: Depends on Phase 5 (inventory must persist across floor transitions)
- **Phase N (Polish)**: Depends on all user story phases complete
- **Phase 7 (Delta)**: Depends on Phase N; applies four probe-decided requirements (R100–R103) as amendments to existing files

### User Story Dependencies

- **US1 (P1)**: Validated after Phase 0; no dependencies on other stories
- **US2 (P2)**: Requires GameState, `dungeon.js`, `player.js`, `renderer.js` from Phase 0
- **US3 (P3)**: Requires US2 for combat log infrastructure (`combat.js`); otherwise independent
- **US4 (P4)**: Requires US2 (enemies re-placed on new floor) and US3 (inventory persists)

### Within Each User Story Phase

- New module files marked `[P]` can be created in parallel (different files, no conflict)
- Update tasks on existing files must be sequenced (one at a time to avoid line conflicts)
- Validation task (T010, T012, T020, T027, T031) runs last in each phase

### Parallel Opportunities

```bash
# Phase 0 — constants.js creation is independent:
Task T003: Create js/constants.js     # [P] — no deps

# Phase 4 (US2) — two new modules + UI stub in parallel:
Task T013: Create js/enemy.js         # [P] — new file
Task T014: Create js/combat.js        # [P] — new file
Task T019: Update js/ui.js showGameOver  # [P] — UI only, no combat.js dep

# Phase 5 (US3) — new module + UI overlay in parallel:
Task T021: Create js/items.js         # [P] — new file
Task T025: Update js/ui.js inventory  # [P] — UI only

# Phase 6 (US4) — three parallel tasks after US3 complete:
Task T028: Update js/game.js floor descent [P]   # parallel with T029/T030
Task T029: Verify dungeon floor scaling         # [P]
Task T030: Implement UI.showVictory             # [P]

# Phase N — independent browser/CSS checks in parallel:
Task T032: Verify CSS color classes   # [P]
Task T035: Run SC-001–SC-006 checklist # [P]
Task T036: Cross-browser validation   # [P]

# Phase 7 (Delta) — three independent file edits in parallel, then two sequential game.js edits:
Task T038: Update style.css (R102)    # [P] — different file from T039/T040
Task T039: Update js/fov.js (R100)   # [P] — different file
Task T040: Update js/enemy.js (R103) # [P] — different file
# T038/T039/T040 complete, then sequentially:
Task T041: Update js/game.js room activation (R103)  # depends on T040
Task T042: Update js/game.js descend victory (R101)  # sequential after T041 (same file)
Task T043: Validate all delta requirements            # last, after all above
```

---

## Implementation Strategy

### MVP First (Phase 0 + US1 — 12 tasks)

1. Complete Phase 0 (Probe): T001–T010
2. Complete Phase 3 (US1 validation): T011–T012
3. **STOP and VALIDATE**: Open browser, run all US1 quickstart scenarios manually
4. Demo-ready: working fog-of-war dungeon explorer

### Incremental Delivery

1. Phase 0 + Phase 3 → Dungeon explorer (US1 complete) — demo-able
2. Add Phase 4 (US2) → Combat and game-over screen — playable with stakes
3. Add Phase 5 (US3) → Items, inventory, stat progression — full depth
4. Add Phase 6 (US4) → Floor transitions, victory condition — complete roguelike
5. Phase N → Polish, edge cases, browser compatibility
6. Phase 7 (Delta) → Apply probe decisions: green-on-black, Chebyshev FOV, room-wide aggro, floor-10 victory

---

## Notes

- `[P]` tasks operate on different files with no shared state conflicts — safe to parallelize
- `[Story]` labels map directly to user stories in spec.md for traceability
- No build step — all tasks produce static files openable via `file://` per FR-014 and Constitution Principle IV
- Validation tasks require a real browser session; no unit test harness exists
- Deferred dimensions (D3 sight radius, D5 victory condition, D7 color palette, D8 enemy aggro) are intentionally left as tunable constants until probe feedback — do not pre-implement
- `index.html` script load order is critical and must not change: constants → dungeon → fov → items → player → enemy → combat → renderer → ui → game
- `GameState.log` is capped at 8 entries at every write path (`combat.js` and `items.js` both cap after push); `ui.js` renders the full array trusting the cap — do not add a second cap in the UI read path
- Post-move checks are intentionally split: bump-attack (T016) and item pickup (T023) live in `Player.move` in `player.js` because they inspect the target tile before/after movement; staircase detection (T028) lives in `game.js` because descending requires calling `Dungeon.generate` and full re-placement, which is game-level orchestration beyond player.js scope
