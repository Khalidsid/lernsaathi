# Slice 3.14 Brief: Problem-First Landing Screen

**Status:** planned
**Depends on:** Slices 3.10-3.13, unless explicitly waived by the human owner
**Blocks:** Slice 4 and mode-specific UI work
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`
**Navigation protocol:** `docs/DOC_NAVIGATION.md`

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - prevents broad context loading.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules, stop conditions, and completion report.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - UI/accessibility, drift, reliability, and evidence gates.
4. `docs/SLICE_MAP.md` - confirms Slice 3.14 status and blockers.
5. `docs/PROBLEM_FIRST_LEARNING_JOURNEYS.md` - exact product, copy, layout, tile, and visual spec for this slice.
6. `docs/UX_ARCHITECTURE.md` - app shell, problem-first navigation, mobile, accessibility, motion rules.
7. `docs/COMPONENT_CONTRACTS.md` - component ownership for new launcher components.
8. `docs/NAMING.md` - file, prop, state, and callback naming rules.
9. `app/(auth)/login/page.tsx` - current authenticated redirect behavior.
10. `app/(app)/page.tsx` - current root authenticated redirect behavior.
11. `components/AppShell.tsx` - account/menu/header conventions to preserve.
12. `app/api/learning-state/route.ts` and `components/LearningStatePanel.tsx` - current learning state fields and compact-coach source.

Do not read:

- Prompt files. This slice does not change model behavior.
- Pipeline files. This slice does not route journey prompts yet.
- Prisma migrations. This slice does not change schema.
- Revision algorithm files. The review tile only links to existing revision UI.

---

## 1. Goal

Replace chat-first login with a problem-first landing screen. After login, the learner sees six high-gloss German/Hinglish problem tiles and chooses the task they need help with.

Exact heading:

```text
Hello [Name], welcome to Lernsaathi.
Which problem do you need assistance with?

