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
  GameState.phase = 'PLAYING';
  GameState.log = [];

  GameState.dungeon = Dungeon.generate(GameState.config, 1);
  GameState.player = Player.init(GameState.dungeon.rooms[0]);

  GameState.enemies = [];
  if (typeof Enemy !== 'undefined' && Enemy.placeForFloor) {
    Enemy.placeForFloor(GameState.dungeon, GameState.player.floor);
  }

  GameState.items = [];
  if (typeof Items !== 'undefined' && Items.placeForFloor) {
    Items.placeForFloor(GameState.dungeon, GameState.player.floor);
  }

  FOV.compute(GameState);
  Renderer.init(GameState.config);
  Renderer.render(GameState);
  UI.render(GameState);
}

function processEnemyPhase(gameState) {
  if (typeof Enemy === 'undefined') return;
  Enemy.activateRoomEnemies(gameState);
  const snapshot = [...gameState.enemies];
  for (const enemy of snapshot) {
    if (enemy.alive) Enemy.ai(enemy, gameState);
  }
  gameState.enemies = gameState.enemies.filter(e => e.alive);
}

const KEY_MAP = {
  ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
  ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0], D: [1, 0]
};

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

  if (typeof Enemy !== 'undefined' && Enemy.placeForFloor) {
    Enemy.placeForFloor(gameState.dungeon, player.floor);
  }
  if (typeof Items !== 'undefined' && Items.placeForFloor) {
    Items.placeForFloor(gameState.dungeon, player.floor);
  }

  const startRoom = gameState.dungeon.rooms[0];
  player.x = Math.floor(startRoom.x + startRoom.width / 2);
  player.y = Math.floor(startRoom.y + startRoom.height / 2);

  FOV.compute(gameState);
  Renderer.render(gameState);
  UI.render(gameState);
}

document.addEventListener('keydown', (e) => {
  if (GameState.phase !== 'PLAYING') return;

  const delta = KEY_MAP[e.key];
  if (!delta) return;

  e.preventDefault();
  Player.move(delta[0], delta[1], GameState);

  if (typeof processEnemyPhase === 'function') {
    processEnemyPhase(GameState);
  }

  if (GameState.player.hp <= 0) {
    GameState.phase = 'GAME_OVER';
    UI.showGameOver(GameState);
    return;
  }

  const tile = GameState.dungeon.tiles[GameState.player.y][GameState.player.x];
  if (tile && tile.type === TILE_TYPES.STAIR_DOWN) {
    descend(GameState);
    return;
  }

  Renderer.render(GameState);
  UI.render(GameState);
});

document.addEventListener('DOMContentLoaded', initGame);
