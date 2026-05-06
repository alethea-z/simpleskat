import { createGame } from './src/game.js';

const el = {
  phase: document.getElementById('phaseLabel'),
  round: document.getElementById('roundLabel'),
  dealer: document.getElementById('dealerLabel'),
  contract: document.getElementById('contractLabel'),
  seats: document.getElementById('seats'),
  hand: document.getElementById('hand'),
  handCount: document.getElementById('handCount'),
  log: document.getElementById('log'),
  newGameBtn: document.getElementById('newGameBtn'),
};

let game = createGame();

function render() {
  el.phase.textContent = game.phaseLabel();
  el.round.textContent = `Spiel ${game.gameNo}`;
  el.dealer.textContent = `${game.seatName(game.dealerIndex)} (Dealer)`;
  el.contract.textContent = game.contractLabel();
  el.handCount.textContent = `${game.human.hand.length} Karten`;

  el.seats.innerHTML = game.seats
    .map((seat, index) => {
      const classes = ['seat'];
      if (index === game.currentTurnIndex) classes.push('current');
      if (seat.id === 'human') classes.push('human');
      const cards = seat.id === 'human'
        ? `${seat.hand.length} Karten in der Hand`
        : `${seat.hand.length} Karten, KI (${seat.ai})`;
      return `
        <div class="${classes.join(' ')}">
          <strong>${seat.label}</strong>
          <div class="meta">${cards}</div>
          <div class="meta">Rolle: ${seat.role}</div>
        </div>
      `;
    })
    .join('');

  el.hand.innerHTML = game.human.hand
    .map((card) => `<div class="card-pill ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}">${card.short}</div>`)
    .join('');

  el.log.innerHTML = game.log.slice(-8).map((line) => `<li>${line}</li>`).join('');
}

el.newGameBtn.addEventListener('click', () => {
  game = game.nextGame();
  render();
});

render();
