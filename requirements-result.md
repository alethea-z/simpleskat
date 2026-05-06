# Requirements Result

## Goal
Build a browser-based SimpleSkat MVP where one human can play one complete standard game of Skat against two computer-controlled opponents on an Android-friendly web page.

## Atomic requirements
1. The app starts in a browser and shows the game state clearly.
2. The game deals Skat cards according to the standard deal structure.
3. The game supports the standard bidding phase (reizen).
4. The game supports taking the skat where applicable.
5. The game supports the playing phase with legal moves.
6. The game determines the winner automatically at the end of the game.
7. The app supports standard game types only: Farbspiel, Grand, and Null.
8. The two computer opponents make deterministic, simple, rule-based decisions.
9. The app remains usable on an Android smartphone.
10. The app stays simple and avoids unnecessary visual polish.
11. The human hand is rendered in descending strength order, grouped by trump/suit order.
12. The protocol does not reveal hidden discard identities from the skat phase.
13. Trick winners are always determined by the actual strongest legal card.
14. The implementation keeps the full deck eye total internally consistent and test-verified.
15. BDD-style browser regression tests cover the playable MVP flow.

## Acceptance criteria
- The app can be opened in a browser and a complete game can be started.
- Cards are dealt and visible to the player.
- The bidding phase can complete.
- The skat can be handled according to the selected game type.
- A legal play sequence can finish a full game.
- The winner and final result are shown automatically.
- The computer players do not require manual prompting.
- The UI is usable on a narrow mobile screen.

## Constraints
- Plain HTML/CSS/JS for the first pass.
- Standard Skat rules only.
- No variants or special modes.
- Deterministic simple AI, not strategic long-horizon play.
- No external services for gameplay.

## Edge cases
- Invalid move attempts.
- Illegal bids.
- Legal handling of Grand and Null differences.
- Empty or impossible state transitions.
- Mobile screen width limitations.

## Dependencies
- A rules model for standard Skat.
- A card / deck model.
- A deterministic AI heuristic for the two computer players.
- A browser delivery path for mobile access.

## Open questions
- How much of the full standard rule book must be supported in the MVP versus deferred as clearly documented limitations?
- Should the first slice cover a minimal playable skeleton before full rule correctness is implemented?

## Planning boundary
Plan the MVP as a sequence of small vertical slices, starting with a playable game skeleton and then adding rule-correct phases and scoring.
