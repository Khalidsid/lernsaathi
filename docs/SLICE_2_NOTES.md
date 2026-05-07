# Slice 2 Notes

## Status
in progress

## What was built
- Slice 1 blocker fixes are complete.

## Slice 1 bugs fixed
- Compound-word classification: fixed by extending `prompts/classifier.md` with positive B1+ compound examples and boundary examples. Evidence: direct classifier smoke run returned `word_query` for `staatsangehörigkeit`, `Krankenversicherung`, `Aufenthaltsgenehmigung`, `Sehenswürdigkeit`, and `Lebensmittelgeschäft`.
- Out-of-scope label consistency: fixed by routing templated labels through `getLearnerVisibleLabelForEvent` in `lib/pipeline/labels.ts`; `out_of_scope` maps to `Aufgabe verstehen`.
- Templated-refusal responseDepth: fixed by forcing out-of-scope and daily-limit rows to `quick_answer`; daily-limit rows now use `inputType = daily_limit_reached` and label `Wörter verstehen`.

## Verified locally
- `npm run check:policy`: pass.
- `npm run typecheck`: pass.
- `npm run eval`: pass.
- `npm run lint`: pass.
- Compound classifier smoke: pass for the five target compounds.

## Verified on Railway
- Pending for Slice 2.

## Section 13 Exit Criteria Walked
- Pending.

## Issues / deferrals
- `docs/build_prompts/visual_integration_pass.md` is referenced by the Slice 2 prompt but is missing from the repo. The visual rules were read from `docs/VISUAL_INTEGRATION_NOTES.md` and `docs/design_concept/Lernsaathi.html`.
