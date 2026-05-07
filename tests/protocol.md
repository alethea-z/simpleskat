# Test Protocol

Last run: 2026-05-07

## Summary
- Total executable tests last run: 13
- Unit tests: 11
- Protocol page test: 1
- Browser execution test: 1
- Result: all passed

## BDD specification suite
- Source: `tests/bdd/*.feature`
- Executable runner: `tests/bdd/runner.mjs`
- Coverage summary: `tests/bdd/COVERAGE.md`
- Browser-readable protocol: `tests/protocol.html`
- Machine-readable status: `tests/protocol.json`
- Status: executable now, with the current snapshot rendered into the HTML protocol

## Unit coverage (`tests/skat.unit.test.mjs`)
1. **Sort order in suit contracts**
   - Verifies trumps lead the hand and cards remain grouped in the expected order.
2. **Trick resolution in Grand**
   - Verifies the highest trump wins when jacks and suit cards are played.
3. **Trick resolution in Null**
   - Verifies the highest card of the lead suit wins when no trumps exist.
4. **Full deck eye accounting**
   - Verifies the complete deck totals 120 eyes.
5. **Dealing / redistribution eye accounting**
   - Verifies dealt hands plus skat still total 120 eyes.
6. **Legal move enforcement**
   - Verifies follow-suit logic: if a suit can be followed, only that suit is legal.
7. **Bid ladder ceiling**
   - Verifies the bid sequence caps at 240.
8. **Dealer rotation**
   - Verifies the next game rotates the dealer left and advances the round.
9. **Point audit**
   - Verifies a fresh game still accounts for all 120 eyes.
10. **Null follow logic**
    - Verifies only the led suit is legal in Null when the suit is available.
11. **Trump-follow logic in suit games**
    - Verifies only trumps are legal when trump is led and available.

## Browser BDD coverage (`tests/browser.bdd.test.mjs`)
1. **Full playable MVP flow**
   - Opens the app in a mobile viewport.
   - Runs a complete game through the browser.
   - Verifies the game reaches a valid result.
   - Verifies hidden discard cards are not leaked in the flow.

## Related files
- `tests/README.md` — short overview of the test setup.
- `phase-log.md` — high-level project phase log.
- `package.json` — test commands.

## Current gaps
- No separate machine-readable per-run archive yet.
- No scenario-by-scenario BDD report beyond the test file and this protocol summary.
