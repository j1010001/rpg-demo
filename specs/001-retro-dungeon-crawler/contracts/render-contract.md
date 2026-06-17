# Contract: Render Contract

**Module**: `js/renderer.js` + `js/ui.js`
**Branch**: `001-retro-dungeon-crawler`

---

## Overview

The renderer is a pure read operation on `GameState`. It never mutates state. Every render call produces a consistent DOM snapshot from current `GameState`.

Two rendering concerns are separated:
- **`renderer.js`**: dungeon grid — tile glyphs, colors, entity overlays, viewport scroll
- **`ui.js`**: HUD — HP bar, floor/level stats, combat log

---

## Renderer API (`js/renderer.js`)

### `Renderer.init(config)`

Called once at game start. Creates the DOM cell pool.

**Parameters**: `config` = `GameState.config`

**Effects**:
- Creates `config.dungeonWidth × config.dungeonHeight` `<span>` elements inside `#dungeon`.
- Assigns each span a stable `id` of `cell-{y}-{x}` for direct lookup.
- No content or class is set — `Renderer.render()` does that.

---

### `Renderer.render(gameState)`

Full render pass. Called after every state mutation (once per turn).

**Parameters**: current `GameState`

**Effects**:
1. For each tile at `(x, y)`:
   - Look up span element `cell-{y}-{x}`.
   - If `tile.visibility === HIDDEN`: set `textContent = ' '`, `className = 'tile-hidden'`.
   - If `tile.visibility === SEEN`: set glyph from tile type (wall/floor), `className = 'tile-seen'`.
   - If `tile.visibility === LIT`:
     - If `tile.entity` is a live Enemy: set glyph from `enemy.glyph`, `className = 'tile-enemy-{type.toLowerCase()}'`.
     - Else if player is at `(x, y)`: set `textContent = '@'`, `className = 'tile-player'`.
     - Else if `tile.entity` is an Item: set glyph from item, `className = 'tile-item'`.
     - Else: set glyph from tile type, `className = 'tile-{type.toLowerCase()}'`.
2. Scroll viewport to center on player:
   ```js
   const vp = document.getElementById('viewport');
   vp.scrollLeft = (player.x - VIEWPORT_COLS / 2) * CELL_SIZE;
   vp.scrollTop  = (player.y - VIEWPORT_ROWS / 2) * CELL_SIZE;
   ```

**Performance invariant**: No DOM nodes are created or destroyed during render — only `textContent` and `className` are mutated on pre-existing spans. This keeps render cost O(changed tiles) in practice and O(total tiles) worst case.

---

## UI API (`js/ui.js`)

### `UI.render(gameState)`

Renders the HUD. Called after every turn alongside `Renderer.render`.

**Parameters**: current `GameState`

**Effects**:
1. Update `#hud-hp`: `"HP: {player.hp} / {player.maxHp}"`
2. Update `#hud-floor`: `"Floor: {player.floor}"`
3. Update `#hud-level`: `"Level: {player.level}"` (= floor number, FR-016)
4. Update `#hud-enemies`: `"Defeated: {player.enemiesDefeated}"`
5. Update `#hud-log`: render last `min(log.length, 8)` entries from `GameState.log`, one `<div>` per line, newest at bottom.

---

### `UI.showGameOver(gameState)`

Renders game-over overlay. Called when `GameState.phase === "GAME_OVER"`.

**Effects**:
- Make `#overlay` visible.
- Set content: `"GAME OVER"`, `"Floor reached: {player.floor}"`, `"Enemies defeated: {player.enemiesDefeated}"`, `"[R] Restart"`.
- Bind `R` keydown to `window.location.reload()`.

---

### `UI.showVictory(gameState)`

Renders victory overlay. Called when `GameState.phase === "VICTORY"`.

**Effects**:
- Make `#overlay` visible.
- Set content: `"VICTORY"`, `"You survived all 10 floors!"`, `"Enemies defeated: {player.enemiesDefeated}"`, `"[R] Play Again"`.
- Bind `R` keydown to `window.location.reload()`.

---

## DOM Structure Contract

`index.html` MUST contain these elements for `renderer.js` and `ui.js` to function:

```html
<div id="viewport">           <!-- overflow:hidden; fixed viewport size -->
  <div id="dungeon"></div>    <!-- CSS grid; populated by Renderer.init() -->
</div>

<div id="hud">
  <span id="hud-hp"></span>
  <span id="hud-floor"></span>
  <span id="hud-level"></span>
  <span id="hud-enemies"></span>
  <div id="hud-log"></div>
</div>

<div id="overlay" style="display:none"></div>
```

---

## CSS Class Contract

`style.css` MUST define colors for these classes (exact palette pending D7 vote; defaults below):

| Class | Default color | Description |
|-------|--------------|-------------|
| `.tile-hidden` | `#000` bg, no glyph | Unexplored tile |
| `.tile-seen` | `#2a2a2a` text on `#000` bg | Previously visited, dimmed |
| `.tile-wall` | `#888` text on `#000` bg | Lit wall |
| `.tile-floor` | `#444` text on `#000` bg | Lit floor |
| `.tile-player` | `#0f0` text | Player `@` |
| `.tile-enemy-goblin` | `#f00` text | Goblin `g` |
| `.tile-enemy-orc` | `#f60` text | Orc `o` |
| `.tile-enemy-troll` | `#f0f` text | Troll `T` |
| `.tile-item` | `#ff0` text | Item glyph |
| `.tile-stair_down` | `#0ff` text | Stairs `>` |

D7 (color palette) is deferred. These defaults approximate green-on-black (option a). Swapping palette = swapping these CSS values only — no JS changes required.
