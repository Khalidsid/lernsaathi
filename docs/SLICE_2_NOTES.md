# Slice 2 Notes

## Status
complete locally; Railway route smoke verified; authenticated production verification pending

## What was built
- Classifier extended for `grammar_question` and `sentence_correction`.
- Adaptive depth router activated in `lib/pipeline/depth.ts`.
- Verifier chhota-check implemented with `prompts/verifier_chhota_check.md` and `lib/pipeline/verifier.ts`.
- First `Mistake` rows are created from diagnostic structured output.
- Pattern A rendered for sentence correction through `ReflectionCard`, `AttemptInput`, `GhostRevealLink`, and `ChhotaCheck`.
- displayName injection works at guided-explanation depth and handles null safely.
- ExamReadinessMap skill updates wired through `lib/pipeline/exam_map.ts`.
- Prior-mistake lookup escalates matching word queries and increments `Mistake.reviewCount`.
- Attempt replies post to `/api/chat/attempt` and use the responder prompt `response_attempt_feedback.md`.
- New eval cases added for grammar question, sentence correction, prior-mistake awareness, and compound-word classification.

## Slice 1 Bugs Fixed
- Compound-word classification: direct classifier smoke returned `word_query` for `staatsangehörigkeit`, `Krankenversicherung`, `Aufenthaltsgenehmigung`, `Sehenswürdigkeit`, and `Lebensmittelgeschäft`.
- Out-of-scope label consistency: `Hello, write me an essay` returned `learnerVisibleLabel = Aufgabe verstehen`.
- Templated-refusal responseDepth: out-of-scope and daily-limit rows both wrote `responseDepth = quick_answer`.

## Verified Locally
- Local auth works with ignored local credentials `admin` / `testpass123`. The earlier failure was a local bcrypt hash mismatch, not production credentials being required.
- `npm run test:unit`: pass.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run check:policy`: pass.
- `npm run eval`: pass; original 8 examples plus 4 Slice 2 cases.
- `npm run build`: pass.
- `Why is "in der Küche" not "in die Küche"?`: `grammar_question`, `guided_explanation`, label `Satz richtig machen`, verifier prompt present, `Khalid` included once.
- `Ich gehe in die Küche, um Essen zu machen.`: `sentence_correction`, Pattern A reflection present, verifier prompt present, `Mistake` created.
- `Küche` after a related open mistake: escalated to `guided_explanation`, included visible `pehle` reminder, and incremented `Mistake.reviewCount` to `1` with `lastReviewedAt` set.
- `die Leistung`: still `quick_answer`, label `Wörter verstehen`, no mistake created.
- `staatsangehörigkeit`: `word_query`, `quick_answer`, label `Wörter verstehen`, structured lemma `Staatsangehörigkeit`.
- `Hello, write me an essay`: `out_of_scope`, label `Aufgabe verstehen`, `quick_answer`.
- Daily cap with local `DAILY_SPEND_CAP_USD=0.001`: `daily_limit_reached`, label `Wörter verstehen`, `quick_answer`, zero token counts.
- With `displayName = null`, guided grammar response rendered without `Khalid` or placeholder leakage.
- ExamReadinessMap after mistake creation showed `grammar_accuracy.cases = weak` and `text_understanding.vocabulary_in_context = weak`; unrelated skills stayed `unknown`.

## Verified on Railway
- `origin/main` pushed and GitHub confirmed at Slice 2 commit `08e75e9`.
- Public `POST /api/chat` without a session returns `401 Unauthorized`.
- Public `POST /api/chat/attempt` without a session returns `401 Unauthorized`, confirming the new Slice 2 route is live on Railway.
- Authenticated production behavior checks and production DB row evidence are still pending.

## Section 13 Exit Criteria Walked
- `1` grammar question diagnostic: verified locally.
- `2` sentence correction Pattern A: verified locally.
- `3` Mistake row after sentence correction: verified locally with full populated row.
- `4` prior-mistake-aware `Küche`: verified locally.
- `5` review count and `lastReviewedAt`: verified locally.
- `6` `die Leistung` regression: verified locally.
- `7` compound-word classification: verified locally for required examples.
- `8` out-of-scope label/depth: verified locally.
- `9` daily cap label/depth: verified locally.
- `10` ExamReadinessMap bump: verified locally.
- `11` displayName at guided depth: verified locally with `Khalid`.
- `12` null displayName path: verified locally.
- `13` Slice 0+1 non-regression: local checks still pass; production re-walk pending.
- `14` Visual integration non-regression: build and local render paths compile; production re-walk pending.
- `15` typecheck, lint, policy, eval, build: pass locally.
- `16` original eight golden examples plus four new cases: pass.
- `17` docs: this file updated.
- `18` architecture docs: updated.
- `19` slice map: updated.
- `20` Railway deploy: route smoke verified by `/api/chat/attempt` returning `401` instead of the old `404`.
- `21` authenticated public behavior checks: pending.
- `22` production Mistake row: pending.

## Issues / Deferrals
- `docs/build_prompts/visual_integration_pass.md` has been restored in the repo for future slice context. During early Slice 2 work it was unavailable, so the visual rules were read from `docs/VISUAL_INTEGRATION_NOTES.md` and `docs/design_concept/Lernsaathi.html`.
- Authenticated production verification is not complete yet. Slice 2 is live at route level, but the public URL still needs the logged-in behavior walk and Railway Postgres `Mistake` row evidence.
- Slice 3 remains deferred: no revision queue UI, mistake-list data wiring, or spaced-repetition scheduling.
