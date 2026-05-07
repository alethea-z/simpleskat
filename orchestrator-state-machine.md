# Orchestrator State Machine

## Purpose
Keep the agent loop explicit, inspectable, and repeatable.

## States
- `idle` — no active project run
- `discovering` — idea shaping and problem framing
- `requirements` — turning the idea into testable requirements
- `planning` — splitting requirements into issues
- `implementation` — executing one issue or slice
- `review` — verifying the change against quality gates
- `handoff` — returning a usable result to the human
- `blocked` — progress stopped by a blocker that needs a decision
- `archived` — run closed and retained for reference

## State data
Each state transition should record:
- current state
- previous state
- active project
- owner agent
- decision reason
- input artifact
- output artifact
- blockers
- next action

## Transition rules

### idle -> discovering
- a new project idea or feature request exists
- the preflight check says the project is worth starting

### discovering -> requirements
- the problem can be stated clearly
- non-goals and constraints are known enough to proceed

### requirements -> planning
- the requirements are testable
- the scope is narrow enough to estimate
- the readiness criteria are met

### planning -> implementation
- at least one issue is ready for work
- acceptance criteria are explicit
- the delivery path is known

### implementation -> review
- a change has been made
- verification steps are available
- the diff is reviewable

### review -> handoff
- quality gates pass or the remaining issues are explicitly declared
- the human can inspect the result

### any state -> blocked
- a blocker makes progress unsafe or meaningless
- the blocker is recorded with cause and needed decision

### blocked -> previous working state
- the blocker has been resolved or a workaround has been explicitly chosen

### handoff -> idle / archived
- the feature has been shown to the human
- follow-up feedback is captured or the run is done

## Stop conditions
Stop the loop when:
- the next step would repeat without new information
- the current artifact is ready for human review and there is no queued next slice to continue immediately
- the blocker requires a human decision
- the context is getting too large for reliable work

If the current slice is green but the plan still has queued work, continue into the next slice instead of idling.

## Resume rule
When resuming, read the latest `STATE.md`, the latest phase log, and the last output artifact before continuing.
