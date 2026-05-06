# Project Preflight Checklist

Use this checklist before starting any new project with the agent team.

## 1) Outcome
- What should the end user be able to do?
- What is the smallest visible success state?
- Who must be able to verify it?

## 2) Delivery
- How will the result be reached by the user?
- Local only, internal URL, public URL, or packaged artifact?
- Is the delivery path available right now?

## 3) Verification
- What can be checked in terminal?
- What needs a browser or other GUI?
- What is the fallback if the browser is unavailable?

## 4) Scope control
- What is the smallest vertical slice?
- What is explicitly out of scope?
- What is the first thing to avoid adding?

## 5) Readiness
- Are the requirements testable?
- Are the dependencies available?
- Are the acceptance criteria specific enough to decide done / not done?

## 6) Risk triage
Classify each issue as one of:
- project-specific nuisance
- likely recurring obstacle
- fundamental blocker

### Decision rule
- Fix project-specific nuisances inside the project.
- Turn recurring obstacles into reusable infrastructure or process rules.
- If a blocker makes the plan invalid or impossible, re-scope before coding.
- Use a workaround only when the original plan is still valuable and the workaround is temporary.

## 7) DoR / DoD
### Definition of Ready
A task is ready only if:
- the goal is clear
- the scope is small
- the dependencies are available
- the verification path is known

### Definition of Done
A task is done only if:
- the change is visible or testable
- the expected behavior is verified
- the result is recorded
- follow-up work is explicit

## 8) Minimum start packet
Before implementation, create:
- README / project brief
- STATE.md
- discovery result
- requirements result
- plan result
- first issue draft
- verification notes
