import { createGame, contractValueEstimate, makeContract } from './src/game.js';

const el = {
  phase: document.getElementById('phaseLabel'),
  round: document.getElementById('roundLabel'),
  dealer: document.getElementById('dealerLabel'),
  bid: document.getElementById('bidLabel'),
  score: document.getElementById('scoreLabel'),
  declarer: document.getElementById('declarerLabel'),
  contract: document.getElementById('contractLabel'),
  seats: document.getElementById('seats'),
  trick: document.getElementById('trickLabel'),
  hand: document.getElementById('hand'),
  handCount: document.getElementById('handCount'),
  controls: document.getElementById('controls'),
  log: document.getElementById('log'),
  result: document.getElementById('result'),
  newGameBtn: document.getElementById('newGameBtn'),
};

let game = createGame();

function seatSummary(seat) {
  return `Karten: ${seat.hand.length} · Punkte: ${seat.trickPoints} · Stiche: ${seat.tricksWon} · Reizen bis ${seat.bidCeiling}`;
}

function contractButtonLabel(type, suitKey = null) {
  const contract = makeContract(type, suitKey);
  const value = game.declarerIndex === null ? contractValueEstimate(contract, game.seats[0].hand) : contractValueEstimate(contract, game.seats[game.declarerIndex].hand);
  return `${contract.label} (${value})`;
}

function renderControls() {
  if (game.phase === 'bidding') {
    const canBid = game.allowedHumanBids();
    el.controls.innerHTML = game.currentTurnIndex === 0
      ? `
        <button class="primary" data-action="bid">Bieten ${game.currentBid}</button>
        <button class="secondary" data-action="pass">Passen</button>
        <p class="hint">${game.biddingStateText()}</p>
      `
      : `<p class="hint">${game.biddingStateText()}</p>`;
    const bidButton = el.controls.querySelector('[data-action="bid"]');
    if (bidButton) bidButton.disabled = !canBid;
    return;
  }

  if (game.phase === 'contract') {
    if (game.declarerIndex !== 0) {
      el.controls.innerHTML = `<p class="hint">${game.seatName(game.declarerIndex)} wählt den Spieltyp automatisch.</p>`;
      return;
    }
    el.controls.innerHTML = `
      <p class="hint">Wähle den Spieltyp für den Alleinspieler.</p>
      <div class="contract-grid">
        <button class="primary" data-contract="grand">${contractButtonLabel('grand')}</button>
        <button class="primary" data-contract="null">${contractButtonLabel('null')}</button>
        <button class="primary" data-contract="suit" data-suit="Clubs">${contractButtonLabel('suit', 'Clubs')}</button>
        <button class="primary" data-contract="suit" data-suit="Spades">${contractButtonLabel('suit', 'Spades')}</button>
        <button class="primary" data-contract="suit" data-suit="Hearts">${contractButtonLabel('suit', 'Hearts')}</button>
        <button class="primary" data-contract="suit" data-suit="Diamonds">${contractButtonLabel('suit', 'Diamonds')}</button>
      </div>
    `;
    return;
  }

  if (game.phase === 'skat') {
    if (game.declarerIndex !== 0) {
      el.controls.innerHTML = `<p class="hint">Der Alleinspieler nimmt den Skat auf und legt zwei Karten ab.</p>`;
      return;
    }
    el.controls.innerHTML = `
      <p class="hint">Wähle 2 Karten zum Ablegen.</p>
      <button class="primary" data-action="discard" ${game.discardSelection.length === 2 ? '' : 'disabled'}>2 Karten ablegen</button>
      <button class="secondary" data-action="clear-discard">Auswahl löschen</button>
      <p class="hint">Ausgewählt: ${game.discardSelection.length}/2</p>
    `;
    return;
  }

  if (game.phase === 'result') {
    el.controls.innerHTML = `<p class="hint">Spiel beendet. Du kannst ein neues Spiel starten.</p>`;
    return;
  }

  el.controls.innerHTML = '<p class="hint">Kein Benutzerzug erforderlich.</p>';
}

function render() {
  el.phase.textContent = game.phaseLabel();
  el.round.textContent = `Spiel ${game.gameNo}`;
  el.dealer.textContent = `${game.seatName(game.dealerIndex)} (Dealer)`;
  el.bid.textContent = game.currentBidLabel();
  el.score.textContent = game.scoreLabel();
  el.declarer.textContent = game.declarerIndex === null ? '—' : game.seatName(game.declarerIndex);
  el.contract.textContent = game.contractLabel();
  el.trick.textContent = game.playStateText();
  el.handCount.textContent = `${game.seats[0].hand.length} Karten`;
  el.result.textContent = game.result ? game.resultLabel() : '—';

  el.seats.innerHTML = game.seats
    .map((seat, index) => {
      const classes = ['seat'];
      if (index === game.currentTurnIndex && (game.phase === 'play' || game.phase === 'bidding')) classes.push('current');
      if (index === 0) classes.push('human');
      return `
        <div class="${classes.join(' ')}">
          <strong>${seat.label}${index === game.declarerIndex ? ' · Alleinspieler' : ''}</strong>
          <div class="meta">${seatSummary(seat)}</div>
        </div>
      `;
    })
    .join('');

  const humanLegal = game.phase === 'play' ? game.legalCardsFor(0) : [];
  el.hand.innerHTML = game.seats[0].hand
    .map((card) => {
      const selected = game.phase === 'skat' && game.declarerIndex === 0 && game.discardSelection.includes(card.id);
      const playable = game.phase === 'play' && game.currentTurnIndex === 0 && humanLegal.some((entry) => entry.id === card.id);
      const canClickSkat = game.phase === 'skat' && game.declarerIndex === 0;
      const classes = ['card-pill'];
      if (card.suitKey === 'Hearts' || card.suitKey === 'Diamonds') classes.push('red');
      if (selected) classes.push('selected');
      if (playable) classes.push('playable');
      return `<button class="${classes.join(' ')}" data-card-id="${card.id}" ${playable || canClickSkat ? '' : 'disabled'}>${card.short}</button>`;
    })
    .join('');

  renderControls();
  el.log.innerHTML = game.log.slice(-10).map((line) => `<li>${line}</li>`).join('');
}

el.newGameBtn.addEventListener('click', () => {
  game = game.nextGame();
  render();
});

el.controls.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;
  const { action, contract, suit } = target.dataset;
  if (action === 'bid') game.humanBidStay();
  if (action === 'pass') game.humanBidPass();
  if (action === 'discard') game.commitDiscard();
  if (action === 'clear-discard') game.discardSelection = [];
  if (contract) game.chooseContract(contract, suit || null);
  render();
});

el.hand.addEventListener('click', (event) => {
  const target = event.target.closest('button[data-card-id]');
  if (!target) return;
  const cardId = target.dataset.cardId;
  if (game.phase === 'skat' && game.declarerIndex === 0) {
    game.toggleDiscard(cardId);
    render();
    return;
  }
  if (game.phase === 'play' && game.currentTurnIndex === 0) {
    game.playCard(0, cardId);
    render();
  }
});

render();
