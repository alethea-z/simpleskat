# Quality Gates

## Purpose
Set the baseline for implementation and review quality.

## Universal gates
These apply to all projects:
- clear scope
- explicit acceptance criteria
- small reviewable diffs
- verification before handoff
- follow-up work recorded
- no hidden blocker left unacknowledged

## Architecture gates
- code is modular enough to reason about
- responsibilities are separated
- public behavior is stable and understandable
- implementation details are not leaking into requirements unnecessarily

## Test gates
- unit tests where logic can be isolated
- behaviour tests where user-visible behaviour matters
- no untested critical path if the risk is high
- test failures are understandable and reproducible

## Review gates
- the reviewer can explain what changed
- the reviewer can see how it was verified
- the reviewer can see what is still open
- the reviewer can reject scope creep or ambiguous completion claims

## Project class profiles
### Demo / spike
- minimal architecture
- focused behaviour check
- one or two critical tests
- fastest path to visible verification

### Feature work
- modular structure
- test coverage for core logic
- behaviour test for the visible slice
- explicit acceptance criteria

### Infrastructure / shared tooling
- stronger emphasis on separation of concerns
- stronger verification and regression checks
- backward compatibility notes
- explicit rollback / fallback notes

## Done criteria
A change is only done if:
- the behavior matches the acceptance criteria
- the checks passed
- the result is visible or clearly testable
- the next improvement is recorded separately
