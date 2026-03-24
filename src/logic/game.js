/**
 * Lógica do Jogo Nature Ludo
 */

export class Token {
  constructor(id, playerId, color, speciesIndex) {
    this.id = id;
    this.playerId = playerId;
    this.color = color;
    this.speciesIndex = speciesIndex;
    this.position = -1;
    this.status = 'at-base';
    this.isSafe = false;
  }
}

export class Player {
  constructor(id, name, color, startIndex, homeStretchStart, speciesIndex) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.startIndex = startIndex;
    this.homeStretchStart = homeStretchStart;
    this.speciesIndex = speciesIndex;
    this.tokens = [
      new Token(0, id, color, speciesIndex),
      new Token(1, id, color, speciesIndex),
      new Token(2, id, color, speciesIndex),
      new Token(3, id, color, speciesIndex)
    ];
  }
}

export class GameState {
  constructor() {
    this.players = [
      new Player(0, 'Jaguar', 'forest', 1, 50, 0),
      new Player(1, 'Tartaruga', 'reef', 14, 11, 1),
      new Player(2, 'Peixe Palhaço', 'solar', 27, 24, 2),
      new Player(3, 'Arara Azul', 'wildlife', 40, 37, 3)
    ];
    this.currentPlayerIndex = 0;
    this.diceValue = 0;
    this.rolledThisTurn = false;
    this.boardPathLength = 52;
    this.log = [];
  }

  rollDice() {
    if (this.rolledThisTurn) return null;
    this.diceValue = Math.floor(Math.random() * 6) + 1;
    this.rolledThisTurn = true;
    return this.diceValue;
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;
    this.rolledThisTurn = false;
    this.diceValue = 0;
  }

  canMove(token) {
    if (!this.rolledThisTurn || this.diceValue === 0) return false;
    
    // Se está na base, precisa de 6 para sair
    if (token.status === 'at-base') {
      return this.diceValue === 6;
    }

    if (token.status === 'finished') return false;

    // Lógica simplificada de movimento (pode ser expandida)
    return true;
  }

  moveToken(token) {
    if (!this.canMove(token)) return false;

    if (token.status === 'at-base') {
      token.status = 'on-path';
      token.position = this.players[this.currentPlayerIndex].startIndex;
      this.addLog(`${this.players[this.currentPlayerIndex].name} resgatou um filhote para o caminho!`);
    } else {
      // Movimento incremental
      const steps = this.diceValue;
      for (let i = 0; i < steps; i++) {
        if (token.status === 'on-path') {
          // Checar se deve entrar no home stretch
          const player = this.players[this.currentPlayerIndex];
          if (token.position === player.homeStretchStart) {
            token.status = 'home-stretch';
            token.position = 0;
          } else {
            token.position = (token.position + 1) % this.boardPathLength;
          }
        } else if (token.status === 'home-stretch') {
          token.position++;
          if (token.position > 5) {
            token.status = 'finished';
            this.addLog(`Sucesso! ${player.name} salvou uma espécie no Santuário!`);
            break;
          }
        }
      }
    }

    this.handleThreatZones(token);
    this.checkCollisions(token);
    
    // Se tirou 6, joga de novo, senão troca o turno
    if (this.diceValue !== 6) {
      this.nextTurn();
    } else {
      this.rolledThisTurn = false;
      this.addLog(`Energia extra! ${this.players[this.currentPlayerIndex].name} joga de novo.`);
    }

    return true;
  }

  handleThreatZones(token) {
    if (token.status !== 'on-path') return;
    
    // Zonas de ameaça (por exemplo, índices 10, 25, 35, 48)
    const threatZones = [10, 25, 35, 48];
    if (threatZones.includes(token.position)) {
      this.addLog(`🔴 Alerta! Zona de poluição detectada. ${this.players[this.currentPlayerIndex].name} recuou 2 casas.`);
      token.position = (token.position - 2 + this.boardPathLength) % this.boardPathLength;
    }
  }

  checkCollisions(token) {
    if (token.status !== 'on-path') return;

    this.players.forEach(p => {
      if (p.id === this.currentPlayerIndex) return;
      p.tokens.forEach(otherToken => {
        if (otherToken.status === 'on-path' && otherToken.position === token.position) {
          otherToken.status = 'at-base';
          otherToken.position = -1;
          this.addLog(`⚔️ Unidade restaurada! ${p.name} voltou para a base.`);
        }
      });
    });
  }

  addLog(msg) {
    this.log.unshift(msg);
    if (this.log.length > 20) this.log.pop();
  }
}
