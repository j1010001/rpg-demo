const Items = (() => {
  const POTIONS = [
    { name: 'Health Potion', type: 'POTION', effect: 10, glyph: '!' },
    { name: 'Strong Potion', type: 'POTION', effect: 20, glyph: '!' }
  ];
  const WEAPONS = [
    { name: 'Dagger', type: 'WEAPON', effect: 2, glyph: '/' },
    { name: 'Short Sword', type: 'WEAPON', effect: 4, glyph: '/' },
    { name: 'Broadsword', type: 'WEAPON', effect: 6, glyph: '/' },
    { name: 'War Axe', type: 'WEAPON', effect: 8, glyph: '/' }
  ];
  const ARMORS = [
    { name: 'Leather Armor', type: 'ARMOR', effect: 1, glyph: '[' },
    { name: 'Chain Mail', type: 'ARMOR', effect: 3, glyph: '[' },
    { name: 'Plate Armor', type: 'ARMOR', effect: 5, glyph: '[' }
  ];

  function pick(arr) {
    return Object.assign({}, arr[Math.floor(Math.random() * arr.length)]);
  }

  function randomItem(floor) {
    const potionWeight = floor <= 3 ? 0.6 : floor <= 6 ? 0.4 : 0.2;
    const r = Math.random();
    if (r < potionWeight) return pick(POTIONS);
    if (r < potionWeight + (1 - potionWeight) / 2) return pick(WEAPONS);
    return pick(ARMORS);
  }

  function placeForFloor(dungeon, floor) {
    for (let i = 1; i < dungeon.rooms.length; i++) {
      const room = dungeon.rooms[i];
      const count = 1 + Math.floor(Math.random() * 3);
      let placed = 0, attempts = 0;
      while (placed < count && attempts < 50) {
        attempts++;
        const ix = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.width - 2));
        const iy = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.height - 2));
        if (ix >= dungeon.width || iy >= dungeon.height) continue;
        const tile = dungeon.tiles[iy][ix];
        if (tile.type !== 'FLOOR' || tile.entity) continue;
        const item = randomItem(floor);
        tile.type = 'ITEM_GROUND';
        tile.glyph = item.glyph;
        tile.entity = item;
        placed++;
      }
    }
  }

  function pickup(item, tile, gameState) {
    const { player, log } = gameState;
    if (player.inventory.length >= gameState.config.inventoryCap) {
      log.push('Inventory full.');
      while (log.length > 8) log.shift();
      return false;
    }
    tile.type = 'FLOOR';
    tile.glyph = '.';
    tile.entity = null;
    if (item.type === 'WEAPON' && (!player.equippedWeapon || item.effect > player.equippedWeapon.effect)) {
      if (player.equippedWeapon) player.inventory.push(player.equippedWeapon);
      player.equippedWeapon = item;
      log.push(`Equipped ${item.name}.`);
    } else if (item.type === 'ARMOR' && (!player.equippedArmor || item.effect > player.equippedArmor.effect)) {
      if (player.equippedArmor) player.inventory.push(player.equippedArmor);
      player.equippedArmor = item;
      log.push(`Equipped ${item.name}.`);
    } else {
      player.inventory.push(item);
    }
    while (log.length > 8) log.shift();
    return true;
  }

  function usePotion(index, gameState) {
    const { player, log } = gameState;
    const item = player.inventory[index];
    if (!item || item.type !== 'POTION') return;
    player.hp = Math.min(player.hp + item.effect, player.maxHp);
    player.inventory.splice(index, 1);
    log.push(`Used ${item.name}. HP +${item.effect}.`);
    while (log.length > 8) log.shift();
  }

  return { placeForFloor, pickup, usePotion };
})();
