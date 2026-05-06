# Operating Model for Collaborative Software Development

## Goal
Build software together in a way that is:
- requirements-first
- phase-based
- transparent
- quality-gated
- iterable by the human reviewer

## Desired working pattern
1. Ideas are explored in conversation.
2. Requirements are refined collaboratively.
3. The orchestrator runs the agent loop.
4. The team produces a feature that is ready for acceptance.
5. The human tries it, comments, and new requirements enter the loop again.
6. Phase steps and intermediate results remain inspectable at any time.

## What needs to exist

### 1) Requirement conversation layer
A dedicated requirements-side workflow that can:
- generate ideas
- refine ideas with a conversational partner
- turn fuzzy intent into testable requirements
- keep open questions explicit
- mark when a requirement is ready for planning

### 2) Orchestrator loop
An orchestrator that can repeatedly:
- read the current state
- choose the next phase
- spawn the right subagent
- persist the result
- decide whether to continue, stop, or hand back to the human

### 3) Transparency layer
At any point it must be possible to inspect:
- phase transitions
- agent prompts used
- intermediate outputs
- decisions and blockers
- follow-up items

### 4) Quality gates
The implementation side must respect common software-quality criteria:
- clean architecture
- modularization
- test-driven development where useful
- behaviour tests / acceptance tests for user-visible behaviour
- small, reviewable changes
- explicit verification before handoff

### 5) Feedback loop
When a feature is accepted or revised:
- the result is shown to the human
- the human can try it
- changes become new requirements at the top of the loop

## Required artifacts
- project brief
- preflight checklist
- discovery result
- requirements result
- planning result
- STATE.md
- issue drafts
- verification notes
- phase logs when needed

## Required decisions
- what counts as ready for planning
- what counts as done
- what is visible to the human by default
- what is hidden unless requested
- which quality gates are mandatory for each project class

## Immediate next work
1. Define the orchestrator state machine.
2. Define the requirements-side prompt structure.
3. Define the transparency/logging format.
4. Define the quality gate checklist for implementation and review.
5. Connect the loop to a first real project template.
