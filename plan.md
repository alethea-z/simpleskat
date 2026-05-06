# Planning Seed

## Current direction
Start with a playable game skeleton and then add rule-correct Skat phases in small vertical slices.

## Proposed issues
1. Define the game state model, deck model, and mobile-first page skeleton.
2. Implement deterministic dealing and card display.
3. Implement bidding and skat handling.
4. Implement legal play flow and simple AI moves.
5. Implement scoring and automatic winner determination.
6. Add behavior tests for the critical game flow.
7. Review mobile usability on Android-sized screens.

## Planning rules
- One issue must map to one small, testable outcome.
- Keep the first slice playable, even if the rules coverage is still limited.
- Prefer vertical slices over separate technical layers.
- Capture rule limitations explicitly so they do not hide as bugs.
