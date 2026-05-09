# Slice 3 Notes

## Status
complete locally; production verification pending

## What was built
- `/chat` now hydrates recent visible chat from persisted `LearningEvent` rows.
- New messages still append optimistically in the client, then persist through the existing `/api/chat` and `/api/chat/attempt` routes.
- New `RevisionItem` rows are created from each newly created `Mistake`.
- Existing active mistakes without revision rows are backfilled when the Revise tab loads.
- Revise tab is wired to due `RevisionItem` cards with reveal, `Again`, and `Got it` actions.
- `POST /api/revision/review` schedules the next review and settles the source mistake after three successful reviews.
- Mistakes tab is wired to real `Mistake` rows grouped by recency.
- Tab chrome now uses the documented English labels: `Chat`, `Revise`, `Mistakes`.

## Scheduling
- New revision cards are due immediately so the learner can review fresh mistakes.
- `Again` keeps the interval at 1 day, lowers ease slightly, and does not count toward settling.
- `Got it` increases ease, grows the interval up to a 14-day cap, and settles the source mistake after the third successful review.
- No schema change was required; scheduling uses the existing `RevisionItem.nextReview`, `intervalDays`, `ease`, and `reviewCount` fields.

## Validation Boundary
- Local validation can prove data wiring, route ownership checks, scheduler behavior, and build health.
- Browser-level visual validation still needs a human walk for long real mistakes, dark mode, narrow mobile width, and keyboard flow.
- Production DB evidence remains pending until Railway/Postgres access or developer-provided query output is available.

## Local Validation
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run check:policy`: pass.
- `npm run test:unit`: pass.
- `npm run eval`: pass.
- `npm run build`: pass after stopping the local dev server that had locked Prisma's generated query engine.
- Local unauthenticated `POST /api/revision/review`: `401 Unauthorized`.

## Not Built
- Image upload or vision work.
- Dummy image staging from the visual pass; the attach button is disabled until Slice 4 adds real upload/capture.
- Speaking/writing practice expansion.
- A full desktop sidebar or collapsible conversation panel.
- Profile/settings management beyond the existing name modal.
- Any Prisma migration or schema rewrite.
