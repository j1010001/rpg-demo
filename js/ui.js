const UI = (() => {
  function render(gameState) {
    const { player, log } = gameState;
    document.getElementById('hud-hp').textContent = `HP: ${player.hp} / ${player.maxHp}`;
    document.getElementById('hud-floor').textContent = `Floor: ${player.floor}`;
    document.getElementById('hud-level').textContent = `Level: ${player.level}`;
    document.getElementById('hud-enemies').textContent = `Defeated: ${player.enemiesDefeated}`;

    const logEl = document.getElementById('hud-log');
    logEl.innerHTML = '';
    for (const entry of log) {
      const div = document.createElement('div');
      div.textContent = entry;
      logEl.appendChild(div);
    }
    logEl.scrollTop = logEl.scrollHeight;
  }

  // FR-008: game-over overlay with floor/enemies stats and R-to-restart (T019).
  function showGameOver(gameState) {
    const { player } = gameState;
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div class="overlay-content">
        <div class="overlay-title">GAME OVER</div>
        <div>Floor reached: ${player.floor}</div>
        <div>Enemies defeated: ${player.enemiesDefeated}</div>
        <div class="overlay-hint">[R] Restart</div>
      </div>
    `;
    const handler = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        document.removeEventListener('keydown', handler);
        window.location.reload();
      }
    };
    document.addEventListener('keydown', handler);
  }

  function showVictory(gameState) {
    const { player } = gameState;
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div class="overlay-content">
        <div class="overlay-title">VICTORY</div>
        <div>You survived all 10 floors!</div>
        <div>Enemies defeated: ${player.enemiesDefeated}</div>
        <div class="overlay-hint">[R] Play Again</div>
      </div>
    `;
    const handler = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        document.removeEventListener('keydown', handler);
        window.location.reload();
      }
    };
    document.addEventListener('keydown', handler);
  }

  return { render, showGameOver, showVictory };
})();
