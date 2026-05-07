# Slice 1 Notes

## Status
- Slice 1 is not marked done yet.
- The structure is in place.
- The first-login display name modal is now verified locally after a bug fix.
- Remaining blockers are authenticated chat/refusal proof, spend-cap proof, event/admin stats proof, and Railway deployment.

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
- `npm run dev` boots successfully.
- `GET /login` returns `200`.
- Local seeded login works when `ADMIN_PASSWORD_HASH` is set to a known test password hash for the audit run.
- Unauthenticated `POST /api/chat` returns `401`.
- The 11th unauthenticated request to `/api/chat` within 60 seconds returns `429`.
- First-login display name modal behavior is verified with the protocol below.

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
- Production seeded plaintext password is still not known; local audit used a temporary known test hash.
- Authenticated `die Leistung` round-trip through `/api/chat`.
- Authenticated out-of-scope refusal path with log proof that the responder call is skipped.
- Daily spend cap behavior through the app route.
- LearningEvent row contents in the real database after successful chats.
- `/admin/stats` contents after real logins and events.
- Railway deployment and public URL checks.

## Exit criteria audit
- `1` Railway deploy from `main`: not verified.
- `2` `/login` accepts seeded credentials: verified locally with a temporary known test password hash; production plaintext password still needed.
- `3` first-login displayName modal flow: verified locally with the two-round protocol above.
- `4` authenticated `die Leistung` response shape: not verified through the app route.
- `5` authenticated out-of-scope refusal without responder call: not verified.
- `6` `LearningEvent` rows populated after successful chat: not verified.
- `7` unauthenticated `/api/chat` rejects with `401`: verified.
- `8` 11th request in 60 seconds returns `429`: verified.
- `9` daily spend cap refusal without OpenAI call: not verified.
- `10` eval runs all 8 golden examples and prints drift: verified locally.
- `11` formality grep or policy check: verified through `npm run check:policy`.
- `12` no mixed gloss lines in few-shot file: verified through `npm run check:policy`.
- `13` login tracking timestamps and count: partially verified; protocol runs showed `loginCount` moved to `2` in Round 1 and `3` in Round 2, but timestamps still need a dedicated check.
- `14` `/admin/stats` behind auth with expected JSON block: not verified.
- `15` architecture documentation exists: verified.
- `16` README setup steps exist: verified.
- `17` forbidden learner-facing exam vocabulary absent from app surfaces: verified by `npm run check:policy` for current local files.

## Next steps
- Get the seeded plaintext password, or keep using a temporary known test hash for local-only authenticated audit runs.
- Walk `/admin/stats` against the real database after authenticated chat events.
- Capture logs for one out-of-scope request and one in-scope request after login.
- Verify the daily spend cap by temporarily lowering `DAILY_SPEND_CAP_USD`.
- Deploy to Railway and repeat the same checklist against the public URL.

## Visual Integration Pass (post-Slice-1)
- Status: in progress.
- Date: 2026-05-07.
- Components built: `AppShell`, `TabBar`, `Composer`, `UserBubble`, `AssistantBlock`, `LemmaAnchor`, `BilingualPair`, `StatusDot`, `RevisionCard`, `MistakeRow`, `ImageChip`, `AdminStatCard`.
- Design tokens applied: `tailwind.config.ts`, `app/globals.css`.
- Structured field added to `LearningEvent`: yes; `structured Json?` persists optional render hints and `imagePath String?` is reserved as null for Slice 4.
- Schema changes: additive `LearningEvent.structured Json?`, additive `LearningEvent.imagePath String?`.
- Prompt changes: `response_word_query.md` and `response_phrase_query.md` updated to emit `structured` as a mirror of `response`.
- Eval result post-pass: pass (`npm run eval`).
- Policy check post-pass: pass (`npm run check:policy`).
- Section 15 exit criteria after this pass: local checks re-walked with a temporary audit password hash and no local regressions found; Railway deploy and public URL checks remain.
