# Requirements Update

## New requirements
1. The human hand is sorted visually from left to right in descending strength, grouped by suit/trump order.
2. The log must not reveal hidden discard information from the skat phase.
3. Stich winner determination must be rule-correct and the next lead must always belong to the winner.
4. Eye counting must be validated by automated tests.
5. BDD-style browser tests must cover the full playable MVP flow.

## Acceptance intent
- Hand ordering is deterministic and rule-aligned.
- Hidden information stays hidden.
- Every completed trick is awarded to the correct player.
- Deck and game point totals are internally consistent.
- The browser flow remains playable on a mobile viewport.
