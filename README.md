# Lernsaathi / Sprachhilfe

Single-user German learning companion for a Hinglish-speaking learner. Current build covers login, first-login name capture, word and phrase meaning help, visual integration, Slice 2 grammar/sentence diagnostics, Slice 2.5 chat UI stabilization, Slice 3 revision and mistake-memory surfaces, event logging, and the three-stage prompt pipeline.

## Setup
1. Clone the repo.
2. Copy `.env.example` to your local `.env` and fill the values.
3. Run `npm install`.
4. Run `npm run prisma:migrate -- --name init`.
5. Run `npm run prisma:generate`.
6. Run `npm run dev`.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test:unit`
- `npm run typecheck`
- `npm run prisma:migrate -- --name <name>`
- `npm run prisma:generate`
- `npm run eval`
- `npm run check:policy`

## Notes
- Railway should receive all secrets from environment variables only.
- `npm run build` runs `prisma generate && next build`, so Railway generates Prisma Client during deploy.
- No public signup flow exists.
- Prompt files are loaded from `prompts/` at runtime, so prompt edits stay reviewable.
- Visible chat history hydrates from recent persisted `LearningEvent` rows.
- UI chrome convention after inspection: tabs and action buttons should use English labels, while learner-facing explanation content remains formal aap-form Hinglish plus German.
- Next planned intermediate slice: Slice 3.5 Auth & Session Hardening.
- Future slice prompts are documented in `docs/build_prompts/future_slice_prompts.md`; the roadmap now inserts Slice 3.6-3.9 before Slice 4 so decision quality and learning UI are strengthened before image input.
