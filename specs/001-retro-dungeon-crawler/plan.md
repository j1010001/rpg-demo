# Implementation Plan: Retro Dungeon Crawler RPG

**Branch**: `001-retro-dungeon-crawler` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-retro-dungeon-crawler/spec.md`

## Summary

Build a browser-based top-down roguelike RPG with procedural BSP dungeon generation, DOM-rendered ASCII tiles, turn-based combat, and fog-of-war — implemented as a static site in pure HTML/CSS/vanilla JS with no build step, no backend, and no dependencies.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES2020+), HTML5, CSS3

**Primary Dependencies**: None — zero external libraries, zero CDN imports

**Storage**: N/A — all state is in-memory for the session; permadeath enforced by page reload

**Testing**: Manual browser validation — open `index.html` directly in browser (file:// URL)

**Target Platform**: Modern desktop browser (Chrome 90+, Firefox 88+, Safari 14+); file:// compatible

**Project Type**: Static browser game

**Performance Goals**: Turn resolution <1ms; no perceptible lag after 10+ floors of generation (SC-005)

**Constraints**: No build step; no network requests; must work on file:// URL without preprocessing

**Scale/Scope**: Single player; max 10 floors; ~80×50 tile dungeon grid per floor

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Evidence |
|-----------|------|--------|----------|
| I. Human Authority at Spec Altitude | No spec-level decisions delegated to agents | PASS | All WHAT/WHY defined in spec; HOW decided in this plan |
| II. Minimal Escalation | No escalation needed | PASS | No ambiguity blocking implementation; D3/D5/D7/D8 deferred by design |
| III. Deployable Probe First | Probe must ship before full implementation | PASS | Phase 0 milestone = probe (map render + movement + BSP generation) |
| IV. Static-First Stack | HTML/CSS/vanilla JS only; no build step, no backend | PASS | FR-014 mandates this; FR-015 prohibits canvas; all FRs align |
| V. Requirement Provenance | All FRs carry compliant `Decided by / Weight / Date` blocks | PASS | FR-001 through FR-018 all carry compliant provenance; FR-015–018 provenance format corrected 2026-06-16; deferred dimensions documented |
| VI. Spec-Arbitrated Review | Reviewers arbitrate against spec only | PASS | Plan does not introduce undocumented constraints |

**Post-Design Re-check**: No violations introduced in Phase 1 design (see data-model.md, contracts/).

## Project Structure

### Documentation (this feature)

```text
specs/001-retro-dungeon-crawler/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── game-state.md
│   ├── dungeon-api.md
│   └── render-contract.md
└── tasks.md             # Phase 2 output (not created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html               # Entry point: DOM structure, script load order
style.css                # Retro aesthetic: dark bg, monochrome glyphs, HUD layout
js/
├── constants.js         # Tile types, entity glyphs, item types, game config constants
├── dungeon.js           # BSP dungeon generation; room/corridor carving into tile grid
├── fov.js               # Fog-of-war: compute lit/seen/hidden per tile from player position
├── player.js            # Player entity: movement, attack, item use, stat tracking
├── enemy.js             # Enemy types, AI (line-of-sight pursue + adjacent attack)
├── items.js             # Item definitions, drop table, pickup and use logic
├── combat.js            # Turn resolution: player strike → enemy phase → log emit
├── renderer.js          # DOM grid: cell pool creation, glyph/color update, viewport scroll
├── ui.js                # HUD: HP bar, floor/level display, combat log append
└── game.js              # Root: init, keydown dispatcher, floor transition, game-over/win
```

**Structure Decision**: Single static-site layout at repo root (no `src/` nesting needed for a zero-build project). `js/` module files loaded via ordered `<script>` tags in `index.html`; no ES module imports required. All modules communicate through a shared `window.GameState` object (see [game-state.md](./contracts/game-state.md)).

## Complexity Tracking

No constitution violations. No complexity justifications required.

## Phase 0: Probe (Deliverable)

**Goal**: Deployable vertical slice — open `index.html`, move `@` with WASD/arrows, watch new rooms generate as you explore. No enemies, no items, no combat. Proves FR-002, FR-003, FR-004, FR-015, FR-017.

**Probe scope**:
- BSP dungeon generation for a single floor (80×50 grid, ~8–12 rooms)
- DOM grid renderer with retro CSS (dark bg, green-on-black glyphs)
- Player `@` movement, wall collision
- Fog-of-war: hidden/seen/lit tile visibility with radius 5
- HUD: floor number, HP display (static for probe)

**Probe does NOT include**: enemies, combat, items, inventory, stairs, floor transitions.

**Probe validation**: Scenario 1 and 2 from User Story 1 pass manually.

## Phase 1: Core Features (Post-Probe)

Ordered by priority and dependency:

1. **Enemy placement + combat** (P2 — FR-006, FR-007, FR-008): enemy types per floor, turn resolution, game-over screen
2. **Items + inventory** (P3 — FR-009, FR-010): pickup, use, equip; 10-slot cap with full-inventory message
3. **Floor descent** (P4 — FR-011): staircase tile, BSP re-generation for next floor, stat/inventory carry-over, victory at floor 10

## Phase 2: Deferred Dimensions (Post-Probe Feedback)

Per constitution, D3/D5/D7/D8 are decided after probe deployment:
- **D3** (sight radius): probe uses 5; tune after feedback
- **D5** (victory condition on floor 10): implement after D5 vote
- **D7** (color palette): style.css swap after D7 vote
- **D8** (enemy engagement rule): add to enemy AI after D8 vote

## Research Artifacts

See [research.md](./research.md) for full decision log.

Key decisions:
- **BSP generation**: recursive H/V split, min partition 8×8, room inset 1 tile, L-shaped corridor between sibling rooms — guarantees SC-002 (≥8 connected rooms)
- **DOM rendering**: CSS Grid, 14px×14px cells, `<span>` per tile, viewport container with overflow:hidden scrolled to center on player
- **FOV algorithm**: Bresenham line-of-sight scan from player to all tiles within radius — simple, synchronous, correct for retro feel
- **Turn engine**: synchronous keydown → player action → enemy phase → BSP expand-if-needed → re-render
- **File loading**: classic `<script>` tags in dependency order; no ES modules; all state on `window.GameState`
