const Combat = (() => {
  function pushLog(gameState, message) {
    gameState.log.push(message);
    if (gameState.log.length > 8) gameState.log.shift();
  }

  function displayName(type) {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  function playerAttack(enemy, gameState) {
    const player = gameState.player;
    const damage = Math.max(1, Player.totalAttack(player));
    enemy.hp -= damage;

    if (enemy.hp <= 0) {
      enemy.alive = false;
      player.enemiesDefeated++;
      pushLog(gameState, `You defeated the ${displayName(enemy.type)}.`);
    } else {
      pushLog(gameState, `You hit ${displayName(enemy.type)} for ${damage}.`);
    }
  }

  function enemyAttack(enemy, gameState) {
    const player = gameState.player;
    const damage = Math.max(1, enemy.attack - Player.totalDefense(player));
    player.hp -= damage;
    pushLog(gameState, `${displayName(enemy.type)} hits you for ${damage}.`);
  }

  return { playerAttack, enemyAttack };
})();
