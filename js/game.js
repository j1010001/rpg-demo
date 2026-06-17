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

document.addEventListener('keydown', (e) => {
  if (GameState.phase === 'INVENTORY') {
    if (e.key === 'i' || e.key === 'I' || e.key === 'Escape') {
      e.preventDefault();
      GameState.phase = 'PLAYING';
      UI.closeInventory();
    } else if ((e.key >= '1' && e.key <= '9') || e.key === '0') {
      e.preventDefault();
      const slotIndex = e.key === '0' ? 9 : parseInt(e.key) - 1;
      if (typeof Items !== 'undefined') {
        Items.useSlot(GameState.player, slotIndex, GameState);
      }
      UI.renderInventory(GameState.player);
      UI.render(GameState);
    }
    return;
  }

  if (GameState.phase !== 'PLAYING') return;

  if (e.key === 'i' || e.key === 'I') {
    e.preventDefault();
    GameState.phase = 'INVENTORY';
    UI.showInventory(GameState.player);
    return;
  }

  const delta = KEY_MAP[e.key];
  if (!delta) return;

  e.preventDefault();
  Player.move(delta[0], delta[1], GameState);

  processEnemyPhase(GameState);

  if (GameState.player.hp <= 0) {
    GameState.phase = 'GAME_OVER';
    UI.showGameOver(GameState);
    return;
  }

  Renderer.render(GameState);
  UI.render(GameState);
});

document.addEventListener('DOMContentLoaded', initGame);
