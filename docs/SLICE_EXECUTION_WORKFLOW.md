# Slice Execution Workflow

**Quick reference guide for executing slices with constraint validation and evidence collection.**

---

## Overview

This workflow uses standalone scripts for:
1. **Constraint validation** - Automatically check git changes against slice briefs
2. **Evidence collection** - Track manual validation matrix progress

**No MCP setup required** - these tools work standalone and can be used by both AI agents and humans.

---

## 1. Before Starting a Slice

### Read the Constraint Card

Every slice brief has a section 1.5 "⚠️ CONSTRAINT CARD" that contains:

- **Allowed files** - Only these files should be modified
- **Forbidden areas** - Don't touch these files/patterns
- **Expected git diff** - What changes should appear
- **Mandatory checks** - Pre-commit checklist
- **Stop conditions** - When to abort the slice

**Example from SLICE_3_10:**

```markdown
## 1.5. ⚠️ CONSTRAINT CARD

**Allowed files**:
- `app/loading.tsx` (new)
- `app/error.tsx` (new)
- `app/not-found.tsx` (new)
- `app/layout.tsx`
- `middleware.ts`

**Forbidden areas**:
- Do NOT modify API routes
- Do NOT change database schema
- Do NOT modify authentication logic

**Expected git diff**:
```
A app/loading.tsx
A app/error.tsx
A app/not-found.tsx
M app/layout.tsx
M middleware.ts
```

**Mandatory checks**:
- [ ] All routes have loading states?
- [ ] All routes have error boundaries?
- [ ] 404 page exists?
- [ ] Route boundaries tested manually?
- [ ] No forbidden files modified?
```

---

## 2. During Implementation

### Check Progress Frequently

Run constraint validation at any time:

```bash
# Using npm script (recommended)
npm run validate:slice docs/slices/SLICE_3_10_BRIEF.md

# Or directly
node scripts/validate-constraints.mjs docs/slices/SLICE_3_10_BRIEF.md
```

**Output example:**

```
📋 Constraint Card Validation

Brief: docs/slices/SLICE_3_10_BRIEF.md

Current changes:
  A app/loading.tsx
  A app/error.tsx
  M app/layout.tsx

⚠️  WARNINGS (REVIEW):
  ⚠️  MISSING: Expected change to app/not-found.tsx
  ⚠️  MISSING: Expected change to middleware.ts

⚠️  Warnings present. Review before committing.
```

### Interpreting Results

**✅ All checks passed** - No violations or warnings, proceed to commit

**⚠️ Warnings** - Unexpected files or missing expected files
- Review warnings
- If intentional changes, document in commit message
- Warnings don't block commits (by design)

**❌ Violations** - Forbidden file modified
- **STOP IMMEDIATELY**
- Revert forbidden changes
- Check if slice scope needs adjustment
- Violations indicate scope creep or misunderstanding

---

## 3. Manual Validation (UI/Accessibility Slices)

Some slices require manual validation matrices (e.g., Slice 3.13).

### Initialize Evidence Collection

```bash
npm run evidence:init docs/slices/SLICE_3_13_BRIEF.md
```

This creates `.evidence-matrix.json` (gitignored).

### Mark Test Results

As you test each flow/browser combination:

```bash
# Pass
npm run evidence:mark login chrome pass

# Fail with note
npm run evidence:mark chat keyboard fail "Submit button not reachable via Tab"

# Pending (placeholder)
npm run evidence:mark revision ios pending

# Skip (not applicable)
npm run evidence:mark logout screenReader skip
```

### Check Progress

```bash
npm run evidence:status
```

**Output:**

```
📊 Evidence Collection Status

Slice: docs/slices/SLICE_3_13_BRIEF.md
Started: 10/05/2026, 00:10:53

login:
  ✅ chrome: pass
  ✅ safari: pass
  ⏳ ios: pending
  ⬜ android: not tested
  ✅ keyboard: pass
  ⬜ screenReader: not tested

Summary:
  Total cells: 30
  Completed: 15/30 (50%)
  Pass rate: 14/15 (93%)
  Failures: 1

⚠️  Evidence collection incomplete
```

### Generate Evidence Report

```bash
npm run evidence:report > docs/releases/SLICE_3_13_EVIDENCE.md
```

---

## 4. Before Committing

### Run Final Checks

```bash
# 1. Constraint validation
npm run validate:slice docs/slices/SLICE_X_BRIEF.md

# 2. Type check
npm run typecheck

# 3. Build (ensures no runtime errors)
npm run build

# 4. Unit tests (if applicable)
npm run test:unit
```

### Checklist from Constraint Card

Manually verify each item in the "Mandatory checks" section:

