# Learning Modes Dashboard Planning

**Status:** superseded on 2026-05-10
**Superseded by:** `docs/PROBLEM_FIRST_LEARNING_JOURNEYS.md`

---

## Decision

The earlier seven-tile dashboard concept is no longer the active product direction.

Do not implement the old plan:

- Generic `Chat`, `Revise`, `Mistakes`, `Words`, `Grammar`, `Reading`, `Writing` dashboard.
- Large `Today's Progress` tile above the work area.
- Free chat as a primary landing tile.
- Coming-soon tiles that look like primary actions.

The active direction is problem-first:

```text
Hello [Name], welcome to Lernsaathi.
Which problem do you need assistance with?

Aapko kis task mein madad chahiye?
```

The landing screen has six high-gloss German/Hinglish problem tiles:

- `WOERTER` - `Word ya phrase ka matlab samajhna`
- `LESEN` - `Letter, form, email ya notice padhna`
- `SCHREIBEN` - `Message, email ya reply likhna`
- `GRAMMATIK` - `Sentence ya grammar mistake theek karna`
- `HOEREN` - `Jo suna hai uska matlab samajhna`
- `WIEDERHOLEN` - `Apni mistakes revise karna`

Progress is a compact collapsed learning coach, not a large dashboard card.

---

## Active References

Use these files instead of this historical planning note:

1. `docs/PROBLEM_FIRST_LEARNING_JOURNEYS.md` - product, copy, tile data, visual values, and journey model.
2. `docs/slices/SLICE_3_14_BRIEF.md` - executable low-reasoning implementation packet for the problem-first landing screen.
3. `docs/slices/SLICE_3_15_BRIEF.md` - active-learning component packet.
4. `docs/slices/SLICE_3_16_BRIEF.md` - journey-screen packet.
5. `docs/UX_ARCHITECTURE.md` - shared UI policy.
6. `docs/COMPONENT_CONTRACTS.md` - component ownership and non-goals.

---

## Why It Changed

The product problem is not simply "show a dashboard after login."

The real problem is that the learner should not need to decide between app features. The learner should choose the real-world task they need help with, then enter a low-cognitive-load journey with one obvious next step.
