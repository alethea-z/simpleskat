# Transparency and Logging

## Purpose
Make the process inspectable without turning it into a black box.

## What should be visible by default
- current phase
- current project
- active agent
- latest input artifact
- latest output artifact
- blockers
- next action

## What should be visible on demand
- phase prompts
- intermediate reasoning summaries
- subagent outputs
- quality gate results
- retry or fallback decisions

## Log artifact format
Use a short phase log whenever a step matters for later analysis.

### Phase log fields
- timestamp
- project
- phase
- agent
- input artifact
- output artifact
- decision
- blocker
- next action
- visibility level

## Visibility levels
- `default` — shown to the human without extra digging
- `inspectable` — saved and retrievable on request
- `internal` — kept for debugging or process analysis only

## Logging rules
- Keep logs short and structured.
- Log transitions, not every tiny thought.
- Log the reason for blockers and workarounds.
- Log when a human review changes the path.
- Prefer durable markdown over ephemeral chat as the source of truth.
