# MCP Git Enhanced Implementation Brief

**Status:** ready to implement
**Estimated time:** 4 hours
**Priority:** Tier 1 - Critical for constraint card automation
**Blocks:** Slices 3.10-3.13 (manual changed-files audit currently required)

---

## 1. Goal

Add Git MCP server to automate constraint card validation, changed-files audits, and implementation drift detection.

---

## 1.5. ⚠️ CONSTRAINT CARD

**Allowed files**:
- `package.json`
- `mcp-config.json` (new)
- `scripts/validate-constraints.mjs` (new)
- `.husky/pre-commit` (new, if adding pre-commit hook)
- `docs/mcp/MCP_GIT_USAGE.md` (new)

**Forbidden areas**:
- Do NOT modify existing source code
- Do NOT change git configuration
- Do NOT add git hooks that skip validation

**Expected git diff**:
```
M package.json
A mcp-config.json
A scripts/validate-constraints.mjs
A .husky/pre-commit (optional)
A docs/mcp/MCP_GIT_USAGE.md
```

**Mandatory checks**:
- [ ] MCP server starts successfully?
- [ ] Can read current git status?
- [ ] Can validate constraint card example?
- [ ] Does not require authentication changes?
- [ ] Documentation includes usage examples?

**Stop conditions**:
- MCP server requires tools not available on Windows
- Git operations require elevated permissions
- Constraint validation logic becomes too complex for maintenance

---

## 2. Installation

### Option A: Official Git MCP (Recommended)

```bash
npm install --save-dev @modelcontextprotocol/server-git
```

### Option B: Enhanced Git MCP (If official lacks features)

```bash
npm install --save-dev mcp-git-ingest
```

---

## 3. Configuration

Create `mcp-config.json`:

```json
{
  "mcpServers": {
    "git": {
      "command": "node",
      "args": ["./node_modules/@modelcontextprotocol/server-git/dist/index.js"],
      "env": {
        "GIT_REPO_PATH": "."
      },
      "capabilities": [
        "git_status",
        "git_diff",
        "git_log",
        "git_show",
        "git_branch"
      ]
    }
  }
}
```

---

## 4. Constraint Validation Script

Create `scripts/validate-constraints.mjs`:

