window.GameState = {
  dungeon: null,
  player: null,
  enemies: [],
  items: [],
  phase: 'PLAYING',
  log: [],
  config: CONFIG
};

function initGame() {
  GameState.enemies = [];
  GameState.items = [];
  GameState.phase = 'PLAYING';
  GameState.log = [];

  GameState.dungeon = Dungeon.generate(GameState.config, 1);
  GameState.player = Player.init(GameState.dungeon.rooms[0]);

  Enemy.placeForFloor(GameState.dungeon, GameState.player.floor);
  Items.placeForFloor(GameState.dungeon, GameState.player.floor);

  FOV.compute(GameState);
  Renderer.init(GameState.config);
  Renderer.render(GameState);
  UI.render(GameState);
}

// R103: activate all enemies in the room the player currently occupies
function activateRoomEnemies(gameState) {
  const { player, dungeon, enemies } = gameState;
  let playerRoom = null;
  for (const room of dungeon.rooms) {
    if (player.x >= room.x && player.x < room.x + room.width &&
        player.y >= room.y && player.y < room.y + room.height) {
      playerRoom = room;
      break;
    }
  }
  if (!playerRoom) return;
  for (const enemy of enemies) {
    if (enemy.roomId === playerRoom.id) enemy.active = true;
  }
}

function processEnemyPhase(gameState) {
  for (const enemy of gameState.enemies) {
    if (enemy.alive) Enemy.ai(enemy, gameState);
  }
  gameState.enemies = gameState.enemies.filter(e => e.alive);
}

// R101: victory fires immediately on entering floor 10 — no staircase on floor 10 needed
function descend(gameState) {
  const { player, config } = gameState;
  player.floor++;
  player.level = player.floor;

  if (player.floor >= config.maxFloors) {
    gameState.phase = 'VICTORY';
    UI.showVictory(gameState);
    return;
  }

  gameState.dungeon = Dungeon.generate(config, player.floor);
  gameState.enemies = [];
  gameState.items = [];
  Enemy.placeForFloor(gameState.dungeon, player.floor);
  Items.placeForFloor(gameState.dungeon, player.floor);

  const startRoom = gameState.dungeon.rooms[0];
  player.x = Math.floor(startRoom.x + startRoom.width / 2);
  player.y = Math.floor(startRoom.y + startRoom.height / 2);

  FOV.update(gameState);
  FOV.compute(gameState);
  Renderer.init(gameState.config);
  Renderer.render(gameState);
  UI.render(gameState);
}

const KEY_MAP = {
  ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
  ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0], D: [1, 0]
};

document.addEventListener('keydown', (e) => {
  if (GameState.phase !== 'PLAYING') return;

  const delta = KEY_MAP[e.key];
  if (!delta) return;

  e.preventDefault();
  Player.move(delta[0], delta[1], GameState);

  // R103: activate room enemies immediately after player moves
  activateRoomEnemies(GameState);

  processEnemyPhase(GameState);

  if (GameState.player.hp <= 0) {
    GameState.phase = 'GAME_OVER';
    UI.showGameOver(GameState);
    return;
  }

  // Check staircase descent
  const tile = Dungeon.getTile(GameState.dungeon, GameState.player.x, GameState.player.y);
  if (tile && tile.type === 'STAIR_DOWN') {
    descend(GameState);
    return;
  }

  Renderer.render(GameState);
  UI.render(GameState);
});

document.addEventListener('DOMContentLoaded', initGame);
