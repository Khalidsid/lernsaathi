# Development Scripts

Automation tools for constraint validation and evidence collection.

---

## Constraint Validation (`validate-constraints.mjs`)

Validates git changes against slice brief constraint cards.

### Usage

```bash
# Using npm script (recommended)
npm run validate:slice docs/slices/SLICE_3_10_BRIEF.md

# Or directly
node scripts/validate-constraints.mjs docs/slices/SLICE_3_10_BRIEF.md
```

### What It Checks

1. **Forbidden files** - Fails if any changed file matches forbidden patterns
2. **Allowed files** - Warns if changed files not in allowed list
3. **Expected diff** - Warns if expected files missing

### Output

**✅ Success (no violations)**
```
📋 Constraint Card Validation

Brief: docs/slices/SLICE_3_10_BRIEF.md

Current changes:
  A app/loading.tsx
  A app/error.tsx
  M app/layout.tsx

✅ All constraint checks passed!
```

**⚠️ Warnings (review required)**
```
⚠️  WARNINGS (REVIEW):
  ⚠️  UNEXPECTED: lib/utils.ts not in allowed files list
  ⚠️  MISSING: Expected change to app/not-found.tsx

⚠️  Warnings present. Review before committing.
```

**❌ Violations (must fix)**
```
🚨 VIOLATIONS (MUST FIX):
  ❌ FORBIDDEN: prisma/schema.prisma matches forbidden pattern

❌ Constraint violations detected. Fix before committing.
```

### Exit Codes

- `0` - Success (no violations, warnings OK)
- `1` - Failure (violations detected)

---

## Evidence Collection (`collect-evidence.mjs`)

Tracks manual validation matrix progress (UI/accessibility testing).

### Usage

#### 1. Initialize Matrix

```bash
npm run evidence:init docs/slices/SLICE_3_13_BRIEF.md
```

Creates `.evidence-matrix.json` (gitignored) with default flows and targets.

#### 2. Mark Test Results

```bash
# Pass
npm run evidence:mark login chrome pass

# Fail with note
npm run evidence:mark chat keyboard fail "Submit button not reachable"

# Pending (placeholder)
npm run evidence:mark revision ios pending

# Skip (not applicable)
npm run evidence:mark logout screenReader skip
```

#### 3. Check Progress

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
  ❌ safari: fail
     └─ Focus ring not visible
  ⏳ ios: pending
  ⬜ android: not tested

Summary:
  Total cells: 30
  Completed: 10/30 (33%)
  Pass rate: 9/10 (90%)
  Failures: 1
```

#### 4. Generate Report

```bash
npm run evidence:report > docs/releases/SLICE_3_13_EVIDENCE.md
```

Creates markdown table with all results and issues list.

### Default Matrix Structure

**Flows:** login, signup, chat, revision, logout
**Browsers:** chrome, safari, ios, android
**Accessibility:** keyboard, screenReader

Total: 5 flows × 6 targets = 30 cells

### Status Values

- `pass` ✅ - Test passed
- `fail` ❌ - Test failed (requires note)
- `pending` ⏳ - Test planned but not started
- `skip` ⏭️ - Test not applicable

---

## Typical Workflows

### Workflow 1: Simple Implementation

```bash
# 1. Read constraint card from brief
cat docs/slices/SLICE_3_12_BRIEF.md | grep -A 20 "CONSTRAINT CARD"

# 2. Implement changes
# ... make code changes ...

# 3. Validate frequently
npm run validate:slice docs/slices/SLICE_3_12_BRIEF.md

# 4. Pre-commit checks
npm run typecheck
npm run build

# 5. Commit
git add .
git commit -m "Add input validation (Slice 3.12)"
```

### Workflow 2: UI with Manual Validation

```bash
# 1. Implement UI changes
# ... make code changes ...

# 2. Validate constraints
npm run validate:slice docs/slices/SLICE_3_13_BRIEF.md

# 3. Initialize evidence collection
npm run evidence:init docs/slices/SLICE_3_13_BRIEF.md

# 4. Manual testing
# Test login on Chrome Desktop
npm run evidence:mark login chrome pass

