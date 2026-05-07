# Requirements Update

## New requirements
1. The human hand is sorted visually from left to right in descending strength, grouped by suit/trump order.
2. The log must not reveal hidden discard information from the skat phase.
3. Stich winner determination must be rule-correct and the next lead must always belong to the winner.
4. Eye counting must be validated by automated tests.
5. BDD-style behavior specifications must cover the supported Skat rule families.
6. The BDD suite must execute in a browser and capture a screenshot for every test step of the actual Skat application UI.
7. The first acceptance artifact is a browser-readable HTML test protocol page where all covered rule cases are shown as green/passing.
8. Tests and deployment must run automatically in GitHub Actions.

## Acceptance intent
- Hand ordering is deterministic and rule-aligned.
- Hidden information stays hidden.
- Every completed trick is awarded to the correct player.
- Deck and game point totals are internally consistent.
- The browser flow remains playable on a mobile viewport.
- The HTML protocol makes the covered rule cases visible and inspectable.
- Browser screenshots are retained as a published artifact/report and show the actual game UI.
