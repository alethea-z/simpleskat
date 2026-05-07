# BDD Coverage Matrix

## Current size
- Feature files: 5
- Behavior scenarios (declarations): 104
- Scenario outline rows: 0
- Total behavior cases represented: 104

## Coverage areas

### 01-dealing-and-bidding.feature
- standard deal structure
- dealer rotation
- auction order
- official bid ladder
- insufficient ceiling handling
- declarer selection
- auction completion
- allowed contract choices
- suit-game base values
- hidden-information protection during bidding

### 02-contract-and-trumps.feature
- suit-game trump hierarchy
- jack hierarchy
- suit-card ordering inside trump suits
- Grand trump rules
- Grand ordering of suit cards
- Null ordering
- no-trump behavior in Null
- deterministic hand sorting
- privacy-safe hand rendering

### 03-trick-play.feature
- follow-suit obligation
- trump-follow obligation
- Null follow rules
- trick winner determination
- next lead transfer
- illegal move rejection
- ten-trick game completion

### 04-scoring-and-result.feature
- 120-eye accounting
- declarer win threshold
- defender win threshold
- Schneider threshold
- Schwarz threshold
- automatic result presentation
- inspectable finish log

### 05-privacy-and-usability.feature
- skat privacy
- no hidden-data leakage in public status
- mobile readability
- usable action controls on narrow screens
- inspectable phase / blocker / next-action logging
- explicit verification notes

## Notes
- The suite is intentionally written as business-facing behavior, not UI automation.
- Browser execution is a delivery mechanism, not the definition of BDD.
- Standard Skat variants outside the MVP scope are not modeled here yet.
- The bid ladder and contract rules are split into smaller, self-contained scenarios instead of one dense outline.
