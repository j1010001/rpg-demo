# Feature Specification: Retro Dungeon Crawler RPG

**Feature Branch**: `001-retro-dungeon-crawler`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "build a birdseye-view retro dungen-crawler RPG game with map being generated as the play progresses"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dungeon Exploration (Priority: P1)

A player opens the game in their browser and is placed at the entrance of a dungeon. They move their character around using keyboard controls. As they step into unexplored areas, new rooms and corridors are revealed — the map expands dynamically. Previously visited areas remain visible; unvisited areas remain shrouded in fog.

**Why this priority**: This is the defining mechanic of the game. Without procedural map generation tied to player movement, nothing else is meaningful.

**Independent Test**: Can be fully tested by moving through the dungeon and confirming that new tiles are revealed only upon approach, and that the total map grows as movement continues — delivers the core exploration loop with no other feature needed.

**Acceptance Scenarios**:

1. **Given** the game just loaded, **When** the player views the screen, **Then** only the starting room (or immediate surroundings) is visible and the rest of the dungeon is hidden.
2. **Given** the player is at the edge of the revealed map, **When** they move in a direction, **Then** new tiles (rooms/corridors) are generated and revealed in that direction.
3. **Given** the player has explored an area and returned, **When** they view the map, **Then** previously revealed tiles remain visible.
4. **Given** the player is adjacent to a wall, **When** they attempt to move into it, **Then** movement is blocked and no new tiles are generated.

---

### User Story 2 - Enemy Combat (Priority: P2)

A player exploring the dungeon walks into a room containing enemies. A turn-based combat exchange begins: the player attacks, then all enemies in range respond. If the player's HP reaches zero, a game-over screen is shown. If an enemy's HP reaches zero, it is removed from the map. Players learn to manage risk by avoiding overwhelm.

**Why this priority**: Combat is the primary tension driver. Without it, exploration has no stakes and the game lacks challenge.

**Independent Test**: Can be fully tested by navigating to a room with enemies and fighting until either the player dies or the enemies are defeated — delivers a full risk/reward loop.

**Acceptance Scenarios**:

1. **Given** the player enters a room, **When** an enemy is present in that room, **Then** the enemy is visible on the map.
2. **Given** the player moves onto or attacks an adjacent enemy tile, **When** the player takes their turn, **Then** the player deals damage to the enemy and the enemy's HP decreases.
3. **Given** an enemy is alive after the player's turn, **When** it is the enemy's turn, **Then** the enemy moves toward or attacks the player.
4. **Given** the player's HP drops to zero, **When** the update resolves, **Then** a game-over screen is displayed with the floor reached and enemies defeated.
5. **Given** an enemy's HP drops to zero, **When** the update resolves, **Then** the enemy is removed from the map and may drop an item.

---

### User Story 3 - Character Progression & Items (Priority: P3)

As the player defeats enemies and finds items scattered in dungeon rooms, they collect weapons, potions, and armor. Using a potion restores HP. Equipping a better weapon increases attack damage. This allows players to make meaningful choices about risk and resource management across a run.

**Why this priority**: Items give depth to the exploration loop and create run-to-run variety. The game is playable without them but becomes repetitive.

**Independent Test**: Can be fully tested by picking up an item, verifying it appears in the player's inventory, and using/equipping it to confirm a stat change.

**Acceptance Scenarios**:

1. **Given** an item is present on the dungeon floor, **When** the player moves onto the item tile, **Then** the item is added to the player's inventory.
2. **Given** the player has a health potion in inventory, **When** they use it, **Then** their HP increases (up to max HP) and the potion is consumed.
3. **Given** the player has a weapon in inventory better than their current weapon, **When** they equip it, **Then** their attack power increases accordingly.
4. **Given** the player's inventory is displayed, **When** the player views it, **Then** all held items with their effects are listed.

---

### User Story 4 - Floor Descent (Priority: P4)

Once the player has sufficiently explored a floor or found the staircase, they can descend to a deeper dungeon floor. The next floor is a freshly generated dungeon with more and stronger enemies. The player retains their stats and inventory between floors. This continues until the player dies (permadeath — no save between sessions).

**Why this priority**: Floor progression adds long-term structure and escalating challenge. It is the roguelike loop that gives the game replayability.

**Independent Test**: Can be fully tested by finding and activating the staircase tile, which transitions to a new floor with increased difficulty and the player's current stats intact.

**Acceptance Scenarios**:

1. **Given** the player reaches the staircase tile on the current floor, **When** they step onto it, **Then** a new dungeon floor is generated and the player is placed at its entrance.
2. **Given** the player descends to the next floor, **When** the new floor loads, **Then** the player retains the same HP, inventory, and level as before descending.
3. **Given** the player is on floor N, **When** they descend, **Then** enemies on floor N+1 have higher base stats than enemies on floor N.
4. **Given** the player dies on any floor, **When** game-over is shown, **Then** the run ends and the player must restart from floor 1.

---

### Edge Cases

- What happens when the player attempts to move outside the generated dungeon boundary before new tiles are ready? Movement is blocked until generation completes (synchronous generation per step).
- How does the system handle an inventory that is full when the player steps on an item? The item remains on the floor; the player receives a notification that inventory is full.
- What happens if a player is surrounded by enemies with no viable escape? Combat continues turn-by-turn until the player dies or uses a consumable to break out.
- What happens if random generation produces a disconnected room with no path to stairs? The generation algorithm guarantees all rooms are connected via corridors.

