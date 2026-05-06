# Slice 1 Notes

## What was built
- Next.js app shell with login, chat surface, admin stats page, and first-login name capture.
- Full Prisma schema from slice 0, plus prompt-loading, rate limiting, spend-cap guard, and event logging.
- Three-stage pipeline with a live classifier and responder, plus verifier stub.
- Prompt files, golden eval data, and lightweight policy checks.

## What was deferred
- Mistake creation.
- Revision queue and scheduling.
- Image handling.
- Writing, speaking, and reading/listening flows.
- Any use of `displayName` inside routine word or phrase answers.

## What surprised me
- The prompt brief creates a tension between documenting forbidden forms in prompt files and grepping for those same forms. The implemented checks therefore validate outputs and learner-facing files rather than failing on teacher-side instructions.