```javascript
#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

/**
 * Validates git changes against slice brief constraint card.
 *
 * Usage: node scripts/validate-constraints.mjs [slice-brief-path]
 * Example: node scripts/validate-constraints.mjs docs/slices/SLICE_3_10_BRIEF.md
 */

function parseConstraintCard(briefPath) {
  const content = fs.readFileSync(briefPath, 'utf-8')

  // Extract constraint card section
  const cardMatch = content.match(
    /## 1\.5\. ⚠️ CONSTRAINT CARD[\s\S]*?---/
  )

  if (!cardMatch) {
    throw new Error(`No constraint card found in ${briefPath}`)
  }

  const cardText = cardMatch[0]

  // Parse allowed files
  const allowedMatch = cardText.match(
    /\*\*Allowed files.*?\*\*:\s*([\s\S]*?)(?=\*\*Forbidden|$)/
  )
  const allowedFiles = allowedMatch
    ? allowedMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.replace(/^-\s*`?([^`\s(]+).*/, '$1'))
    : []

  // Parse forbidden patterns
  const forbiddenMatch = cardText.match(
    /\*\*Forbidden areas.*?\*\*:\s*([\s\S]*?)(?=\*\*Expected|$)/
  )
  const forbiddenPatterns = forbiddenMatch
    ? forbiddenMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.replace(/^-\s*`?([^`\s(]+).*/, '$1'))
    : []

  // Parse expected git diff
  const diffMatch = cardText.match(/```\n([\s\S]*?)```/)
  const expectedDiff = diffMatch
    ? diffMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.match(/^[MAD]\s+/))
        .map(line => {
          const [status, ...pathParts] = line.split(/\s+/)
          return { status, path: pathParts.join(' ') }
        })
    : []

  return { allowedFiles, forbiddenPatterns, expectedDiff }
}

function getGitStatus() {
  const output = execSync('git status --short', { encoding: 'utf-8' })
  return output
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const match = line.match(/^(.{2})\s+(.+)$/)
      if (!match) return null

      const [, statusCode, filePath] = match
      const status = statusCode.trim().charAt(0)

      // Map git status codes to M/A/D
      let normalizedStatus = status
      if (status === '?' || status === 'A') normalizedStatus = 'A'
      else if (status === 'M' || status === 'R') normalizedStatus = 'M'
      else if (status === 'D') normalizedStatus = 'D'

      return { status: normalizedStatus, path: filePath }
    })
    .filter(Boolean)
}

function matchesPattern(filePath, pattern) {
  // Simple glob matching
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')

  return new RegExp(`^${regexPattern}$`).test(filePath)
}

function validateConstraints(briefPath) {
  const constraints = parseConstraintCard(briefPath)
  const currentStatus = getGitStatus()

  const violations = []
  const warnings = []

  // Check each changed file
  for (const { status, path: filePath } of currentStatus) {
    // Check if file is forbidden
    const isForbidden = constraints.forbiddenPatterns.some(pattern =>
      matchesPattern(filePath, pattern)
    )

    if (isForbidden) {
      violations.push(`❌ FORBIDDEN: ${filePath} matches forbidden pattern`)
      continue
    }

    // Check if file is allowed
    const isAllowed = constraints.allowedFiles.some(allowedPath =>
      filePath === allowedPath ||
      matchesPattern(filePath, allowedPath) ||
      allowedPath.endsWith('(new)') && matchesPattern(filePath, allowedPath.replace(/\s*\(new\)/, ''))
    )

    if (!isAllowed) {
      warnings.push(`⚠️  UNEXPECTED: ${filePath} not in allowed files list`)
    }
  }

  // Compare with expected diff
  if (constraints.expectedDiff.length > 0) {
    const currentPaths = new Set(currentStatus.map(s => s.path))
    const expectedPaths = new Set(constraints.expectedDiff.map(d => d.path))

    // Check for missing expected changes
    for (const expected of constraints.expectedDiff) {
      if (!currentPaths.has(expected.path)) {
        warnings.push(`⚠️  MISSING: Expected change to ${expected.path}`)
      }
    }
  }

  return { violations, warnings, currentStatus, constraints }
}

// Main execution
const briefPath = process.argv[2] || 'docs/slices/SLICE_3_10_BRIEF.md'

try {
  const result = validateConstraints(briefPath)

  console.log('\n📋 Constraint Card Validation\n')
  console.log(`Brief: ${briefPath}\n`)

  console.log('Current changes:')
  for (const { status, path } of result.currentStatus) {
    console.log(`  ${status} ${path}`)
  }
  console.log()

  if (result.violations.length > 0) {
    console.log('🚨 VIOLATIONS (MUST FIX):')
    result.violations.forEach(v => console.log(`  ${v}`))
    console.log()
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS (REVIEW):')
    result.warnings.forEach(w => console.log(`  ${w}`))
    console.log()
  }

  if (result.violations.length === 0 && result.warnings.length === 0) {
    console.log('✅ All constraint checks passed!\n')
    process.exit(0)
  } else if (result.violations.length > 0) {
    console.log('❌ Constraint violations detected. Fix before committing.\n')
    process.exit(1)
  } else {
    console.log('⚠️  Warnings present. Review before committing.\n')
    process.exit(0) // Warnings don't block
  }
} catch (error) {
  console.error('Error validating constraints:', error.message)
  process.exit(1)
}
```

Make executable:
```bash
chmod +x scripts/validate-constraints.mjs
```

---

## 5. Optional: Pre-commit Hook Integration

If using Husky:

```bash
npm install --save-dev husky
npx husky init
```

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Find the active slice brief
ACTIVE_BRIEF=$(git diff --name-only --cached | grep 'docs/slices/SLICE_.*_BRIEF.md' | head -1)

if [ -n "$ACTIVE_BRIEF" ]; then
  echo "Validating constraints for $ACTIVE_BRIEF..."
  node scripts/validate-constraints.mjs "$ACTIVE_BRIEF"
fi
```

---

## 6. Usage Examples

### For AI Agents (Claude/Codex)

**Scenario 1: Before committing Slice 3.10**

```typescript
// AI calls this via MCP
const result = await mcp.git.validateConstraints({
  brief: 'docs/slices/SLICE_3_10_BRIEF.md'
})

if (result.violations.length > 0) {
  // AI stops and reports
  throw new Error(`Constraint violations: ${result.violations.join(', ')}`)
}
```

**Scenario 2: During implementation**

```typescript
// AI checks partway through
const status = await mcp.git.getStatus()
const changedFiles = status.files.map(f => f.path)

console.log('Changed so far:', changedFiles)
// AI compares with constraint card allowed files
```

**Scenario 3: Evidence collection**

```typescript
// For RELEASE_EVIDENCE_SLICE_X.md
const evidence = {
  gitDiff: await mcp.git.getDiff(),
  constraintValidation: await mcp.git.validateConstraints({
    brief: sliceBrief
  }),
  unexpectedChanges: result.warnings.length
}
```

### For Humans

```bash
# Manual validation before commit
node scripts/validate-constraints.mjs docs/slices/SLICE_3_12_BRIEF.md

# Check current status
git status --short

# Compare with constraint card
# (script does this automatically)
```

---

## 7. Integration with Claude Code

Add to Claude Code MCP config:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS/Linux:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "git": {
      "command": "node",
      "args": [
        "C:\\Users\\siddiqui\\lernsaathi\\node_modules\\@modelcontextprotocol\\server-git\\dist\\index.js"
      ],
      "env": {
        "GIT_REPO_PATH": "C:\\Users\\siddiqui\\lernsaathi"
      }
    }
  }
}
```

Restart Claude Code to load the MCP server.

---

## 8. Validation

Run after implementation:

```bash
# Install dependencies
npm install

# Test constraint validation script
node scripts/validate-constraints.mjs docs/slices/SLICE_3_10_BRIEF.md

# Make a test change
echo "// test" >> test-file.ts
git add test-file.ts

# Should show warning (unexpected file)
node scripts/validate-constraints.mjs docs/slices/SLICE_3_10_BRIEF.md

# Clean up
git reset HEAD test-file.ts
rm test-file.ts

# Test MCP server (if Claude Code integration)
# Open Claude Code and ask: "What files have I changed in git?"
```

Expected Claude Code response:
```
I can see the following changed files:
- M package.json
- A scripts/validate-constraints.mjs
- A mcp-config.json

These changes match the MCP Git implementation.
```

---

## 9. Documentation

Create `docs/mcp/MCP_GIT_USAGE.md`:

```markdown
# Git MCP Usage Guide

## For AI Agents

### Check current git status
Use: "What files are currently changed?"

### Validate constraint card
Use: "Check if my changes match the constraint card in SLICE_3_10_BRIEF.md"

### Get diff for evidence
Use: "Generate the git diff summary for the release evidence document"

## For Humans

### Manual validation
\`\`\`bash
node scripts/validate-constraints.mjs docs/slices/SLICE_X_BRIEF.md
\`\`\`

### Pre-commit check
Runs automatically if Husky installed.

### Override warnings (not violations)
If the AI flagged warnings but you've verified they're intentional:
\`\`\`bash
git commit --no-verify
\`\`\`

⚠️ Never override violations (forbidden file changes).
```

---

## 10. Acceptance Criteria

- [ ] `@modelcontextprotocol/server-git` installed
- [ ] `scripts/validate-constraints.mjs` parses constraint cards correctly
- [ ] Script detects forbidden file changes
- [ ] Script warns about unexpected file changes
- [ ] MCP server accessible from Claude Code
- [ ] Documentation created in `docs/mcp/MCP_GIT_USAGE.md`
- [ ] Tested with at least one slice brief (SLICE_3_10)

---

## 11. Known Limitations

**Current limitations:**
- Glob pattern matching is simple (no advanced regex)
- Only validates against staged changes, not all working tree changes
- Does not auto-fix violations (by design - requires human review)
- Windows path separators may need normalization

**Future improvements:**
- Add semantic diff analysis (detect refactors)
- Integrate with drift detection (compare against main branch)
- Auto-generate evidence section for release docs

---

## 12. Estimated Impact

**Success probability increase:**
- Simple slices: +5-10%
- Complex slices: +10-15%

**Time savings:**
- Per slice: ~15-30 min (manual audit eliminated)
- Per commit: ~2-5 min (instant validation vs manual check)

**Total investment:** 4 hours implementation, 15 min per slice to configure constraint card validation