## Requirements *(mandatory)*

> **Provenance required** (Constitution Principle V): every requirement MUST include a
> `Decided by` block. Requirements without provenance are invalid and MUST NOT be implemented.

### Functional Requirements

- **FR-001**: System MUST render the dungeon as a top-down, grid-based map where each cell is a tile (wall, floor, door, staircase, or empty/fog).
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-002**: System MUST procedurally generate new dungeon rooms and corridors as the player moves into unexplored areas, extending the map on demand rather than pre-generating the entire floor upfront.
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-003**: System MUST apply a fog-of-war mechanic: tiles the player has never visited are hidden; tiles within a defined sight radius of the player are visible; tiles previously visited but outside sight radius are dimmed (seen but not actively lit).
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-004**: System MUST support player movement via keyboard (WASD and/or arrow keys), advancing one tile per keypress.
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-005**: System MUST track and display the player's current HP, max HP, level, and floor number on a HUD visible at all times during gameplay.
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-006**: System MUST place enemies in generated rooms according to floor difficulty (enemy count and strength scale with floor number).
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-007**: System MUST resolve combat in turns: player attacks first on their move action; surviving enemies respond by moving toward or attacking the player.
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-008**: System MUST end the current run and display a game-over screen when the player's HP reaches zero, showing the floor reached and total enemies defeated.
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-009**: System MUST allow the player to pick up items by moving onto item tiles; items are added to an inventory capped at 10 slots.
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-010**: System MUST support at least three item types: health potions (restore HP), weapons (increase attack), and armor (increase defense).
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-011**: System MUST place one staircase tile per floor that, when stepped on, generates a new deeper floor and transitions the player to it with their current inventory and stats.
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-012**: System MUST render all game visuals using a retro aesthetic: monochrome or limited color palette with ASCII glyphs or simple tile characters for all entities (e.g., `@` for player, `g` for goblin, `#` for wall, `.` for floor).
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-013**: System MUST guarantee all generated rooms on a floor are reachable from the player's starting position via corridors.
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

- **FR-014**: System MUST run entirely in a browser with no server, build step, or external dependencies — using only HTML, CSS, and vanilla JavaScript (per Constitution Principle IV).
  > Decided by: Jan Bernatik (Product Owner) | Weight: 100% | Date: 2026-06-15

### Key Entities

- **Player**: Position (x, y), current HP, max HP, attack power, defense, level, floor number, inventory (ordered list of items, max 10).
- **Tile**: Grid cell type — one of: wall, floor, door, staircase-down, item-ground, empty/fog. Visibility state: hidden, dimmed, lit.
- **Room**: Rectangular region of floor tiles with a width and height; linked to adjacent rooms via corridors.
- **Corridor**: Horizontal or vertical strip of floor tiles connecting two rooms.
- **Enemy**: Position (x, y), HP, max HP, attack, type label, glyph character. Behavior: move toward player when in sight range, attack when adjacent.
- **Item**: Type (potion/weapon/armor), effect value (HP restored / attack bonus / defense bonus), glyph character. May be on the ground (has position) or in inventory (no position).
- **Run**: A single playthrough session — starts at floor 1, ends on player death. No persistence between browser sessions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The dungeon map visibly expands as the player moves into previously unvisited areas — new rooms and corridors appear for every exploratory step, with no pre-revealed content beyond the starting position.
- **SC-002**: A full floor contains at least 8 connected rooms after complete exploration, with every room reachable without backtracking through walls.
- **SC-003**: A combat encounter between the player and a single enemy resolves (enemy dies or player dies) within 20 turns without any state inconsistency.
- **SC-004**: Players can complete a full run (floors 1 through death or floor 10) with game state remaining consistent — no missing HUD data, no orphaned enemies, no inaccessible rooms.
- **SC-005**: The game renders and accepts input without perceptible lag on a modern desktop browser at any point during a session, including after 10+ floors of exploration.
- **SC-006**: A new player with no instructions can identify the objective (reach the stairs, survive enemies) within 60 seconds of first opening the game, based on on-screen visual cues alone.

## Assumptions

- Single-player only; no multiplayer or networked features.
- Roguelike permadeath: no save file, no mid-run resume between browser sessions. State resets on page reload.
- Turn-based movement and combat: game state only advances when the player takes an action (moves or attacks).
- Keyboard-only controls; no mouse interaction required for core gameplay.
- Retro aesthetic means ASCII-style character glyphs on a dark background — no sprite images, no external art assets. All rendering is done in-browser via DOM or `<canvas>`.
- Map generation per step: when the player approaches an unexplored boundary, the next room/corridor is generated synchronously so there is no loading state or delay.
- Enemy AI is simple line-of-sight pursuit: enemies move one tile per turn toward the player if within a defined sight range, otherwise remain stationary.
- Maximum floor depth is 10; on surviving floor 10 the player wins and a victory screen is shown.
- No audio in v1; a silent game is acceptable.
- Inventory cap of 10 items; full inventory silently refuses new pickups with a message in the HUD log.
- All randomness is seeded per run from the session start; reproducibility within a run is desirable but not required.
