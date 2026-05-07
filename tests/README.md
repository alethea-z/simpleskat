# Tests

- `skat.unit.test.mjs` covers rules, sorting, trick resolution, and point accounting.
- `browser.bdd.test.mjs` is the current browser execution harness for the MVP.
- `serve.mjs` provides the static test server used by browser execution.
- `protocol.md` is the human-readable test protocol with the latest coverage summary.
- `protocol.html` is the browser-readable green-pass snapshot of the current BDD execution.
- `protocol.json` is the machine-readable execution snapshot used by the protocol page.
- `browser-bdd-report.html` and `browser-artifacts/cucumber/**` are the browser-captured per-step screenshots from the actual app.
- `cucumber-execution.ndjson` is the step-by-step execution trace used to build the browser report.
- `bdd/README.md` defines the BDD approach for this project.
- `bdd/runner.mjs` executes the existing machine-level rule coverage checks.
- `cucumber/features/*.feature` defines the browser-based BDD scenarios.
- `cucumber/support/browser.mjs` and `cucumber/steps/game.steps.mjs` provide the browser glue code.
- `scripts/run-cucumber-browser.mjs` runs the browser BDD suite in a container.
- `scripts/build-cucumber-report.mjs` builds the human-readable browser report.
- `bdd/COVERAGE.md` maps the rule areas and case counts.
