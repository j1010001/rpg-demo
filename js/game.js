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

  GameState.enemies = [];
  if (typeof Enemy !== 'undefined' && Enemy.placeForFloor) {
    Enemy.placeForFloor(GameState.dungeon, GameState.player.floor);
  }
  if (typeof Items !== 'undefined' && Items.placeForFloor) {
    Items.placeForFloor(GameState.dungeon, GameState.player.floor);
  }

  FOV.compute(GameState);
  Renderer.init(GameState.config);
  Renderer.render(GameState);
  UI.render(GameState);
}

const KEY_MAP = {
  ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
  ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0], D: [1, 0]
};

document.addEventListener('keydown', (e) => {
  if (GameState.phase !== 'PLAYING') return;

  if (e.key === 'i' || e.key === 'I') {
    e.preventDefault();
    if (typeof UI.toggleInventory === 'function') UI.toggleInventory();
    return;
  }

  const slotIndex = '1234567890'.indexOf(e.key);
  if (slotIndex !== -1) {
    e.preventDefault();
    const item = GameState.player.inventory[slotIndex];
    if (item && typeof Items !== 'undefined') {
      if (item.type === 'POTION') {
        Items.usePotion(slotIndex, GameState);
      } else if (item.type === 'WEAPON' || item.type === 'ARMOR') {
        Items.equipItem(slotIndex, GameState);
      }
      Renderer.render(GameState);
      UI.render(GameState);
    }
    return;
  }

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

  Renderer.render(GameState);
  UI.render(GameState);
});

document.addEventListener('DOMContentLoaded', initGame);
