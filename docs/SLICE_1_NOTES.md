# Slice 1 Notes

## Status
- Slice 1 local verification is complete for the audited Slice 0 + Slice 1 behaviors.
- The first-login display name modal is verified locally after a bug fix.
- Authenticated chat, out-of-scope refusal, spend-cap refusal, event logging, and admin stats are verified locally with a temporary audit password hash.
- Visual Integration Pass 1.5 is implemented, committed, pushed to `main`, and locally verified.
- Railway production is live and functional: login worked, migrations ran, and real authenticated prompt-pipeline queries executed through OpenAI.
- Production verified queries: `fliesend` and `sich vorstellen` both returned structured assistant responses rendered with the visual system intact.
- Railway public unauthenticated `POST /api/chat` also returns `401` from `https://lernsaathi-production.up.railway.app/api/chat`.
- Remaining evidence follow-up: spot-check production `LearningEvent.structured` rows and production `/admin/stats`.

## Prompt and repo audit fixes
- Added `exam` back to the forbidden list in `prompts/system_core.md`.
- Rewrote `prompts/style_guide_hinglish.md` to show forbidden and required formality pairs explicitly.
- Added the expected JSON schema block to `prompts/classifier.md`.
- Moved the original build prompt to `docs/build_prompts/slice_0_and_1.md`.
- Confirmed `lernsaathi_repo/` was a stray nested Git clone and removed it.
- Tightened `scripts/check-policy.mjs` so it checks prompt-contract completeness and does not false-positive on `example`.

## Verified locally
- `npm run check:policy` passes.
- `npm run eval` runs all 8 golden examples against the live API and reports similarity plus negative checks.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes with the local `.env`.
- `npm run build` now runs `prisma generate && next build`, so deployed builds generate Prisma Client before Next.js compiles.
- `npm run dev` boots successfully.
- `GET /login` returns `200`.
- Local seeded login works when `ADMIN_PASSWORD_HASH` is set to a known test password hash for the audit run.
- Unauthenticated `POST /api/chat` returns `401`.
- The 11th unauthenticated request to `/api/chat` within 60 seconds returns `429`.
- First-login display name modal behavior is verified with the protocol below.
- Authenticated `die Leistung` round-trip is verified locally; it renders a structured response and writes a populated `LearningEvent`.
- Authenticated out-of-scope request is verified locally; it returns the fixed Hinglish refusal and skips the responder call.
- Daily spend cap behavior is verified locally with `DAILY_SPEND_CAP_USD=0.001`; it returns the daily-limit string without OpenAI calls.
- `/admin/stats` is verified locally behind auth with the expected visual cards and JSON data shape.

## First-login name modal protocol

Reset command before each round:

```bash
npx prisma migrate reset --force --skip-generate
```

Round 1: entering a name.
- Wipe the database to start clean.
- Log in. The popup should appear.
- Type `Khalid` and save.
- Log out, then log back in. The popup should not appear.
- Check the database and confirm the name is saved as `Khalid`.

Round 1 result:
- Popup showed up on first login.
- Name was saved as `Khalid`.
- Popup did not show up after logout and login again.
- Database confirmed `displayName` is `Khalid`.
- Database showed `displayNamePromptCount` is `0`.

Round 2: skipping twice.
- Wipe the database to start clean.
- Log in. The popup should appear. Click `Abhi nahi`.
- Log out, then log back in. The popup should appear a second time. Click `Abhi nahi` again.
- Log out, then log back in a third time. The popup should not appear.
- Check the database and confirm skip count is `2` and no name is saved.

Round 2 result:
- Popup showed up on first login.
- Popup showed up again on second login after one skip.
- Popup did not show up on third login after two skips.
- Database confirmed `displayNamePromptCount` is `2`.
- Database confirmed `displayName` is `null`.

Bug found and fixed:
- The modal previously wrote `display-name-prompt-dismissed` to `sessionStorage` after a skip or save.
- That browser-only flag hid the popup after one skip, even though the database skip count was only `1`.
- Removed the `sessionStorage` dismissal logic from `components/ChatShell.tsx` and `components/NamePromptModal.tsx`.
- The database is now the source of truth for whether the popup should appear.

## Still unverified
- Exact `LearningEvent.structured.lemma.word` values in the Railway database for the production queries, especially typo-normalized `fliesend` -> `fließend`.
- `/admin/stats` contents against Railway after the real public login and chat events.
- Deployment SHA visibility from Railway is not separately recorded; app behavior confirms a deployed build with migrations and visual integration is live.

## Exit criteria audit
- `1` Railway deploy from `main`: verified; production URL is reachable, login works, migrations ran, and authenticated prompt-pipeline queries execute.
- `2` `/login` accepts seeded credentials: verified in production.
- `3` first-login displayName modal flow: verified locally with the two-round protocol above.
- `4` authenticated word/phrase response shape: verified locally with `die Leistung` and in production with `fliesend` and `sich vorstellen`.
- `5` authenticated out-of-scope refusal without responder call: verified locally through logs.
- `6` `LearningEvent` rows populated after successful chat: verified locally; production row spot-check still pending for exact structured payload values.
- `7` unauthenticated `/api/chat` rejects with `401`: verified locally and against the Railway public URL.
- `8` 11th request in 60 seconds returns `429`: verified.
- `9` daily spend cap refusal without OpenAI call: verified locally with a lowered cap.
- `10` eval runs all 8 golden examples and prints drift: verified locally.
- `11` formality grep or policy check: verified through `npm run check:policy`.
- `12` no mixed gloss lines in few-shot file: verified through `npm run check:policy`.
- `13` login tracking timestamps and count: partially verified; protocol runs showed `loginCount` moved to `2` in Round 1 and `3` in Round 2, but timestamps still need a dedicated check.
- `14` `/admin/stats` behind auth with expected JSON block: verified locally; production spot-check pending.
- `15` architecture documentation exists: verified.
- `16` README setup steps exist: verified.
- `17` forbidden learner-facing exam vocabulary absent from app surfaces: verified by `npm run check:policy` for current local files.

## Next steps
- Query the Railway database for the latest `LearningEvent.structured` values from `fliesend` and `sich vorstellen`.
- Walk `/admin/stats` against the Railway database after the authenticated public chat events.
- Keep the public `401`, login, and real-query production evidence as the baseline before starting Slice 2.

## Visual Integration Pass (post-Slice-1)
- Status: live in production; DB/admin evidence spot-checks pending.
- Date: 2026-05-07.
- Components built: `AppShell`, `TabBar`, `Composer`, `UserBubble`, `AssistantBlock`, `LemmaAnchor`, `BilingualPair`, `StatusDot`, `RevisionCard`, `MistakeRow`, `ImageChip`, `AdminStatCard`.
- Design tokens applied: `tailwind.config.ts`, `app/globals.css`.
- Structured field added to `LearningEvent`: yes; `structured Json?` persists optional render hints and `imagePath String?` is reserved as null for Slice 4.
- Schema changes: additive `LearningEvent.structured Json?`, additive `LearningEvent.imagePath String?`.
- Prompt changes: `response_word_query.md` and `response_phrase_query.md` updated to emit `structured` as a mirror of `response`.
- Eval result post-pass: pass (`npm run eval`).
- Policy check post-pass: pass (`npm run check:policy`).
- Section 15 exit criteria after this pass: local checks re-walked with a temporary audit password hash and no local regressions found; Railway production login and real prompt-pipeline queries are working; public unauthenticated `POST /api/chat` returns `401`; production DB/admin spot-checks remain.
- Git status: visual integration commit `c57758e` and Prisma build fix commit `04a96d3` pushed to `origin/main`.