Aapko kis task mein madad chahiye?
```

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files (section 2)**:

- `app/dashboard/page.tsx` (new)
- `components/ProblemLauncher.tsx` (new)
- `components/ProblemTile.tsx` (new)
- `components/CompactLearningCoach.tsx` (new)
- `app/(auth)/login/page.tsx` (redirect change only)
- `app/(app)/page.tsx` (authenticated redirect change only)
- `middleware.ts` (only if route protection/default needs it)
- `docs/SLICE_MAP.md` (status only)
- `docs/UX_ARCHITECTURE.md` (only if the problem-first rules are missing)
- `docs/COMPONENT_CONTRACTS.md` (only if component contracts are missing)

**Forbidden areas (section 3)**:

- `lib/pipeline/*` (STOP: no model routing in this slice)
- `prompts/*` (STOP: no prompt changes)
- `prisma/*` (STOP: no schema/migration changes)
- `app/api/chat/*` (STOP unless route navigation is impossible without a tiny compatibility change)
- `components/ChatShell.tsx` (STOP unless needed only to preserve existing direct `/chat` behavior)
- `components/RevisionQueue.tsx` and `lib/revision-data.ts` (STOP: review behavior unchanged)
- Real chat history sidebar/thread model (separate future slice)
- Message timestamps (separate future slice)

**Expected git diff**:

```text
A app/dashboard/page.tsx
A components/ProblemLauncher.tsx
A components/ProblemTile.tsx
A components/CompactLearningCoach.tsx
M app/(auth)/login/page.tsx
M app/(app)/page.tsx
M docs/SLICE_MAP.md
```

**Mandatory checks before committing**:

- [ ] Only allowed files modified?
- [ ] `/dashboard` exists and requires auth?
- [ ] Authenticated `/` redirects to `/dashboard`?
- [ ] Successful login redirects to `/dashboard`, not `/chat`?
- [ ] Heading text exactly matches section 1?
- [ ] Six tiles only: `WOERTER`, `LESEN`, `SCHREIBEN`, `GRAMMATIK`, `HOEREN`, `WIEDERHOLEN`?
- [ ] German label is the strongest visual signal on each tile?
- [ ] Hinglish line appears under each tile title?
- [ ] Free chat is not one of the six primary tiles?
- [ ] Compact learning coach is collapsed by default and target height is about `44px`?
- [ ] Tile grid is 3 columns desktop, 2 columns tablet, 1 column at 375px?
- [ ] Each clickable tile is keyboard reachable with visible focus?
- [ ] Tiles do not use fake disabled controls?
- [ ] Direct `/chat`, `/chat?tab=revision`, and `/chat?tab=mistakes` still work?
- [ ] `npm run typecheck` passes?
- [ ] `npm run lint` passes?
- [ ] `npm run build` passes?

**Stop conditions (section 13)**:

- More than 8 source files need changes.
- Implementing journeys requires model/pipeline changes.
- Implementing the coach requires a new API route.
- Dashboard cannot be implemented without schema changes.
- Existing chat/revision/mistake tabs break.

---

## 2. Allowed Scope

New route:

- `app/dashboard/page.tsx`

New components:

- `components/ProblemLauncher.tsx`
- `components/ProblemTile.tsx`
- `components/CompactLearningCoach.tsx`

Modified source:

- `app/(auth)/login/page.tsx` - change authenticated redirect and post-login callback from `/chat` to `/dashboard`.
- `app/(app)/page.tsx` - change authenticated root redirect from `/chat` to `/dashboard`.
- `middleware.ts` - only if current route protection forces `/chat`.

Docs:

- `docs/SLICE_MAP.md` for status.
- `docs/UX_ARCHITECTURE.md` and `docs/COMPONENT_CONTRACTS.md` only if the contracts are missing or stale.

---

## 3. Explicit Non-Goals

- Do not implement the full word/reading/writing/grammar/listening journeys.
- Do not implement chat history sidebar.
- Do not implement timestamps on messages.
- Do not add new database models.
- Do not add image/audio upload.
- Do not change prompt or model behavior.
- Do not remove `/chat`; direct URLs must keep working.
- Do not show seven generic learning-mode tiles.
- Do not use `Chat` as a primary tile.

---

## 4. Product Requirements

### 4.1 Page Copy

Use exact visible copy:

```text
Hello [Name], welcome to Lernsaathi.
Which problem do you need assistance with?

Aapko kis task mein madad chahiye?
```

Name source:

1. `session.user.name`
2. `session.user.email` before `@`
3. fallback `there`

Do not block the page if name is missing.

### 4.2 Tile Data

Use exactly six tiles in this order:

```ts
const problemTiles = [
  {
    id: "words",
    germanLabel: "WOERTER",
    englishLabel: "Words",
    hinglishLine: "Word ya phrase ka matlab samajhna",
    actionLabel: "Start meaning help",
    href: "/chat?mode=words",
    accentClassName: "bg-teal/70 dark:bg-tealLt2/60",
  },
  {
    id: "reading",
    germanLabel: "LESEN",
    englishLabel: "Reading",
    hinglishLine: "Letter, form, email ya notice padhna",
    actionLabel: "Start reading help",
    href: "/chat?mode=reading",
    accentClassName: "bg-sky-500/70 dark:bg-sky-300/60",
  },
  {
    id: "writing",
    germanLabel: "SCHREIBEN",
    englishLabel: "Writing",
    hinglishLine: "Message, email ya reply likhna",
    actionLabel: "Start writing help",
    href: "/chat?mode=writing",
    accentClassName: "bg-amber-500/75 dark:bg-amber-300/65",
  },
  {
    id: "grammar",
    germanLabel: "GRAMMATIK",
    englishLabel: "Grammar",
    hinglishLine: "Sentence ya grammar mistake theek karna",
    actionLabel: "Start grammar help",
    href: "/chat?mode=grammar",
    accentClassName: "bg-rose-500/65 dark:bg-rose-300/55",
  },
  {
    id: "listening",
    germanLabel: "HOEREN",
    englishLabel: "Listening",
    hinglishLine: "Jo suna hai uska matlab samajhna",
    actionLabel: "Start listening help",
    href: "/chat?mode=listening",
    accentClassName: "bg-indigo-500/65 dark:bg-indigo-300/55",
  },
  {
    id: "review",
    germanLabel: "WIEDERHOLEN",
    englishLabel: "Review",
    hinglishLine: "Apni mistakes revise karna",
    actionLabel: "Open revision queue",
    href: "/chat?tab=revision",
    accentClassName: "bg-emerald-500/70 dark:bg-emerald-300/60",
  },
];
```

If `/chat?mode=*` has no mode-specific behavior yet, it may open existing chat with an empty state in this slice. Do not fake a full custom journey in this slice.

### 4.3 Compact Learning Coach

The progress surface must not dominate the screen.

Default collapsed visible text:

```text
Practice status: [due] due - [active] active - [done] done today
```

Expanded purpose line:

```text
This tracks due reviews, active mistakes, and today's completed practice.
```

Implementation:

- Fetch existing `/api/learning-state`.
- Map fields:
  - `due = dueRevisions`
  - `active = activeMistakes`
  - `done = todayReviews`
- Default `isExpanded = false`.
- Toggle button has `aria-expanded={isExpanded}`.
- Toggle text: `Show details` and `Hide details`.
- Collapsed height target: `44px`.
- Expanded max height target: `132px`.
- Show retry button on fetch error.

---

## 5. Visual Specifications

Use the exact visual specification in `docs/PROBLEM_FIRST_LEARNING_JOURNEYS.md#4-visual-specification`.

Required values:

- Page max width: `960px`.
- Desktop padding: `px-6 py-8`.
- Mobile padding: `px-4 py-5`.
- Tile radius: `rounded-lg`.
- Tile min height: desktop `148px`, mobile `112px`.
- Grid: `grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-3.5`.
- German label: `serif text-[27px] leading-none`; mobile `text-[24px]`.
- Main question: desktop `serif text-[32px] leading-[1.12]`; mobile `text-[26px] leading-[1.15]`.

Do not add:

- Gradient-orb backgrounds.
- Decorative bokeh.
- Purple/blue gradient-dominant palette.
- SVG hero illustration.
- Nested cards inside cards.

---

## 6. Component Contracts

### `ProblemLauncher`

Owns:

- Page heading.
- Compact learning coach placement.
- Six-tile grid.

Props:

```ts
type ProblemLauncherProps = {
  displayName: string;
};
```

Must:

- Render the exact heading.
- Render `CompactLearningCoach` below heading and above tiles.
- Render exactly six `ProblemTile` instances.
- Keep first viewport focused on task choice, not progress.

Must not:

- Fetch chat history.
- Render old messages.
- Own auth logic.

### `ProblemTile`

Props:

```ts
type ProblemTileProps = {
  germanLabel: string;
  englishLabel: string;
  hinglishLine: string;
  actionLabel: string;
  href: string;
  accentClassName: string;
};
```

Must:

- Use a real `Link`.
- Make entire tile clickable.
- Provide visible hover and focus states.
- Use `aria-label={`${germanLabel}: ${englishLabel}. ${hinglishLine}`}`.

Must not:

- Use disabled fake controls.
- Require hover to understand clickability.

### `CompactLearningCoach`

Owns:

- Fetching `/api/learning-state`.
- Collapsed/expanded state.
- Loading/error/empty display.
- Refresh/retry action.

Must:

- Be collapsed by default.
- Keep collapsed height near `44px`.
- Explain purpose only when expanded.
- Use `aria-live="polite"` for count updates.

Must not:

- Become a large dashboard card.
- Trigger navigation except optional link to revision from the expanded state.

---

## 7. API/Data Contract

- Routes touched: none.
- Existing API used: `GET /api/learning-state`.
- Request schema: unchanged.
- Response schema expected:

```ts
type LearningState = {
  dueRevisions: number;
  activeMistakes: number;
  todayReviews: number;
  timestamp: string;
};
```

- Database models touched: none.
- Idempotency behavior: unchanged.
- Rate limit behavior: unchanged.
- Logging behavior: unchanged.

---

## 8. UX States

| State | Expected Behavior |
|---|---|
| Happy path | Authenticated user lands on `/dashboard`, sees heading, compact coach, and six tiles. |
| Loading coach | Coach shows one-row skeleton with target height near `44px`. |
| Empty coach | Coach says `Practice status: 0 due - 0 active - 0 done today`. |
| Coach error | Coach says `Practice status unavailable` and has keyboard-reachable `Retry`. |
| Disabled | No disabled primary tiles in this slice. |
| Success | Clicking a tile navigates to its `href`. |

---

## 9. Accessibility And Mobile

Required:

- Each tile is reachable by Tab.
- Enter activates each tile because it is a real link.
- Focus ring visible on each tile.
- Heading is one `h1`.
- Tile grid has no horizontal scroll at 375px.
- Tile text does not wrap outside the tile at 375px.
- Compact coach toggle has `aria-expanded`.
- Coach count update uses `aria-live="polite"`.
- Icons, if used, are decorative with `aria-hidden="true"`.
- Reduced motion respected by existing `.active-press` and transition usage.

Manual checks:

- 375px mobile light theme.
- 375px mobile dark theme.
- Desktop 1024px light theme.
- Desktop 1440px dark theme.
- Keyboard-only: login -> dashboard -> Tab through six tiles -> Enter opens first tile.

---

## 10. Implementation Steps

1. Confirm worktree status. If unexpected changes touch allowed files, stop.
2. Add `components/ProblemTile.tsx` with exact props and tile style.
3. Add `components/CompactLearningCoach.tsx` using `/api/learning-state`.
4. Add `components/ProblemLauncher.tsx` with exact heading and six-tile data.
5. Add `app/dashboard/page.tsx` as an authenticated server route.
6. Update `app/(auth)/login/page.tsx` so successful sign-in defaults to `/dashboard`.
7. Update `app/(app)/page.tsx` so authenticated root redirects to `/dashboard`.
8. Verify direct `/chat` still works.
9. Run validation.
10. Update `docs/SLICE_MAP.md` status and completion notes.

---

## 11. Validation

Run:

```bash
npm run typecheck
npm run lint
npm run build
npm run validate:slice docs/slices/SLICE_3_14_BRIEF.md
```

Manual:

- Login -> dashboard.
- `/` while logged in -> dashboard.
- `/chat` direct still works.
- Six tiles visible and clickable.
- Compact coach collapsed by default.
- Compact coach expands and collapses.
- 375px mobile layout.
- Dark mode layout.
- Keyboard-only tile navigation.

---

## 12. Accountability Gates

- Changed-files audit: required.
- Security gate: auth redirect only; no new auth policy.
- Privacy/data gate: no new stored data.
- AI/model gate: not applicable.
- UI/accessibility gate: required.
- Reliability/deployment gate: build must pass.
- Debt opened: only if manual evidence cannot be completed.
- Rollback path: revert route redirect changes and remove `/dashboard` route/components.

---

## 13. Stop Conditions

Stop if:

- A custom journey requires prompt/pipeline changes.
- Fetching learning state needs a new backend route.
- Any source file outside the allowed scope becomes necessary.
- Tile click behavior needs fake disabled controls.
- Existing chat/revision/mistake tabs break.
- Manual validation cannot be performed; mark `manual evidence pending` instead of claiming complete.

---

## 14. Completion Report Format

```markdown
Changed:
- `app/dashboard/page.tsx`: [summary]
- `components/ProblemLauncher.tsx`: [summary]
- `components/ProblemTile.tsx`: [summary]
- `components/CompactLearningCoach.tsx`: [summary]
- `app/(auth)/login/page.tsx`: [summary]
- `app/(app)/page.tsx`: [summary]

Validation:
- `npm run typecheck`: pass/fail
- `npm run lint`: pass/fail
- `npm run build`: pass/fail
- `npm run validate:slice docs/slices/SLICE_3_14_BRIEF.md`: pass/fail

Manual:
- Login redirects to dashboard: pass/fail
- Six tiles visible: pass/fail
- Compact coach collapsed by default: pass/fail
- Tile keyboard navigation: pass/fail
- 375px layout: pass/fail
- Dark mode: pass/fail
- Direct `/chat` still works: pass/fail

Accountability:
- Changed-files audit: pass/fail
- Drift report needed: yes/no
- Debt opened: [ids or none]
- Debt closed: [ids or none]
- Waivers: [ids or none]
- Security gate: pass/fail/not applicable
- Privacy gate: pass/fail/not applicable
- AI/model gate: pass/fail/not applicable
- Manual evidence: complete/pending/not applicable
```
