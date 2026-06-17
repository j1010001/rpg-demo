const UI = (() => {
  function render(gameState) {
    const { player, log } = gameState;
    document.getElementById('hud-hp').textContent = `HP: ${player.hp} / ${player.maxHp}`;
    document.getElementById('hud-floor').textContent = `Floor: ${player.floor}`;
    document.getElementById('hud-level').textContent = `Level: ${player.level}`;
    document.getElementById('hud-atk').textContent = `ATK: ${Player.totalAttack(player)}`;
    document.getElementById('hud-def').textContent = `DEF: ${Player.totalDefense(player)}`;
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

  function buildInventoryHTML(player) {
    let html = '<div class="overlay-content inv-content"><div class="overlay-title">INVENTORY</div>';

    const equipped = [];
    if (player.equippedWeapon) {
      equipped.push(`[E] ${player.equippedWeapon.name} (${player.equippedWeapon.glyph}): ${player.equippedWeapon.description}`);
    }
    if (player.equippedArmor) {
      equipped.push(`[E] ${player.equippedArmor.name} (${player.equippedArmor.glyph}): ${player.equippedArmor.description}`);
    }

    if (equipped.length > 0) {
      html += '<div class="inv-section">Equipped:</div>';
      for (const line of equipped) {
        html += `<div>${line}</div>`;
      }
    }

    if (player.inventory.length > 0) {
      html += '<div class="inv-section">Bag:</div>';
      for (let i = 0; i < player.inventory.length; i++) {
        const item = player.inventory[i];
        const slot = i === 9 ? '0' : String(i + 1);
        html += `<div>[${slot}] ${item.name} (${item.glyph}): ${item.description}</div>`;
      }
    }

    if (equipped.length === 0 && player.inventory.length === 0) {
      html += '<div>Nothing carried.</div>';
    }

    html += '<div class="overlay-hint">[I] / [Esc] Close &nbsp; [1–0] Use/Equip</div></div>';
    return html;
  }

  function showInventory(player) {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = buildInventoryHTML(player);
  }

  function renderInventory(player) {
    const overlay = document.getElementById('overlay');
    if (overlay.style.display !== 'none') {
      overlay.innerHTML = buildInventoryHTML(player);
    }
  }

  function closeInventory() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
    overlay.innerHTML = '';
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

  return { render, showInventory, renderInventory, closeInventory, showGameOver, showVictory };
})();
