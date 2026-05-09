# Slice 3 Retrospective And Roadmap Restructure Notes

## Status
documented after Slice 3; no implementation in this note

## Why This Note Exists
After Slice 3, the app crossed an important boundary. It was no longer only a chat surface with persisted logs. It now had real learning memory: chat hydration, mistake rows, revision items, review actions, and a visible mistakes tab.

That revealed a product gap. The next valuable step was not simply "add image upload" or "add writing prompts." The app needed a stronger learning decision layer and a sharper interaction model first. Without that, later features would expand surface area while preserving a rudimentary behavior pattern: user asks, LLM answers, UI stores some artifacts.

This note records the shift so future coding sessions do not treat it as an accidental roadmap change.

## Previous Mental Model
The earlier slice sequence assumed a mostly linear feature expansion:

```txt
foundation
word/phrase help
visual integration
grammar/correction
revision/mistakes
auth hardening
image
writing
picture description
reading/listening
speaking
personal story
insights
polish
```

That sequence was useful for scaffolding the product, but it underweighted the decision engine and learning UI that must sit between basic memory and broad multimodal expansion.

## New Mental Model
The app should behave like a diagnostic learning system with chat as one interface, not like a generic chat app with extra tabs.

The per-turn path should become:

```txt
learner input
-> classify the problem
-> inspect learner context
-> choose the learning module
-> choose response depth
-> answer directly
-> add pattern/real-world/exam-relevant context when useful
-> offer one targeted next action
-> update memory and revision state
```

Automation should own structure, memory, timing, routing, duplicate protection, progress, and next-action selection.

The LLM should own explanation, nuance, examples, and flexible feedback inside a controlled module.

## What Was Lacking After Slice 3
Slice 3 made memory real, but the UI and interaction model still had prototype-level gaps:

- The learner could not immediately see the best next action.
- Revision cards worked, but did not explain progress, due reason, or next review timing.
- Mistakes were listed, but not yet useful as a drill-down practice surface.
- Assistant responses were structured, but did not consistently show "mistake saved," "scheduled for review," or "practice this pattern."
- Empty states were calm, but passive.
- The composer was still basic and did not guide common learning modes.
- The app had hidden learning state, but not enough visible learning momentum.
- The product relied too much on LLM response generation instead of deterministic learning flow.

## Product Standard Raised By This Retrospective
Future slices should aim for a sharper standard:

- Every screen should help the learner know what to do next.
- Every saved mistake should become visible future learning value.
- Every assistant answer should usually contain one useful follow-up action.
- No control should look functional unless it is functional.
- The app should make the learner feel remembered without over-personalized filler.
- UI should be high contrast, stable, mobile-safe, and interactive without becoming gamified.
- Exam relevance should guide the system internally, but not pressure the learner on every screen.

## Roadmap Restructure
The roadmap now inserts four bridge slices after Slice 3.5 and before image input:

```txt
3.5 Auth & Session Hardening
3.6 Learning Decision Contract
3.7 Decision Engine V1
3.8 Learning Momentum UI
3.9 Revision & Mistake Practice Upgrade
4 Image Upload And Capture
```

This is intentionally slower and more disciplined than jumping directly to image upload.

## Slice 3.5 Role
Slice 3.5 remains first because identity and idempotency are prerequisites for deeper personalization and future uploads.

It should handle:

- Google OAuth allowlist.
- Existing user-data preservation.
- Future password-account provisions.
- Duplicate chat/revision request protection.
- Parallel revision-item creation protection.
- Durable rate/spend planning.

It should not add the decision engine or image upload.

## Slice 3.6 Role
Slice 3.6 defines the learning decision contract.

It should answer, internally and testably:

- What kind of learner problem is this?
- Which module owns it?
- What depth should be used?
- Is there prior learner context?
- Should a mistake be created or updated?
- Should a revision item be scheduled?
- What is the one best next action?

This slice should mostly create architecture, types/contracts, docs, and tests. It should avoid broad UI work.

## Slice 3.7 Role
Slice 3.7 implements Decision Engine V1.

It should insert a decision-planning stage between classification/context lookup and responder generation.

The goal is not to make responses longer. The goal is to make responses more targeted, contextual, and reliable.

## Slice 3.8 Role
Slice 3.8 turns learning state into visible momentum.

It should add:

- due count
- active mistake count
- today state
- stronger empty states
- quick-start actions
- visible saved/scheduled feedback
- clearer next-best-action entry point

This is where the app should start feeling alive instead of merely functional.

## Slice 3.9 Role
Slice 3.9 upgrades revision and mistake practice.

It should add:

- revision progress
- due reason
- after-review feedback
- richer review actions if justified
- mistake detail
- source context
- "practice this pattern"

This makes the learning loop serious before new modalities are added.

## What This Means For Slice 4
Slice 4 image upload should not be treated as the next obvious feature until the above foundations are in place.

When Slice 4 starts, upload/capture must be real:

- no predefined dummy image
- no staged fake upload
- authenticated ownership
- clear file validation
- real preview/remove behavior
- vision routed through the decision engine

## Documentation Created From This Shift
- `docs/build_prompts/future_slice_prompts.md` now contains prompt-level implementation guidance for Slice 3.5 through Slice 11.
- `docs/SLICE_MAP.md` now includes Slice 3.6, 3.7, 3.8, and 3.9.
- `docs/ARCHITECTURE.md` now records the future decision-engine direction.
- `docs/PROMPT_PIPELINE.md` now records the planned decision-engine layer.

## Non-Goals Of This Retrospective
- No code changes.
- No schema changes.
- No prompt changes.
- No UI changes.
- No implementation of the new slices.

## Guiding Decision
Do not build a large "smart tutor" in one pass. Build the spine first:

```txt
identity safety
-> decision contract
-> deterministic routing
-> visible learning momentum
-> deeper practice UI
-> image/writing expansion
```

The standard is durable, testable, pedagogically coherent implementation. A large partial implementation is worse than a smaller complete slice.
