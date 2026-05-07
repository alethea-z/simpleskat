# Tests

- `skat.unit.test.mjs` covers rules, sorting, trick resolution, and point accounting.
- `browser.bdd.test.mjs` is the current browser execution harness for the MVP.
- `serve.mjs` provides the static test server used by browser execution.
- `protocol.md` is the human-readable test protocol with the latest coverage summary.
- `protocol.html` is the browser-readable green-pass snapshot of the current BDD execution.
- `protocol.json` is the machine-readable execution snapshot used by the protocol page.
- `browser-bdd-report.html` and `browser-artifacts/screenshots/*.png` are the browser-captured per-case screenshots.
- `bdd/README.md` defines the BDD approach for this project.
- `bdd/runner.mjs` executes the feature files against the current model/tests.
- `bdd/browser-protocol-screenshots.mjs` captures the browser screenshots for the published report.
- `bdd/*.feature` contains the business-facing Skat behavior cases.
- `bdd/COVERAGE.md` maps the rule areas and case counts.