# Test login on Safari Desktop (found issue)
npm run evidence:mark login safari fail "Focus ring not visible"

# ... continue testing all flows/browsers ...

# 5. Check progress
npm run evidence:status

# 6. Fix issues and retest
# ... fix focus ring issue ...
npm run evidence:mark login safari pass

# 7. Generate evidence report
npm run evidence:report > docs/releases/SLICE_3_13_EVIDENCE.md

# 8. Commit with evidence
git add .
git commit -m "Add accessibility improvements (Slice 3.13)"
```

### Workflow 3: AI Agent Execution

**Prompt:**
```
Execute Slice 3.10: Route Boundaries

Brief: docs/slices/SLICE_3_10_BRIEF.md

Before making ANY changes:
1. Read the constraint card (section 1.5)
2. List allowed files and forbidden areas

After EACH file change:
3. Run: npm run validate:slice docs/slices/SLICE_3_10_BRIEF.md
4. If violations (❌), STOP and report
5. If warnings (⚠️), explain why

Before finishing:
6. Run npm run typecheck && npm run build
7. Report final git diff and validation results
```

---

## Integration with Git

### Pre-commit Hook (Optional)

Install Husky:
```bash
npm install --save-dev husky
npx husky init
```

Create `.husky/pre-commit`:
```bash
#!/bin/sh
# Find active slice brief from git changes
ACTIVE_BRIEF=$(git diff --name-only --cached | grep 'SLICE_.*_BRIEF.md' | head -1)

if [ -n "$ACTIVE_BRIEF" ]; then
  echo "Validating constraints for $ACTIVE_BRIEF..."
  node scripts/validate-constraints.mjs "$ACTIVE_BRIEF"
fi
```

This automatically validates constraints before each commit.

---

## Files

- `validate-constraints.mjs` - Constraint validation (192 lines)
- `collect-evidence.mjs` - Evidence collection (350+ lines)
- `check-policy.mjs` - Policy compliance check (existing)

All scripts use Node.js with ES modules (`.mjs`).

---

## Troubleshooting

### "No constraint card found"

**Cause:** Brief missing section 1.5 constraint card
**Fix:** Update brief using `docs/slices/SLICE_TEMPLATE.md`

### "Evidence matrix not initialized"

**Cause:** Forgot to run `evidence:init`
**Fix:** Run `npm run evidence:init <brief-path>`

### "Unknown flow or target"

**Cause:** Evidence matrix doesn't have that flow/target
**Fix:** Check `.evidence-matrix.json` for available flows/targets

### Constraint validation shows warnings for everything

**Cause:** Testing validation against wrong slice brief
**Example:** Running `validate:slice SLICE_3_10_BRIEF.md` while working on Slice 3.12
**Fix:** Make sure the brief path matches the slice you're working on

---

## Best Practices

### For Constraint Validation

- Run validation **after each file change**, not just at the end
- Warnings are OK if you document why in commit message
- Violations mean **stop immediately** and review scope
- Use constraint card as source of truth, not general scope section

### For Evidence Collection

- Initialize evidence matrix **at start of manual testing**
- Mark cells **as you test**, don't batch updates
- Add notes for failures - "fail" alone isn't helpful
- Delete `.evidence-matrix.json` after slice complete (gitignored anyway)

### For Both

- These tools are **informational**, not enforcement
- Human judgment still required for interpreting results
- Tools work for both AI agents and human developers
- Can be used together (constraints + evidence) or separately

---

## Future Enhancements

**Planned:**
- Database MCP integration for automated data verification
- Memory MCP for session state tracking
- Context budget monitoring
- Semantic diff analysis

**Deferred (MCP ecosystem not ready):**
- Git MCP server (using standalone scripts instead)
- Official MCP packages (404 errors in npm registry)

---

## See Also

- `docs/SLICE_EXECUTION_WORKFLOW.md` - Complete workflow guide
- `docs/gates/DEFINITION_OF_DONE.md` - Quality gates
- `docs/slices/SLICE_TEMPLATE.md` - Slice brief template
- `docs/LOW_REASONING_DEV_PROTOCOL.md` - Development protocol