```
- [ ] All routes have loading states?      ← Check this
- [ ] All routes have error boundaries?    ← Check this
- [ ] 404 page exists?                     ← Check this
- [ ] Route boundaries tested manually?    ← Check this
- [ ] No forbidden files modified?         ← Automated by validate:slice
```

---

## 5. Commit and Push

### Commit Message Format

```
Add [feature/fix] for Slice X.Y

- Brief summary of changes
- Key decisions made
- Any deviations from constraint card (if warnings present)

Closes: SLICE_X_Y_BRIEF.md
```

### Git Commands

```bash
git add .
git commit -m "Your message"
git push
```

**Pre-commit hook (if installed):**
- Automatically runs constraint validation
- Blocks commit if violations detected
- Allows commit if only warnings

---

## 6. AI Agent Prompts

### For AI Executing a Slice

**Prompt template:**

```
Execute Slice X.Y: [Title]

Brief: docs/slices/SLICE_X_Y_BRIEF.md

Workflow:
1. Read the entire brief, especially the constraint card (section 1.5)
2. Before making ANY changes, confirm you understand:
   - Allowed files
   - Forbidden areas
   - Expected git diff
3. Implement changes incrementally
4. After EACH file change, run: npm run validate:slice docs/slices/SLICE_X_Y_BRIEF.md
5. If you see violations (❌), STOP and report
6. If you see warnings (⚠️), explain why the change is intentional
7. Before finishing, run all pre-commit checks
8. Report final git diff and constraint validation results

Do NOT skip constraint validation checks.
Do NOT modify forbidden files.
```

### For AI Collecting Evidence

**Prompt template:**

```
Collect manual validation evidence for Slice X.Y

Brief: docs/slices/SLICE_X_Y_BRIEF.md

Steps:
1. Initialize: npm run evidence:init docs/slices/SLICE_X_Y_BRIEF.md
2. I will test each flow/browser combination and tell you the results
3. You mark results using: npm run evidence:mark <flow> <target> <status> [note]
4. After each update, show me: npm run evidence:status
5. When all cells complete, generate report: npm run evidence:report

Wait for my test results before marking cells.
```

---

## 7. Common Scenarios

### Scenario 1: Simple API Endpoint (Slice 3.12)

```bash
# 1. Read brief
cat docs/slices/SLICE_3_12_BRIEF.md

# 2. Check constraint card - allowed files
# 3. Implement validation logic
# 4. Validate frequently
npm run validate:slice docs/slices/SLICE_3_12_BRIEF.md

# 5. Pre-commit checks
npm run typecheck && npm run build

# 6. Commit
git add . && git commit -m "Add input validation to /api/chat (Slice 3.12)"
```

### Scenario 2: UI Enhancement (Slice 3.5.1A)

```bash
# 1. Read brief
cat docs/slices/SLICE_3_5_1A_ACCOUNT_VISIBILITY_BRIEF.md

# 2. Implement UI changes
# 3. Validate after each file
npm run validate:slice docs/slices/SLICE_3_5_1A_ACCOUNT_VISIBILITY_BRIEF.md

# 4. Manual testing checklist (from constraint card)
# - Test on 375px viewport
# - Test menu overflow
# - Test keyboard navigation
# - Test dark mode

# 5. Commit
git add . && git commit -m "Add account email to menu (Slice 3.5.1A)"
```

### Scenario 3: Accessibility Validation (Slice 3.13)

```bash
# 1. Initialize evidence collection
npm run evidence:init docs/slices/SLICE_3_13_BRIEF.md

# 2. Test login flow on Chrome desktop
npm run evidence:mark login chrome pass

# 3. Test login flow on Safari desktop
npm run evidence:mark login safari fail "Focus ring not visible on form fields"

# 4. Continue testing all flows/browsers...

# 5. Check progress
npm run evidence:status

# 6. Generate evidence report
npm run evidence:report > docs/releases/SLICE_3_13_EVIDENCE.md

# 7. Review failures, fix issues, retest
npm run evidence:mark login safari pass

# 8. Final report
npm run evidence:report > docs/releases/SLICE_3_13_EVIDENCE.md
```

### Scenario 4: Constraint Violation Detected

```bash
# Run validation
npm run validate:slice docs/slices/SLICE_3_10_BRIEF.md

# Output shows violation:
# ❌ FORBIDDEN: lib/auth.ts matches forbidden pattern

# Actions:
# 1. Revert the forbidden change
git checkout lib/auth.ts

# 2. Re-run validation
npm run validate:slice docs/slices/SLICE_3_10_BRIEF.md

# 3. If change was necessary, update slice scope or create new slice
```

---

## 8. Tool Reference

### Constraint Validation

