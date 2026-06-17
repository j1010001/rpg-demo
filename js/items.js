const Items = (() => {
  const POOL = {
    POTION: [
      { name: 'Health Potion', effect: 10 },
      { name: 'Strong Potion', effect: 20 }
    ],
    WEAPON: [
      { name: 'Dagger', effect: 2 },
      { name: 'Short Sword', effect: 4 },
      { name: 'Broadsword', effect: 6 },
      { name: 'War Axe', effect: 8 }
    ],
    ARMOR: [
      { name: 'Leather Armor', effect: 1 },
      { name: 'Chain Mail', effect: 3 },
      { name: 'Plate Armor', effect: 5 }
    ]
  };

  function potionWeight(floor) {
    if (floor <= 3) return 0.6;
    if (floor <= 6) return 0.4;
    return 0.2;
  }

  function pickType(floor) {
    const pw = potionWeight(floor);
    const r = Math.random();
    if (r < pw) return 'POTION';
    if (r < pw + (1 - pw) / 2) return 'WEAPON';
    return 'ARMOR';
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function makeItem(type) {
    const t = randomFrom(POOL[type]);
    return { name: t.name, type, effect: t.effect, glyph: GLYPHS[type], x: 0, y: 0, tile: null };
  }

  function walkableTiles(dungeon, room) {
    const out = [];
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (dungeon.tiles[y][x].type === 'FLOOR') out.push({ x, y, tile: dungeon.tiles[y][x] });
      }
    }
    return out;
  }

  function capLog(gameState) {
    if (gameState.log.length > 8) gameState.log = gameState.log.slice(-8);
  }

  function placeForFloor(dungeon, floor) {
    for (let i = 1; i < dungeon.rooms.length; i++) {
      const count = 1 + Math.floor(Math.random() * 3);
      const candidates = walkableTiles(dungeon, dungeon.rooms[i]);
      if (!candidates.length) continue;

      // Shuffle in-place
      for (let j = candidates.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [candidates[j], candidates[k]] = [candidates[k], candidates[j]];
      }

      const n = Math.min(count, candidates.length);
      for (let j = 0; j < n; j++) {
        const { x, y, tile } = candidates[j];
        const item = makeItem(pickType(floor));
        item.x = x;
        item.y = y;
        item.tile = tile;
        tile.type = 'ITEM_GROUND';
        tile.glyph = item.glyph;
        tile.entity = item;
        GameState.items.push(item);
      }
    }
  }

  function pickup(item, gameState) {
    const { player } = gameState;
    const cap = gameState.config ? gameState.config.inventoryCap : CONFIG.inventoryCap;

    if (player.inventory.length >= cap) {
      gameState.log.push('Inventory full.');
      capLog(gameState);
      return false;
    }

    // Clear tile
    item.tile.entity = null;
    item.tile.type = 'FLOOR';
    item.tile.glyph = '.';
    gameState.items = gameState.items.filter(i => i !== item);

    // Auto-equip if better weapon or armor
    if (item.type === 'WEAPON') {
      const cur = player.equippedWeapon;
      if (!cur || item.effect > cur.effect) {
        if (cur) player.inventory.push(cur);
        player.equippedWeapon = item;
        player.attack = player.attack - (cur ? cur.effect : 0) + item.effect;
        gameState.log.push(`Auto-equipped ${item.name}.`);
        capLog(gameState);
        return true;
      }
    } else if (item.type === 'ARMOR') {
      const cur = player.equippedArmor;
      if (!cur || item.effect > cur.effect) {
        if (cur) player.inventory.push(cur);
        player.equippedArmor = item;
        player.defense = player.defense - (cur ? cur.effect : 0) + item.effect;
        gameState.log.push(`Auto-equipped ${item.name}.`);
        capLog(gameState);
        return true;
      }
    }

    player.inventory.push(item);
    return true;
  }

  function usePotion(index, gameState) {
    const { player } = gameState;
    const item = player.inventory[index];
    if (!item || item.type !== 'POTION') return;

    const healed = Math.min(item.effect, player.maxHp - player.hp);
    player.hp = Math.min(player.hp + item.effect, player.maxHp);
    player.inventory.splice(index, 1);
    gameState.log.push(`Used ${item.name}. Healed ${healed} HP.`);
    capLog(gameState);
  }

  function equipItem(index, gameState) {
    const { player } = gameState;
    const item = player.inventory[index];
    if (!item || item.type === 'POTION') return;

    if (item.type === 'WEAPON') {
      const cur = player.equippedWeapon;
      if (cur && cur.effect >= item.effect) {
        gameState.log.push(`${item.name} is no better than ${cur.name}.`);
        capLog(gameState);
        return;
      }
      player.inventory.splice(index, 1);
      if (cur) player.inventory.push(cur);
      player.equippedWeapon = item;
      player.attack = player.attack - (cur ? cur.effect : 0) + item.effect;
      gameState.log.push(`Equipped ${item.name}.`);
    } else if (item.type === 'ARMOR') {
      const cur = player.equippedArmor;
      if (cur && cur.effect >= item.effect) {
        gameState.log.push(`${item.name} is no better than ${cur.name}.`);
        capLog(gameState);
        return;
      }
      player.inventory.splice(index, 1);
      if (cur) player.inventory.push(cur);
      player.equippedArmor = item;
      player.defense = player.defense - (cur ? cur.effect : 0) + item.effect;
      gameState.log.push(`Equipped ${item.name}.`);
    }
    capLog(gameState);
  }

  return { placeForFloor, pickup, usePotion, equipItem };
})();
