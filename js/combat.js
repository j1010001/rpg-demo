const Combat = (() => {
  function capLog(log) {
    while (log.length > 8) log.shift();
  }

  function playerAttack(enemy, gameState) {
    const { player, log } = gameState;
    const bonus = player.equippedWeapon ? player.equippedWeapon.effect : 0;
    const damage = Math.max(1, player.attack + bonus);
    enemy.hp -= damage;
    if (enemy.hp <= 0) {
      enemy.alive = false;
      enemy.hp = 0;
      player.enemiesDefeated++;
      log.push(`You defeated the ${enemy.type}.`);
    } else {
      log.push(`You hit ${enemy.type} for ${damage}.`);
    }
    capLog(log);
  }

  function enemyAttack(enemy, gameState) {
    const { player, log } = gameState;
    const defense = player.defense + (player.equippedArmor ? player.equippedArmor.effect : 0);
    const damage = Math.max(1, enemy.attack - defense);
    player.hp -= damage;
    log.push(`${enemy.type} hits you for ${damage}.`);
    capLog(log);
  }

  return { playerAttack, enemyAttack };
})();
