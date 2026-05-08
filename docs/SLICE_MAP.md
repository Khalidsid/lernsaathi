# Slice Map

| # | Name | What it adds |
|---|---|---|
| 0 | Foundation | Scaffold, full schema, auth, OpenAI wrapper, prompt pipeline shape, logging |
| 1 | Word & phrase queries | Single text input, classifier-lite, Hinglish response, event logging |
| 1.5 | Visual Integration | Apply design system from Lernsaathi.html to existing slice 1 surfaces; build component dictionary; add tab placeholders |
| 2 | Grammar Q & sentence correction | Full classifier, adaptive depth router, verifier, mistake creation; local complete 2026-05-08, Railway route smoke verified |
| 3 | Mistake memory & revision queue | SM-2 scheduling, daily review UI, prior-mistake injection |
| 4 | Image input | File upload, vision, multi-exercise handling |
| 5 | Writing prompts | Scaffolded writing support |
| 6 | Picture description | Observation-first guidance |
| 7 | Reading/listening question decoding | Task phrase decoding and answer strategy |
| 8 | Speaking practice | Text-only speaking support |
| 9 | Personal-story to German | Guided narrative conversion |
| 10 | Hidden exam-readiness map | Internal skill-level updates and insights |
| 11 | Polish & PWA | Installability, offline queue, export, theming |

## Current Status
- Slice 0 + Slice 1: live in production; login, migrations, real prompt-pipeline calls, OpenAI responses, and structured rendering are working.
- Slice 1.5 Visual Integration: live in production; design tokens, dark mode, assistant blocks, lemma underline, bilingual pairs, and tab shell are rendering correctly.
- Slice 2: complete locally; diagnostic classifier, adaptive depth, chhota-check verifier, Pattern A, Mistake writes, prior-mistake awareness, and attempt feedback pass local checks.
- Production smoke: Railway public `POST /api/chat` returns the expected unauthenticated `401`; new Slice 2 `POST /api/chat/attempt` also returns `401`, confirming the new route is live.
- Local dev auth: username `admin`, password `testpass123`; the prior failure was a local bcrypt hash mismatch, not production credentials being requested.
- Remaining evidence follow-up: authenticated production behavior walk, production `LearningEvent.structured` DB spot-check, first production `Mistake` row, and production `/admin/stats` spot-check.
- Pairing protocol: developer owns visual/browser validation and production DB evidence; Codex records unavailable evidence as pending instead of changing code to manufacture a minor validation pass.
- Frontend persistence note: visible chat history is in-memory until Slice 3; database event rows should persist across refresh.
- UI chrome decision: English tabs/actions from the design HTML default voice bank are intended (`Chat`, `Revise`, `Mistakes`, `Sign in`, `Continue`, `Skip`, `Show`). Current Hinglish chrome labels are documented as a future UI-copy correction.
- Exact latest commit is tracked by git history; this status page avoids commit hashes that go stale after doc-only updates.
