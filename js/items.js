const Items = (() => {
  function makeItem(type, name, glyph, effect, description) {
    return { type, name, glyph, effect, description };
  }

  function randomItem(floor) {
    const roll = Math.random();

    if (roll < 0.4) {
      const big = floor >= 5;
      const hp = big ? 15 : 8;
      return makeItem('POTION', big ? 'Greater Potion' : 'Health Potion', '!', hp, `Restores ${hp} HP`);
    }

    if (roll < 0.75) {
      const weapons = [
        { name: 'Dagger', effect: 1 },
        { name: 'Short Sword', effect: 3 },
        { name: 'Long Sword', effect: 5 }
      ];
      const maxIdx = Math.min(Math.floor(floor / 3), weapons.length - 1);
      const w = weapons[Math.floor(Math.random() * (maxIdx + 1))];
      return makeItem('WEAPON', w.name, '/', w.effect, `+${w.effect} ATK`);
    }

    const armors = [
      { name: 'Leather Armor', effect: 1 },
      { name: 'Chain Mail', effect: 3 }
    ];
    const maxIdx = Math.min(Math.floor(floor / 4), armors.length - 1);
    const a = armors[Math.floor(Math.random() * (maxIdx + 1))];
    return makeItem('ARMOR', a.name, '[', a.effect, `+${a.effect} DEF`);
  }

  function placeForFloor(dungeon, floor) {
    const rooms = dungeon.rooms;
    for (let i = 1; i < rooms.length; i++) {
      if (Math.random() > 0.6) continue;
      const room = rooms[i];
      for (let attempt = 0; attempt < 10; attempt++) {
        const x = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.width - 2));
        const y = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.height - 2));
        const tile = dungeon.tiles[y] && dungeon.tiles[y][x];
        if (tile && tile.type === 'FLOOR' && !tile.entity) {
          const item = randomItem(floor);
          item.x = x;
          item.y = y;
          tile.type = 'ITEM_GROUND';
          tile.glyph = item.glyph;
          tile.entity = item;
          GameState.items.push(item);
          break;
        }
      }
    }
  }

  function pushLog(gameState, msg) {
    gameState.log.push(msg);
    if (gameState.log.length > 8) gameState.log.shift();
  }

  function pickup(player, tile, gameState) {
    const item = tile.entity;
    if (!item) return;

    if (player.inventory.length >= CONFIG.inventoryCap) {
      pushLog(gameState, 'Inventory full.');
      return;
    }

    const idx = gameState.items.indexOf(item);
    if (idx !== -1) gameState.items.splice(idx, 1);
    tile.type = 'FLOOR';
    tile.glyph = '.';
    tile.entity = null;

    if (item.type === 'WEAPON') {
      const curEffect = player.equippedWeapon ? player.equippedWeapon.effect : 0;
      if (item.effect > curEffect) {
        if (player.equippedWeapon && player.inventory.length < CONFIG.inventoryCap) {
          player.inventory.push(player.equippedWeapon);
        }
        player.equippedWeapon = item;
        pushLog(gameState, `Equipped ${item.name} (+${item.effect} ATK).`);
      } else {
        player.inventory.push(item);
        pushLog(gameState, `Picked up ${item.name}.`);
      }
    } else if (item.type === 'ARMOR') {
      const curEffect = player.equippedArmor ? player.equippedArmor.effect : 0;
      if (item.effect > curEffect) {
        if (player.equippedArmor && player.inventory.length < CONFIG.inventoryCap) {
          player.inventory.push(player.equippedArmor);
        }
        player.equippedArmor = item;
        pushLog(gameState, `Equipped ${item.name} (+${item.effect} DEF).`);
      } else {
        player.inventory.push(item);
        pushLog(gameState, `Picked up ${item.name}.`);
      }
    } else {
      player.inventory.push(item);
      pushLog(gameState, `Picked up ${item.name}.`);
    }
  }

  function useSlot(player, slotIndex, gameState) {
    const item = player.inventory[slotIndex];
    if (!item) {
      pushLog(gameState, `No item in slot ${slotIndex + 1}.`);
      return;
    }

    if (item.type === 'POTION') {
      const healed = Math.min(item.effect, player.maxHp - player.hp);
      player.hp = Math.min(player.hp + item.effect, player.maxHp);
      player.inventory.splice(slotIndex, 1);
      pushLog(gameState, `Drank ${item.name}. Restored ${healed} HP.`);
    } else if (item.type === 'WEAPON') {
      const old = player.equippedWeapon;
      player.equippedWeapon = item;
      player.inventory.splice(slotIndex, 1);
      if (old) player.inventory.splice(slotIndex, 0, old);
      pushLog(gameState, `Equipped ${item.name}.`);
    } else if (item.type === 'ARMOR') {
      const old = player.equippedArmor;
      player.equippedArmor = item;
      player.inventory.splice(slotIndex, 1);
      if (old) player.inventory.splice(slotIndex, 0, old);
      pushLog(gameState, `Equipped ${item.name}.`);
    }
  }

  return { placeForFloor, pickup, useSlot };
})();
