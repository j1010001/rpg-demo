# Quickstart & Validation Guide: Retro Dungeon Crawler RPG

**Branch**: `001-retro-dungeon-crawler`

This document is a validation guide — it tells you how to run the game and confirm each acceptance scenario passes. It does not contain implementation code.

---

## Prerequisites

- Any modern desktop browser (Chrome 90+, Firefox 88+, Safari 14+)
- No build step, no server, no installation

---

## Running the Game

```bash
# Option 1: Open directly in browser (file:// URL)
open index.html

# Option 2: Serve from a local static server (optional, not required)
python3 -m http.server 8080
# then open http://localhost:8080
```

The game loads immediately. No network requests are made.

---

## Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Move up |
| `S` / `↓` | Move down |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `I` | Toggle inventory |
| `1`–`0` | Use item in inventory slot |
| Any movement key adjacent to enemy | Attack enemy (bump-to-attack) |

---

## Validation Scenarios

### User Story 1 — Dungeon Exploration

**Scenario 1**: Starting visibility
- Load `index.html`
- **Expected**: Only the starting room (and adjacent corridors within sight radius) is visible. All other tiles are dark. The player `@` is visible in the center of the first room.

**Scenario 2**: Map expands on movement
- Move in any direction until you reach the edge of the revealed area.
- **Expected**: New tiles (room or corridor) appear in the direction of movement. The total visible map area grows. Previously dark tiles begin to resolve.

**Scenario 3**: Previously visited tiles persist
- Move into a room, then move back to the start.
- **Expected**: Tiles you already visited appear dimmed (not dark) — they remain visible but not fully lit. No tiles "disappear" after being revealed.

**Scenario 4**: Wall collision
- Walk into a wall tile (`#`).
- **Expected**: Movement is blocked; no new tiles generate; player position does not change.

---

### User Story 2 — Enemy Combat

**Scenario 1**: Enemy visibility
- Explore until you find a room containing an enemy glyph (`g`, `o`, or `T`).
- **Expected**: The enemy glyph is visible when the room is lit by your FOV. Enemies outside FOV are not visible.

**Scenario 2**: Player attacks enemy
- Walk into a tile adjacent to an enemy (bump-to-attack).
- **Expected**: HUD log appends a line like `"You hit Goblin for 4."`. Enemy HP decreases (if HP bar or log is visible).

**Scenario 3**: Enemy counterattacks
- After attacking an enemy, wait for its turn.
- **Expected**: HUD log appends `"Goblin hits you for 2."`. Player HP in HUD decreases.

**Scenario 4**: Game over
- Continue fighting until player HP = 0.
- **Expected**: A game-over overlay appears. It shows "Floor Reached: N" and "Enemies Defeated: M". No further input is accepted (or only "restart" is).

**Scenario 5**: Enemy defeated
- Continue attacking an enemy until its HP ≤ 0.
- **Expected**: Enemy glyph disappears from the map. `player.enemiesDefeated` increments. The tile reverts to floor (`.`).

---

### User Story 3 — Items & Inventory

**Scenario 1**: Item pickup
- Move onto a tile containing an item glyph (`!`, `/`, or `[`).
- **Expected**: Item disappears from the floor. Press `I` to open inventory and confirm the item appears there.

**Scenario 2**: Use health potion
- With a potion in inventory, take some damage, then press `1` (or the slot key for the potion).
- **Expected**: Player HP increases (up to max HP). Potion is removed from inventory. HUD log shows a message.

**Scenario 3**: Equip better weapon
- Pick up a weapon with higher effect than current.
- **Expected**: Player attack stat in HUD increases. The new weapon is shown as equipped in inventory. Old weapon moved to an inventory slot if space allows.

**Scenario 4**: View inventory
- Press `I` at any time.
- **Expected**: An overlay lists all held items with type, name, and effect value. No items are missing or duplicated.

---

### User Story 4 — Floor Descent

**Scenario 1**: Step on staircase
- Find the `>` tile and step onto it.
- **Expected**: Screen transitions; a new dungeon floor is generated. Floor counter in HUD increments. Player appears at the start of the new floor.

**Scenario 2**: Stats persist across floors
- Note player HP and inventory before descending.
- **Expected**: After descent, HP and inventory are identical to pre-descent values. No reset.

**Scenario 3**: Enemies are stronger on deeper floors
- Compare enemy HP/attack on floor 1 vs floor 3+ (via HUD log damage numbers).
- **Expected**: Enemies deal more damage and take more hits to kill on higher floors.

**Scenario 4**: Permadeath — die on any floor
- Allow player HP to reach 0 on any floor.
- **Expected**: Game-over screen shows floor number (not necessarily floor 1). Only a restart option is available.

---

### Edge Cases

**Full inventory**
- Fill inventory to 10 items (pick up 10 items).
- Walk onto an 11th item.
- **Expected**: Item stays on floor. HUD log shows "Inventory full." No crash or silent failure.

**Boundary movement**
- Try to move to the edge of the dungeon map (outer wall row/column).
- **Expected**: Movement is blocked. No array out-of-bounds error. No new tiles generated outside the dungeon boundary.

---

## Success Criteria Checklist (SC-001 through SC-006)

| SC | Criterion | How to verify |
|----|-----------|---------------|
| SC-001 | Map expands on each exploratory step | Scenario 2 above: new tiles appear per move into unexplored area |
| SC-002 | ≥8 connected rooms after full exploration | Explore entire floor; count distinct rooms via visual inspection or console log |
| SC-003 | Combat resolves within 20 turns consistently | Fight a single enemy; count turns in HUD log until one combatant dies |
| SC-004 | Full run (floors 1–10) is state-consistent | Complete run or die on floor 10; no missing HUD data, no orphaned enemies visible after death |
| SC-005 | No perceptible lag after 10+ floors | Generate 10 floors; movement and rendering remain instant |
| SC-006 | New player identifies objective within 60s | Open game with no instructions; confirm player can see `@`, see `>`, read HUD within one minute |
