# Lernsaathi / Sprachhilfe

Single-user German learning companion for a Hinglish-speaking learner. Slice 0 + Slice 1 covers login, first-login name capture, word and phrase meaning help, event logging, and the three-stage prompt pipeline.

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
