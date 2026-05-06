# Discovery Result

## Problem
Build a mobile-friendly web app that lets one human play a single rule-conformant game of Skat against two computer opponents.

## User outcome
- The application can be opened in a browser.
- A complete standard game of Skat can be played end to end.
- The human is the only human player.
- The two other seats are computer-controlled.
- The result of the game is determined automatically.

## Constraints
- Web application
- Plain HTML/CSS/JS preferred for the first version
- Must work reasonably well on Android smartphone screens
- Standard Skat rules only
- No variants or special rules
- No flashy graphics needed
- The computer opponents should make sensible but simple decisions
- Deterministic behavior is preferred

## Assumptions
- A browser app is the right delivery path.
- A single complete game is a good MVP boundary.
- Simple heuristics are acceptable for the computer players.
- The highest-value first slice is the full game loop, not a polished visual design.

## Non-goals
- Multiplayer networking
- Fancy animations or graphics
- Advanced AI strategies
- Variant rule sets
- Long-term campaign mode

## Open questions
- How strictly should the engine enforce every edge rule in the MVP?
- What exact mobile layout is needed for comfortable play on Android?
- How much explanation of the game state should be visible at each step?

## Recommended next step
Turn the idea into testable requirements and then plan the game as a sequence of small, rule-focused slices.
