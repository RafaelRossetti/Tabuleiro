import { GameState } from './src/logic/game.js';

const board = document.getElementById('ludo-board');
const diceBtn = document.getElementById('dice-btn');
const diceValueEl = document.getElementById('dice-value');
const playerNameEl = document.querySelector('#current-player-name .name');
const logEl = document.getElementById('game-log');
const resetBtn = document.getElementById('reset-btn');

const gameState = new GameState();

// Mapeamento de coordenadas da grid 15x15 para o caminho principal do Ludo
// Isso é uma simplificação para o protótipo
const pathMapping = [
  { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  { r: 0, c: 7 }, { r: 0, c: 8 },
  { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  { r: 7, c: 14 }, { r: 8, c: 14 },
  { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  { r: 14, c: 7 }, { r: 14, c: 6 },
  { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  { r: 7, c: 0 }, { r: 6, c: 0 }
];

const homeStretchMapping = [
  // Forest (P0)
  [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }],
  // Reef (P1)
  [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 }],
  // Solar (P2)
  [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }, { r: 8, c: 7 }],
  // Wildlife (P3)
  [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 8 }]
];

const threatZones = [10, 25, 35, 48];

function initBoard() {
  // Criar células vazias para a grid
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (!isBaseArea(r, c) && !isCenterArea(r, c)) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.style.gridRow = r + 1;
        cell.style.gridColumn = c + 1;
        
        const pathIndex = pathMapping.findIndex(p => p.r === r && p.c === c);
        if (pathIndex !== -1) {
          cell.classList.add('path');
          cell.id = `cell-path-${pathIndex}`;
          if (threatZones.includes(pathIndex)) cell.classList.add('threat');
        }
        
        // Home Stretches
        homeStretchMapping.forEach((stretch, pIdx) => {
          const sIdx = stretch.findIndex(p => p.r === r && p.c === c);
          if (sIdx !== -1) {
            cell.classList.add('home-stretch', gameState.players[pIdx].color);
            cell.id = `cell-home-${pIdx}-${sIdx}`;
          }
        });
        
        board.appendChild(cell);
      }
    }
  }
  updateUI();
}

function isBaseArea(r, c) {
  return (r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8);
}

function isCenterArea(r, c) {
  return r >= 6 && r <= 8 && c >= 6 && c <= 8;
}

function updateUI() {
  playerNameEl.textContent = gameState.players[gameState.currentPlayerIndex].name;
  playerNameEl.style.color = `var(--${gameState.players[gameState.currentPlayerIndex].color}-light)`;
  
  logEl.innerHTML = '';
  gameState.log.forEach(msg => {
    const p = document.createElement('p');
    p.textContent = msg;
    logEl.appendChild(p);
  });

  renderTokens();
}

function renderTokens() {
  document.querySelectorAll('.token').forEach(t => t.remove());

  gameState.players.forEach(player => {
    player.tokens.forEach(token => {
      if (token.status === 'finished') return;

      const tokenEl = document.createElement('div');
      tokenEl.className = `token ${player.color}`;
      tokenEl.id = `token-${player.id}-${token.id}`;
      tokenEl.style.width = '35px';
      tokenEl.style.height = '35px';
      tokenEl.style.borderRadius = '50%';
      tokenEl.style.border = '2px solid white';
      tokenEl.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
      tokenEl.style.zIndex = '100';
      tokenEl.style.cursor = 'pointer';
      tokenEl.style.backgroundImage = 'url("/src/assets/tokens.png")';
      tokenEl.style.backgroundSize = '200% 200%';
      
      const x = (token.speciesIndex % 2) * 100;
      const y = Math.floor(token.speciesIndex / 2) * 100;
      tokenEl.style.backgroundPosition = `${x}% ${y}%`;
      tokenEl.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      let target = null;
      if (token.status === 'at-base') {
        target = document.querySelector(`#base-${player.id} [data-index="${token.id}"]`);
      } else if (token.status === 'on-path') {
        target = document.getElementById(`cell-path-${token.position}`);
      } else if (token.status === 'home-stretch') {
        target = document.getElementById(`cell-home-${player.id}-${token.position}`);
      }

      if (target) target.appendChild(tokenEl);

      tokenEl.onclick = (e) => {
        e.stopPropagation();
        handleTokenClick(token);
      };
    });
  });
}

function handleTokenClick(token) {
  if (gameState.currentPlayerIndex !== token.playerId) return;
  
  if (gameState.moveToken(token)) {
    updateUI();
  } else {
    gameState.addLog('Movimento inválido! Tire um 6 para sair da base.');
    updateUI();
  }
}

diceBtn.addEventListener('click', () => {
  if (gameState.rolledThisTurn) return;
  
  diceBtn.classList.add('rolling');
  setTimeout(() => {
    const value = gameState.rollDice();
    diceBtn.classList.remove('rolling');
    diceValueEl.textContent = value;
    updateUI();
  }, 600);
});

resetBtn.addEventListener('click', () => {
  location.reload();
});

initBoard();