**Command:**
```bash
node scripts/validate-constraints.mjs <brief-path>
```

**Exit codes:**
- `0` - Success (no violations, warnings OK)
- `1` - Failure (violations detected)

**What it checks:**
- Files in `git status` against allowed files list
- Files in `git status` against forbidden patterns
- Current changes against expected git diff

**Limitations:**
- Only checks files, not file contents
- Simple glob matching (no advanced regex)
- Warnings are informational, not blocking

### Evidence Collection

**Commands:**
```bash
# Initialize matrix
node scripts/collect-evidence.mjs init <brief-path>

# Mark test result
node scripts/collect-evidence.mjs mark <flow> <target> <status> [note]

# Check progress
node scripts/collect-evidence.mjs status

# Generate report
node scripts/collect-evidence.mjs report
```

**Status values:**
- `pass` - Test passed ✅
- `fail` - Test failed ❌
- `pending` - Test planned but not started ⏳
- `skip` - Test not applicable ⏭️

**Storage:**
- Local file: `.evidence-matrix.json`
- Gitignored (not committed)
- Per-slice (reinitialize for each slice)

---

## 9. Troubleshooting

### "No constraint card found"

**Problem:** Brief is missing section 1.5 constraint card

**Solution:** Check if brief is outdated. All slices should have constraint cards after the governance updates. Update brief using SLICE_TEMPLATE.md.

### "Unexpected file warnings"

**Problem:** Modified files not in allowed files list

**Possible causes:**
1. **Scope creep** - You're modifying files outside slice scope
2. **Incomplete allowed list** - Constraint card needs update
3. **Intentional deviation** - Document reason in commit message

**Action:** Review each unexpected file. If necessary, update constraint card in brief.

### "Evidence matrix not initialized"

**Problem:** Tried to mark evidence without running `init`

**Solution:**
```bash
npm run evidence:init docs/slices/SLICE_X_BRIEF.md
```

### "Unknown flow or target"

**Problem:** Evidence matrix doesn't have that flow/target

**Solution:** Check `.evidence-matrix.json` for available flows. Default flows: login, signup, chat, revision, logout. Default targets: chrome, safari, ios, android, keyboard, screenReader.

---

## 10. Best Practices

### For AI Agents

1. **Read constraint card first** - Before any code changes
2. **Validate frequently** - After each file modification
3. **Stop on violations** - Don't proceed if forbidden files modified
4. **Explain warnings** - If you modified unexpected files, explain why
5. **Track progress** - Use todo lists to track mandatory checks

### For Humans

1. **Use npm scripts** - Easier than remembering full commands
2. **Commit evidence matrices separately** - Don't mix evidence tracking with code commits
3. **Clean up after slice** - Delete `.evidence-matrix.json` when slice complete
4. **Review warnings** - Even if non-blocking, warnings indicate drift

### For Both

1. **Constraint card is source of truth** - Not the general scope section
2. **Warnings are OK if documented** - But violations are not
3. **Evidence collection is per-slice** - Reinitialize for each slice
4. **Validation is cheap** - Run it liberally during development

---

## 11. Integration with Existing Workflow

### Gate Files

Slices reference stable gate files instead of retrospective sections:

- `docs/gates/DEFINITION_OF_DONE.md` - Quality gates for all slices
- `docs/gates/TECH_DEBT_REGISTER.md` - P0/P1/P2/P3 debt items
- `docs/gates/SLICE_4_ENTRY_CRITERIA.md` - Production gates
- `docs/gates/ROUTE_BOUNDARIES_WHY.md` - Framework patterns (Slice 3.10)
- `docs/gates/API_VALIDATION_WHY.md` - API reliability (Slice 3.12)
- `docs/gates/EVIDENCE_MATRIX.md` - Validation requirements (Slice 3.13)

Read these before executing relevant slices.

### Development Protocol

Follow LOW_REASONING_DEV_PROTOCOL.md for:
- Slice selection criteria
- Context budget management
- Decision documentation
- Quality gates

Constraint validation automates parts of the protocol but doesn't replace it.

---

## 12. Next Steps

**After completing this workflow setup:**

1. ✅ Constraint validation script working
2. ✅ Evidence collection script working
3. ✅ NPM scripts configured
4. ✅ Gitignore updated
5. ⏳ Test workflow with actual slice execution

**To test the workflow:**

Execute a small, low-risk slice (e.g., Slice 3.5.1A - Account Visibility) following this guide. Document any issues or workflow improvements.

**Future enhancements:**

- Database MCP for automated data verification (6 hours)
- Memory MCP for session state tracking (2 hours)
- Pre-commit hook integration with Husky (1 hour)
- Context budget tracking automation (1 hour)
