const TILE_TYPES = {
  WALL: 'WALL',
  FLOOR: 'FLOOR',
  DOOR: 'DOOR',
  STAIR_DOWN: 'STAIR_DOWN',
  ITEM_GROUND: 'ITEM_GROUND',
  EMPTY: 'EMPTY'
};

const VISIBILITY = {
  HIDDEN: 'HIDDEN',
  SEEN: 'SEEN',
  LIT: 'LIT'
};

const GLYPHS = {
  WALL: '#',
  FLOOR: '.',
  DOOR: '+',
  STAIR_DOWN: '>',
  ITEM_GROUND: '?',
  EMPTY: ' ',
  PLAYER: '@',
  GOBLIN: 'g',
  ORC: 'o',
  TROLL: 'T',
  POTION: '!',
  WEAPON: '/',
  ARMOR: '['
};

const BASE_HP = { GOBLIN: 6, ORC: 12, TROLL: 20 };
const BASE_ATT = { GOBLIN: 2, ORC: 4, TROLL: 6 };
const HP_SCALE = { GOBLIN: 2, ORC: 3, TROLL: 4 };
const ATT_SCALE = { GOBLIN: 1, ORC: 1, TROLL: 2 };

const CONFIG = {
  dungeonWidth: 80,
  dungeonHeight: 50,
  sightRadius: 5,
  enemySightRange: 6,
  maxFloors: 10,
  inventoryCap: 10,
  minPartition: 8,
  minRoomSize: 4
};
