# AI-Assisted Development: Lessons Learned

**Project:** Lernsaathi (German learning app)
**Duration:** 2026-05-08 to 2026-05-10
**Context:** Solo developer learning through AI pair-programming
**AI Tools Used:** Claude Code (Sonnet 4.5), Codex
**Purpose:** Extract transferable patterns for sustainable AI-assisted development

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Project Structure Patterns](#project-structure-patterns)
3. [AI Collaboration Protocols](#ai-collaboration-protocols)
4. [Learning Environment Design](#learning-environment-design)
5. [Quality Gates & Accountability](#quality-gates--accountability)
6. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
7. [Sustainability Practices](#sustainability-practices)
8. [Knowledge Transfer Mechanisms](#knowledge-transfer-mechanisms)
9. [Metrics That Matter](#metrics-that-matter)
10. [Applying to New Projects](#applying-to-new-projects)

---

## Core Philosophy

### The Developer Must Learn, Not Just Ship

**Problem:** AI can write code faster than you can learn from it.

**Solution:** Design your development process to force learning:

```markdown
Every feature must include:
1. Implementation (AI can help heavily)
2. Manual testing (you must understand what it does)
3. Completion report (you must articulate what changed)
4. Evidence recording (you must verify it works)
```

**Key Insight:** If you can't explain what the AI built, you haven't learned. You've just accumulated technical debt disguised as features.

### Slice-Based Development Over Big Chunks

**Pattern:**
- Break work into 30min - 6 hour slices
- Each slice has clear entry/exit criteria
- Each slice is independently testable
- Each slice teaches one concept

**Why it works:**
- Prevents overwhelm
- Creates natural learning checkpoints
- Allows context switching without losing progress
- Builds confidence incrementally

### Documentation is Your Second Brain

**Reality:** You will forget. AI will hallucinate. Code will drift.

**Defense:**
```
docs/
├── ARCHITECTURE.md          # Why things are structured this way
├── SLICE_MAP.md             # What's done, what's next, why
├── [FEATURE]_NOTES.md       # Implementation evidence
├── slices/                  # Detailed implementation briefs
└── gates/                   # Quality standards
```

**Rule:** If it's not documented, it didn't happen. If it's not in a completion report, you didn't verify it.

---

## Project Structure Patterns

### 1. Explicit Context Routing

**Problem:** AI loads irrelevant docs, wastes tokens, loses focus.

**Solution:** `docs/DOC_NAVIGATION.md`

```markdown
# Doc Navigation Protocol

## For UI tasks:
Read:
1. UX_ARCHITECTURE.md
2. COMPONENT_CONTRACTS.md
3. Relevant component file

Do NOT read:
- Pipeline files
- Database schema (unless changing it)
- Retrospective docs
```

**Benefits:**
- Reduces context from 14 docs → 3-5 docs
- AI focuses on what matters
- Faster responses, better quality

### 2. Slice Briefs, Not Vague Prompts

**Bad prompt:**
> "Add user authentication"

**Good brief:** `docs/slices/SLICE_3_5_AUTH_SESSION_NOTES.md`

```markdown
## Goal
Google OAuth with email allowlist. Preserve existing user data.

## Allowed Files
- lib/auth.ts
- app/(auth)/login/page.tsx
- components/LoginForm.tsx

## Forbidden
- Database schema (fields already exist)
- Pipeline files (auth is orthogonal)

## Acceptance Criteria
- [ ] Allowlisted email can login
- [ ] Non-allowlisted email rejected
- [ ] Existing user data preserved
```

**Why:**
- Reduces ambiguity → fewer retry loops
- Explicit constraints → prevents scope creep
- Clear success criteria → you know when done

### 3. Constraint Cards (Pre-Computed Checklists)

**Innovation from this project:**

Add section 1.5 to every slice brief:

```markdown
## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files:**
- path/to/file1.ts
- path/to/file2.tsx

**Forbidden:**
- Database migrations (STOP if schema change needed)
- Pipeline files (STOP if learning logic touched)

**Expected git diff:**
```
M path/to/file1.ts
A new/file.ts
```

**Mandatory checks:**
- [ ] Only allowed files modified?
- [ ] Typecheck passes?
- [ ] Manual test X works?

**Stop conditions:**
- Database schema change needed
- More than 5 files changed
```

**Impact:** +20-35% success rate for lower-reasoning AI models

### 4. Gate Files (Stable Quality Standards)

**Problem:** AI re-reads same quality rules from different docs.

**Solution:** Extract to `docs/gates/`

```
gates/
├── DEFINITION_OF_DONE.md       # Universal completion checklist
├── TECH_DEBT_REGISTER.md       # Known issues, priorities
├── SLICE_4_ENTRY_CRITERIA.md   # Blockers for next phase
└── API_VALIDATION_WHY.md       # Rationale for standards
```

**Why:**
- Stable references (section numbers don't break)
- Single source of truth
- Easy to update globally

---

## AI Collaboration Protocols

### 1. TodoWrite Tool Pattern

**Use AI's task management to track YOUR understanding:**

```typescript
TodoWrite([
  { content: "Read authentication docs", status: "in_progress" },
  { content: "Implement OAuth flow", status: "pending" },
  { content: "Test allowlist logic", status: "pending" },
  { content: "Write completion report", status: "pending" }
])
```

**Benefits:**
- Visible progress tracking
- Prevents AI from forgetting steps
- Forces you to understand the plan
- Creates audit trail

### 2. Completion Report Discipline

**After EVERY feature:**

```markdown
## Completion Report

### Changed:
- file1.ts: Added OAuth provider config
- file2.tsx: Updated login form for Google button

### Validation:
- npm run typecheck: PASS
- npm run build: PASS

### Manual Testing:
- Google login with allowed email: PASS
- Google login with blocked email: PASS
- Existing credentials still work: PASS

### Findings:
- session.user.email is null for credentials login
- This is expected, fallback to username works
```

**Why:**
- Forces you to test
- Documents what actually works
- Creates evidence for future debugging
- Proves you understood the change

### 3. Stop Conditions (Know When to Ask)

**Teach AI when to stop and ask:**

```markdown
## Stop Conditions

Stop and ask if:
- Database schema migration needed
- More than 8 files need changes
- Existing feature breaks
- Pipeline logic needs modification
```

**Why:**
- Prevents runaway changes
- Catches scope creep early
- Forces architectural discussions
- Protects working code

### 4. Phased Work (Respect AI Limits)

**Bad:** "Implement dashboard with 7 modes, quiz system, and mode UIs"

**Good:**
```markdown
Phase 1 (This session - 45 min):
1. Update SLICE_MAP.md
2. Create SLICE_3_9_2 brief
3. Create SLICE_3_14 brief
4. Update UX_ARCHITECTURE.md

Phase 2 (Next session - 1 hour):
5. Create SLICE_3_15 brief
6. Create mode UI briefs
7. Update COMPONENT_CONTRACTS.md
```

**Why:**
- Respects attention limits (yours AND AI's)
- Clear stopping points
- Can validate between phases
- Prevents context overflow

---

## Learning Environment Design

### 1. Learning Modes vs. Shipping Modes

**Shipping mode:**
- AI writes code
- You approve
- Move to next feature

**Learning mode (BETTER for juniors):**
```markdown
1. AI explains approach (you understand BEFORE code)
2. AI implements (you watch the pattern)
3. You test manually (you verify behavior)
4. You write completion report (you articulate learning)
5. You explain it back (Feynman technique)
```

**Pattern to enforce learning:**

```markdown
## Mandatory Evidence

Before marking slice complete:
1. Record manual test results
2. Document at least one thing you learned
3. Note one question for future research
4. Update your mental model of the architecture
```

### 2. Deliberate Practice Checkpoints

**After every 3-5 slices:**

```markdown
## Retrospective Questions

1. What pattern appeared multiple times?
2. What confused me most?
3. What would I do differently next time?
4. What should be extracted to shared docs?
5. What technical debt did we create?
```

**Capture in:** `docs/RETROSPECTIVE_NOTES.md`

### 3. Progressive Disclosure (Don't Boil the Ocean)

**Start simple:**
```
Week 1: Chat-only app (learn React, Next.js, API routes)
Week 2: Add database (learn Prisma, migrations)
Week 3: Add auth (learn NextAuth, sessions)
Week 4: Add complex features (build on foundation)
```

**Anti-pattern:**
- Trying to learn React + Next.js + Prisma + Auth + AI + Deployment in one week
- Results in: shallow understanding, fragile code, burnout

### 4. Pair with Intention (Human-AI Collaboration)

**Good pairing:**
```
You: "I need authentication. I want to learn OAuth flow."

AI: "Let me explain OAuth first:
     1. User clicks 'Login with Google'
     2. App redirects to Google
     3. User approves
     4. Google redirects back with code
     5. App exchanges code for token

     Should I implement this pattern?"

You: [Reviews explanation, asks clarifying questions]

AI: [Implements after you understand]
```

**Bad pairing:**
```
You: "Add auth"
AI: [Writes 500 lines of OAuth code]
You: "Thanks!" [Merges without understanding]
```

**Result:** You shipped code you can't maintain.

---

## Quality Gates & Accountability

### 1. Definition of Done (Non-Negotiable)

**Every slice must:**
```markdown
- [ ] Typecheck passes
- [ ] Build succeeds
- [ ] Manual testing completed
- [ ] Completion report written
- [ ] No console errors in browser
- [ ] Acceptance criteria met
- [ ] Known limitations documented
```

**NO exceptions.** If you skip gates, you're accumulating debt.

### 2. Technical Debt Register

**Track explicitly:** `docs/gates/TECH_DEBT_REGISTER.md`

```markdown
| ID | Issue | Priority | Created | Plan |
|----|-------|----------|---------|------|
| D001 | Rate limiting in-memory | P0 | 2026-05-09 | Move to Redis before production |
| D002 | No API validation | P0 | 2026-05-09 | Add Zod schemas in Slice 3.12 |
| D003 | Auth UX incomplete | P1 | 2026-05-09 | Complete in Slice 3.5.1 |
```

**Why:**
- Makes invisible debt visible
- Prevents "we'll fix it later" from becoming never
- Prioritizes what matters
- Creates accountability

### 3. Evidence-Based Completion

**Don't trust "it works on my machine"**

```markdown
## Evidence

### Automated:
- Typecheck: PASS (screenshot or logs)
- Build: PASS (build output saved)
- Tests: PASS (test report)

### Manual:
- [ ] Login with Google (allowed email): PASS
- [ ] Login with Google (blocked email): PASS
- [ ] Login with credentials: PASS
- [ ] Mobile 375px width: PASS
- [ ] Dark mode: PASS

### Database:
- User record created: ✓ (screenshot of DB query)
- LearnerProfile exists: ✓
- ExamReadinessMap exists: ✓
```

**Rule:** If you didn't test it, it doesn't work.

### 4. Constraint Validation (Automated)

**Use tooling:**

```bash
npm run validate:slice docs/slices/SLICE_3_14_BRIEF.md
```

**Checks:**
- Only allowed files modified?
- Forbidden patterns avoided?
- Git diff matches expectations?

**Why:**
- Catches drift early
- Enforces discipline
- Prevents accidental changes
- Machine doesn't forget

---

## Common Pitfalls & Solutions

### Pitfall 1: "AI will handle it"

**Problem:** Defer all decisions to AI.

**Symptom:**
- Don't understand architecture
- Can't debug when things break
- Can't make design decisions
- Dependency on AI for trivial changes

**Solution:**
```markdown
## AI Decision Rights

AI CAN decide:
- Variable names
- Code formatting
- Implementation details (within constraints)
- Error messages (within style guide)

YOU decide:
- Architecture (monolith vs microservices)
- Database schema
- API contracts
- UX flows
- Security model
- What to build next
```

### Pitfall 2: "Just one more feature"

**Problem:** Scope creep within a slice.

**Symptom:**
```
Goal: Add login
Reality: Login + registration + password reset +
         email verification + 2FA + OAuth for 5 providers
```

**Solution:** Slice discipline

```markdown
## Slice 3.5: Auth Foundation
ONLY: Google OAuth with allowlist

## Slice 3.5.1: Auth UX
ONLY: Account visibility, login method display

## Slice 3.5.2: Registration
ONLY: Email/password registration

Explicit non-goals: Password reset, magic links, 2FA
(Add to roadmap, don't scope creep)
```

### Pitfall 3: "Documentation can wait"

**Problem:** Ship first, document later.

**Reality:** Later never comes.

**Solution:** Documentation IS the feature.

```markdown
## Acceptance Criteria

- [ ] Code written
- [ ] Tests pass
- [ ] Completion report written  ← REQUIRED
- [ ] Architecture updated       ← REQUIRED
- [ ] Slice notes updated        ← REQUIRED
```

**Rule:** Feature not done until documented.

### Pitfall 4: "AI knows best"

**Problem:** Accept all AI suggestions uncritically.

**Example:**
```typescript
// AI suggests:
const users = await prisma.user.findMany({
  include: {
    profile: true,
    events: true,      // ⚠️ Could be 10,000 rows
    mistakes: true,    // ⚠️ Could be 5,000 rows
  }
})
```

**You should ask:**
- "Do I need ALL events? Or just recent?"
- "Will this scale?"
- "Is there a better query pattern?"

**Solution:** Healthy skepticism

```markdown
## AI Suggestion Review Checklist

- [ ] Does this scale?
- [ ] Are we over-fetching data?
- [ ] Is there a simpler approach?
- [ ] Does this match our architecture?
- [ ] Are there security implications?
- [ ] Can I explain this code to someone else?
```

### Pitfall 5: "No time for manual testing"

**Problem:** Trust automated checks only.

**Reality:** Automated tests test what you told them to test. They don't catch:
- UX issues (button too small, text truncated)
- Accessibility problems (can't tab to button)
- Mobile layout breaks
- Dark mode color contrast
- Real user flows

**Solution:** Mandatory manual testing

```markdown
## Manual Test Matrix

| Test | Chrome | Mobile | Dark Mode | Keyboard | Status |
|------|--------|--------|-----------|----------|--------|
| Login flow | ✓ | ✓ | ✓ | ✓ | PASS |
| Registration | ✓ | pending | pending | pending | IN PROGRESS |
```

**Rule:** Manual test BEFORE marking done.

---

## Sustainability Practices

### 1. Energy Management (Not Time Management)

**Reality:** You can't code 8 hours straight with AI.

**Sustainable rhythm:**
```
Session 1 (90 min): Implement feature
Break (30 min): Walk, coffee, NOT screens
Session 2 (60 min): Manual test, document
Break (30 min): Physical break
Session 3 (45 min): Review, commit, plan next
```

**Why:**
- AI pair programming is mentally intense
- Context switching is exhausting
- Break before burnout
- Better decisions when fresh

### 2. Complexity Budget

**Track complexity debt:**

```markdown
## Complexity Score

Calculate after each slice:
- New files created: +1 each
- New dependencies: +2 each
- New abstractions: +3 each
- Breaking changes: +5 each

Budget per slice: ≤15 points

Current: 8 points (3 files, 1 dependency, 1 abstraction)
Status: ✓ Within budget
```

**Why:**
- Prevents feature bloat
- Forces simplification
- Signals when to refactor
- Maintains long-term velocity

### 3. Knowledge Half-Life

**Problem:** You forget fast. AI remembers nothing between sessions.

**Solution:** Assume 50% knowledge loss per week

```markdown
## Session Start Checklist

1. Read SLICE_MAP.md (5 min) - What's done?
2. Read last completion report (3 min) - Where were we?
3. Review git log (2 min) - What changed?
4. Check TECH_DEBT_REGISTER (2 min) - What's broken?

Total: 12 minutes to reload context
```

**Better than:** 45 minutes trying to remember what you built.

### 4. Progressive Difficulty

**Start easy, build confidence:**

```markdown
Week 1-2: Tutorial-guided (high AI help)
Week 3-4: Slice-guided (medium AI help)
Week 5-6: Architecture-guided (low AI help, high autonomy)
Week 7+: Self-directed (AI as consultant)
```

**Anti-pattern:** Jump to hard problems immediately → frustration → quit

---

## Knowledge Transfer Mechanisms

### 1. Completion Reports as Learning Artifacts

**Every report teaches:**

```markdown
## What I Learned

Technical:
- OAuth flow requires provider callback URL
- Session tokens stored in JWT, not database
- Email lookup needs case-insensitive search

Patterns:
- Server components fetch data directly (no API route)
- Client components handle interactivity
- Shared types enforce contracts

Gotchas:
- Prisma generates types AFTER schema change
- NextAuth signIn() doesn't throw on failure
- Environment variables need explicit typing
```

**Result:** Searchable knowledge base.

### 2. Slice Briefs as Teaching Materials

**Reuse briefs for new developers:**

```markdown
## Onboarding Path

Day 1: Read + implement SLICE_1_BRIEF (word lookup)
Day 2: Read + implement SLICE_2_BRIEF (grammar check)
Day 3: Read + implement SLICE_3_BRIEF (mistake memory)

Each slice:
- Takes 2-4 hours
- Teaches one concept
- Builds on previous
- Has clear success criteria
```

**Why:**
- Structured learning path
- Proven to work (you did it)
- Self-paced
- Verifiable progress

### 3. Architecture Decision Records (ADRs)

**Template:**

```markdown
# ADR-005: Use JWT sessions, not database sessions

## Context
Need to track logged-in users. Two options:
1. Store sessions in database
2. Store sessions in signed JWT tokens

## Decision
Use JWT strategy for sessions.

## Rationale
- Simpler: No session table needed
- Stateless: Scales horizontally easily
- Fast: No database lookup per request

## Consequences
Positive:
- Easier deployment (no session cleanup job)
- Better performance

Negative:
- Can't revoke sessions immediately (wait for token expiry)
- Slightly larger cookie size

## Mitigations
- Short expiry (7 days) limits stale session risk
- Can add token blacklist later if needed

## Date
2026-05-09

## Status
Accepted, implemented in Slice 3.5
```

**Why:**
- Future you will forget why
- New developers will ask why
- Prevents re-litigating decisions
- Documents tradeoffs

### 4. Mental Model Diagrams

**Draw your understanding:**

```
User Flow:
┌─────────┐   login   ┌──────────┐   callback   ┌─────────┐
│ Browser ├──────────>│  Google  ├─────────────>│ Our App │
└─────────┘           └──────────┘              └─────────┘
                                                      │
                                                      v
                                                 ┌──────────┐
                                                 │ Database │
                                                 └──────────┘

Our app:
1. Redirects to Google
2. Receives auth code
3. Exchanges for user info
4. Creates/updates User record
5. Issues session JWT
6. Redirects to /chat
```

**Put in:** `docs/ARCHITECTURE.md` or completion reports

**Why:**
- Visual learning sticky
- Easier to spot gaps
- Shareable with team
- Debugging aid

---

## Metrics That Matter

### Leading Indicators (Predict Success)

```markdown
## Weekly Health Check

1. Documentation Current?
   - [ ] SLICE_MAP.md updated this week
   - [ ] Completion reports written for all features
   - [ ] TECH_DEBT_REGISTER reviewed

2. Learning Happening?
   - [ ] Can explain last 3 features without looking at code
   - [ ] Added at least 3 entries to "What I Learned"
   - [ ] Taught someone else (or wrote about) a concept

3. Quality Maintained?
   - [ ] All automated checks passing
   - [ ] Manual testing done for all features
   - [ ] No P0 debt older than 2 weeks

4. Sustainable Pace?
   - [ ] No >6 hour coding sessions
   - [ ] Taking breaks between features
   - [ ] Not dreading opening the codebase
```

**Green flags:** All checked
**Yellow flags:** 1-2 unchecked
**Red flags:** 3+ unchecked → stop and reflect

### Lagging Indicators (Measure Results)

```markdown
## Monthly Review

Velocity:
- Slices completed: 12
- Average time per slice: 3.5 hours
- Rollbacks: 1 (good - caught issues)

Quality:
- Production bugs: 0
- Technical debt items: 8 total (3 resolved, 5 open)
- Test coverage: 45% (target: 60%)

Learning:
- New concepts learned: 7
- Concepts I can teach: 5
- Concepts still fuzzy: 2

Sustainability:
- Burnout score (1-10): 3 (good)
- Weeks feeling productive: 4/4
- Weeks felt overwhelmed: 0/4
```

### Vanity Metrics (Ignore These)

❌ Lines of code written
❌ Features shipped (without quality gates)
❌ Hours coded (high hours often means inefficient)
❌ Complexity (more is not better)

---

## Applying to New Projects

### Checklist: Starting a New AI-Assisted Project

#### 1. Foundation (Week 1)

```markdown
- [ ] Create docs/ structure:
  - [ ] ARCHITECTURE.md
  - [ ] SLICE_MAP.md
  - [ ] DOC_NAVIGATION.md
  - [ ] LOW_REASONING_DEV_PROTOCOL.md

- [ ] Define slice template:
  - [ ] Copy SLICE_TEMPLATE.md
  - [ ] Customize constraint card
  - [ ] Define your quality gates

- [ ] Set up validation:
  - [ ] npm run typecheck
  - [ ] npm run lint
  - [ ] npm run test
  - [ ] npm run validate:slice (if using constraint validation)

- [ ] Establish learning routine:
  - [ ] Completion report template
  - [ ] Manual testing checklist
  - [ ] Weekly retrospective schedule
```

#### 2. First Slice (Prove the Pattern)

```markdown
Goal: Build simplest possible feature end-to-end

Example for web app:
- SLICE_0: "Hello World" with:
  - One route
  - One component
  - One test
  - Full documentation

Success criteria:
- [ ] Completed in <2 hours
- [ ] All gates passed
- [ ] Completion report written
- [ ] You understand EVERY line

Why: Proves your setup works before complexity.
```

#### 3. Incremental Complexity (Weeks 2-4)

```markdown
SLICE_1: Add database (learn Prisma/ORM)
SLICE_2: Add auth (learn sessions)
SLICE_3: Add first real feature
SLICE_4: Add second feature (pattern should emerge)

After each:
- [ ] Update ARCHITECTURE.md
- [ ] Update SLICE_MAP.md
- [ ] Write completion report
- [ ] Manual test
- [ ] Reflect: What pattern emerged?
```

#### 4. Templates to Copy

**From this project:**

1. `docs/DOC_NAVIGATION.md` - Adapt for your stack
2. `docs/slices/SLICE_TEMPLATE.md` - Use as-is
3. `docs/gates/DEFINITION_OF_DONE.md` - Customize checks
4. `docs/SLICE_MAP.md` - Start with your first 5 slices
5. `scripts/validate-constraints.mjs` - Adapt for your needs

**Minimal viable setup:**
```
your-project/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SLICE_MAP.md
│   ├── DOC_NAVIGATION.md
│   └── slices/
│       ├── SLICE_TEMPLATE.md
│       └── SLICE_1_BRIEF.md
└── [your code]
```

---

## Meta-Learning: What This Project Taught

### About AI Pair Programming

**Surprising truths:**
1. AI is EXCELLENT at: boilerplate, patterns, error handling, edge cases
2. AI is POOR at: architecture, prioritization, "what should we build?"
3. YOU must: decide direction, verify quality, understand deeply
4. AI excels: within constraints, with examples, at execution

**Optimal division of labor:**
```
You (human):
- Define the problem
- Set constraints
- Design architecture
- Prioritize work
- Verify quality
- Learn patterns

AI (assistant):
- Generate code within constraints
- Handle boilerplate
- Suggest edge cases
- Find bugs
- Explain concepts
- Accelerate execution
```

### About Learning Through Building

**Key insight:** Shipping code ≠ Learning code

**Better equation:**
```
Real Learning =
  Understanding (30%) +
  Implementation (20%) +
  Testing (20%) +
  Debugging (20%) +
  Teaching Others (10%)
```

**This project's secret:**
- Forced manual testing → understand behavior
- Required completion reports → articulate learning
- Used slice briefs → structured complexity
- Maintained documentation → teach future self

**Result:** Can maintain code 6 months later.

### About Sustainable Solo Development

**Burnout formula:**
```
Burnout Risk =
  Complexity / Understanding +
  Hours / Energy +
  Bugs / Fixes +
  Pressure / Support
```

**This project's approach:**
- Slices capped complexity per session
- Breaks preserved energy
- Quality gates caught bugs early
- Documentation provided support (past self helps future self)

**Result:** Productive for months, not weeks.

---

## Final Thoughts

### For Junior Developers

**You are not behind.**

Every senior developer once struggled with:
- How to structure a project
- When to use which pattern
- How to work with AI effectively
- Imposter syndrome

**This documentation approach:**
- Proves you're thinking deeply
- Creates artifacts showing growth
- Builds confidence through evidence
- Makes you hireable (show the docs!)

### For Senior Developers

**AI doesn't replace your expertise. It multiplies it.**

Your value:
- Architecture decisions (AI can't do this)
- Quality standards (AI needs your definition)
- Teaching others (AI can't build team culture)
- Strategic direction (AI optimizes, doesn't invent)

**Use AI to:**
- Free yourself from boilerplate
- Explore more options faster
- Delegate implementation details
- Focus on high-leverage decisions

### For Everyone

**The goal isn't to build fast. It's to build sustainably.**

```markdown
Fast but unsustainable:
- 60-hour weeks
- No documentation
- Ship and forget
- Burnout in 3 months

Sustainable:
- 4-hour focused sessions
- Document as you go
- Learn deeply
- Productive for years
```

**Choose sustainability.**

---

## Quick Reference Card

Print this and keep by your desk:

```
┌─────────────────────────────────────────────┐
│ AI-ASSISTED DEVELOPMENT CHECKLIST          │
├─────────────────────────────────────────────┤
│ Before Starting Session:                    │
│ □ Read SLICE_MAP.md (5 min)                │
│ □ Review last completion report (3 min)    │
│ □ Check TECH_DEBT_REGISTER (2 min)        │
│                                             │
│ During Implementation:                      │
│ □ TodoWrite for task tracking              │
│ □ Only modify allowed files                │
│ □ Stop if violating constraints            │
│ □ Test as you go                           │
│                                             │
│ Before Committing:                          │
│ □ npm run typecheck → PASS                │
│ □ npm run build → PASS                    │
│ □ Manual testing → DONE                    │
│ □ Completion report → WRITTEN              │
│                                             │
│ After Completing:                           │
│ □ Update SLICE_MAP.md                      │
│ □ Update ARCHITECTURE.md if needed         │
│ □ Record one thing learned                 │
│ □ Note any new tech debt                   │
│                                             │
│ Weekly:                                     │
│ □ Review health metrics                    │
│ □ Retrospective (30 min)                   │
│ □ Plan next 3 slices                       │
│                                             │
│ Monthly:                                    │
│ □ Measure learning (can I teach it?)       │
│ □ Triage tech debt                         │
│ □ Adjust pace if needed                    │
└─────────────────────────────────────────────┘
```

---

## License to Adapt

**This document is yours to modify.**

Encouraged adaptations:
- Change slice sizes for your pace
- Add/remove quality gates for your context
- Adjust documentation structure for your project
- Simplify if starting out
- Complexify as you grow

**One rule: Keep the learning focus.**

If your process doesn't force learning, you're building technical debt, not skills.

---

**Last Updated:** 2026-05-10
**Project:** Lernsaathi
**Maintainer:** Khalid
**AI Partner:** Claude Code (Sonnet 4.5)

---

*These lessons were hard-won through doing. Your mileage may vary. Adapt, don't adopt.*
