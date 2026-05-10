# MCP Memory Implementation Brief

**Status:** ready to implement
**Estimated time:** 2 hours
**Priority:** Tier 1 - Critical for low-reasoning model state tracking
**Blocks:** Multi-step constraint validation, evidence collection workflows

---

## 1. Goal

Add Memory MCP server to enable AI agents to maintain working memory across long sessions, track constraint validation progress, and resume interrupted workflows.

---

## 1.5. ⚠️ CONSTRAINT CARD

**Allowed files**:
- `package.json`
- `mcp-config.json`
- `.mcp-memory/` (new directory, gitignored)
- `.gitignore` (add .mcp-memory)
- `docs/mcp/MCP_MEMORY_USAGE.md` (new)

**Forbidden areas**:
- Do NOT store sensitive data (passwords, tokens, PII)
- Do NOT persist memory to production deployment
- Do NOT use for critical state (database is source of truth)

**Expected git diff**:
```
M package.json
M mcp-config.json
M .gitignore
A docs/mcp/MCP_MEMORY_USAGE.md
```

**Mandatory checks**:
- [ ] Memory storage is local only?
- [ ] `.mcp-memory/` added to `.gitignore`?
- [ ] No sensitive data in memory examples?
- [ ] Documentation includes memory scope limits?
- [ ] Memory clears between major tasks?

**Stop conditions**:
- Memory MCP requires cloud storage
- Cannot isolate memory between sessions
- Storage becomes unbounded

---

## 2. Installation

```bash
npm install --save-dev @modelcontextprotocol/server-memory
```

Official server provides:
- `memory_store` - Save key-value data
- `memory_retrieve` - Get saved data
- `memory_delete` - Remove data
- `memory_list` - List all keys

---

## 3. Configuration

Update `mcp-config.json`:

```json
{
  "mcpServers": {
    "git": {
      "command": "node",
      "args": ["./node_modules/@modelcontextprotocol/server-git/dist/index.js"],
      "env": { "GIT_REPO_PATH": "." }
    },
    "database": {
      "command": "node",
      "args": ["./scripts/mcp-database-server.mjs"],
      "env": { "MCP_DATABASE_URL": "${DATABASE_URL}" }
    },
    "memory": {
      "command": "node",
      "args": [
        "./node_modules/@modelcontextprotocol/server-memory/dist/index.js"
      ],
      "env": {
        "MEMORY_STORAGE_PATH": "./.mcp-memory"
      }
    }
  }
}
```

Update `.gitignore`:

```bash
# MCP Memory (local state only)
.mcp-memory/
```

Create memory directory:

```bash
mkdir .mcp-memory
```

---

## 4. Usage Patterns

### Pattern 1: Constraint Card Progress Tracking

**Use case:** Low-reasoning model working through 10-item constraint checklist

```typescript
// At start of slice implementation
await mcp.memory.store({
  key: "slice_3_10_constraints",
  value: {
    sliceBrief: "docs/slices/SLICE_3_10_BRIEF.md",
    startedAt: new Date().toISOString(),
    checks: {
      allowedFiles: "pending",
      routeBoundaries: "pending",
      axeSetup: "pending",
      playwrightTests: "pending",
      verifyScript: "pending",
      mobile375px: "pending",
      keyboard: "pending",
      darkMode: "pending"
    },
    filesModified: []
  }
})

// After each step
const progress = await mcp.memory.retrieve({
  key: "slice_3_10_constraints"
})

progress.checks.routeBoundaries = "complete"
progress.filesModified.push("app/loading.tsx")

await mcp.memory.store({
  key: "slice_3_10_constraints",
  value: progress
})

// AI can resume from any point by checking progress
```

### Pattern 2: Multi-File Refactor State

**Use case:** Updating 5 files for Slice 3.5.1A, interrupted mid-task

```typescript
await mcp.memory.store({
  key: "slice_3_5_1A_progress",
  value: {
    filesUpdated: [
      "app/chat/page.tsx - DONE",
      "components/ChatShell.tsx - DONE",
      "components/AppShell.tsx - IN PROGRESS"
    ],
    remainingTasks: [
      "Add account prop to AppShell menu",
      "Test 375px menu overflow",
      "Run validation commands"
    ],
    lastContext: "Working on AppShell menu account display section"
  }
})
```

### Pattern 3: Evidence Collection Workflow

**Use case:** Slice 3.13 manual validation matrix (8 flows × 4 browsers)

```typescript
await mcp.memory.store({
  key: "slice_3_13_evidence",
  value: {
    matrix: {
      login: {
        chromeDesktop: "✅ pass",
        safariDesktop: "✅ pass",
        iosSafari: "pending",
        androidChrome: "pending",
        keyboard: "✅ pass",
        screenReader: "pending"
      },
      chat: {
        chromeDesktop: "✅ pass",
        safariDesktop: "pending",
        // ...
      }
      // ... other flows
    },
    screenshots: [
      "evidence/login-375px-light.png",
      "evidence/login-375px-dark.png"
    ],
    startedAt: "2026-05-09T10:30:00Z",
    completedFlows: 2,
    totalFlows: 8
  }
})
```

### Pattern 4: Slice Handoff Between Sessions

**Use case:** Pause work Friday, resume Monday

```typescript
// Friday EOD
await mcp.memory.store({
  key: "current_work",
  value: {
    slice: "3.12",
    status: "50% complete",
    completedSteps: [
      "Added zod schemas to /api/chat",
      "Added error envelope helper",
      "Updated /api/chat/attempt validation"
    ],
    nextSteps: [
      "Add validation to /api/revision/review",
      "Create DATA_GOVERNANCE.md",
      "Test error responses"
    ],
    blockers: [],
    notes: "Error envelope backward compatible, no client changes needed"
  }
})

// Monday morning
const work = await mcp.memory.retrieve({ key: "current_work" })
// AI continues from nextSteps
```

---

## 5. Memory Namespace Conventions

**Recommended key prefixes:**

- `slice_[number]_constraints` - Constraint card progress
- `slice_[number]_evidence` - Evidence collection state
- `slice_[number]_progress` - General implementation progress
- `current_work` - Active task context
- `session_[date]` - Daily session notes
- `debt_tracker` - P0/P1 item status

**Example keys:**
```
slice_3_10_constraints
slice_3_13_evidence
slice_3_5_1A_progress
current_work
session_2026-05-09
debt_tracker_p0
```

---

## 6. Integration with Constraint Cards

**Automated progress tracking:**

```typescript
// scripts/constraint-tracker.mjs
import { parseConstraintCard } from './validate-constraints.mjs'

export async function initializeConstraintTracking(briefPath) {
  const constraints = parseConstraintCard(briefPath)

  const checks = {}
  for (const check of constraints.mandatoryChecks) {
    checks[check] = "pending"
  }

  await mcp.memory.store({
    key: `constraints_${briefPath}`,
    value: {
      brief: briefPath,
      startedAt: new Date().toISOString(),
      checks,
      violations: [],
      warnings: []
    }
  })
}

export async function updateConstraintProgress(briefPath, checkName, status) {
  const progress = await mcp.memory.retrieve({
    key: `constraints_${briefPath}`
  })

  progress.checks[checkName] = status
  progress.updatedAt = new Date().toISOString()

  await mcp.memory.store({
    key: `constraints_${briefPath}`,
    value: progress
  })

  // Report remaining checks
  const remaining = Object.entries(progress.checks)
    .filter(([_, status]) => status === "pending")

  console.log(`Remaining checks: ${remaining.length}`)
  return remaining
}
```

---

## 7. Safety & Cleanup

### DO NOT Store

- Passwords, tokens, API keys
- Full email addresses (use hashed or truncated)
- Database credentials
- Idempotency keys
- Raw user input

### DO Store

- Task progress state
- Checklist completion status
- File modification lists
- Evidence collection status
- Non-sensitive notes

### Cleanup Rules

**After slice completion:**
```typescript
// Clear slice-specific memory
await mcp.memory.delete({ key: "slice_3_10_constraints" })
await mcp.memory.delete({ key: "slice_3_10_progress" })
await mcp.memory.delete({ key: "slice_3_10_evidence" })
```

**Weekly cleanup:**
```typescript
// List all keys
const keys = await mcp.memory.list()

// Delete old session data
for (const key of keys) {
  if (key.startsWith("session_") && isOlderThan7Days(key)) {
    await mcp.memory.delete({ key })
  }
}
```

**Manual cleanup:**
```bash
# Nuclear option - clear all memory
rm -rf .mcp-memory/*
```

---

## 8. Integration with Claude Code

Update Claude Code config:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": [
        "C:\\Users\\siddiqui\\lernsaathi\\node_modules\\@modelcontextprotocol\\server-memory\\dist\\index.js"
      ],
      "env": {
        "MEMORY_STORAGE_PATH": "C:\\Users\\siddiqui\\lernsaathi\\.mcp-memory"
      }
    }
  }
}
```

Restart Claude Code after config change.

---

## 9. Validation

```bash
# 1. Install memory server
npm install --save-dev @modelcontextprotocol/server-memory

# 2. Create memory directory
mkdir .mcp-memory

# 3. Test with Claude Code
# Ask: "Store a test value: key 'hello', value 'world'"
# Then: "Retrieve the value for key 'hello'"
# Expected: "world"

# 4. Test constraint tracking
# Ask: "Initialize constraint tracking for SLICE_3_10_BRIEF.md"
# Then: "Mark 'routeBoundaries' check as complete"
# Then: "Show me remaining constraint checks"
# Expected: List of pending checks

# 5. Test cleanup
# Ask: "List all memory keys"
# Then: "Delete key 'hello'"
# Then: "List all memory keys"
# Expected: 'hello' no longer in list
```

---

## 10. Documentation

Create `docs/mcp/MCP_MEMORY_USAGE.md`:

```markdown
# Memory MCP Usage Guide

## For AI Agents

### Initialize Constraint Tracking

"Start tracking constraints for SLICE_3_10_BRIEF.md"

### Update Progress

"Mark constraint check 'allowedFiles' as complete"
"Add file app/loading.tsx to modified files list"

### Check Progress

"Show me my current constraint check progress"
"What steps remain for this slice?"

### Evidence Collection

"Initialize evidence matrix for Slice 3.13"
"Mark login flow for Chrome Desktop as pass"
"What evidence checks remain?"

### Session Handoff

"Save my current work state"
"Show me where I left off last session"

## For Humans

### View Memory State

```bash
# Check what's stored
ls -la .mcp-memory/

# View specific key (if using JSON storage)
cat .mcp-memory/slice_3_10_constraints.json
```

### Cleanup Old Data

```bash
# Weekly cleanup
rm -rf .mcp-memory/session_2026-04-*

# Nuclear option
rm -rf .mcp-memory/*
```

## Best Practices

### ✅ DO
- Initialize tracking at start of slice
- Update after each major step
- Clear memory after slice completion
- Use descriptive key names with prefixes

### ❌ DO NOT
- Store sensitive data
- Rely on memory as source of truth
- Let memory grow unbounded
- Share memory between production/dev

## Common Workflows

### Slice Implementation

1. "Initialize constraint tracking for [brief]"
2. Work on implementation
3. "Mark check X as complete"
4. Repeat until done
5. "Clear slice memory"

### Evidence Collection

1. "Initialize evidence matrix"
2. Run manual checks
3. "Mark [flow] for [browser] as [pass/fail]"
4. "Show evidence completion percentage"
5. "Generate evidence summary"

### Interrupted Work

1. "Save current progress state"
2. Next session: "Show me where I left off"
3. Continue work
4. "Update progress"
```

---

## 11. Acceptance Criteria

- [ ] Memory server installed
- [ ] `.mcp-memory/` directory created and gitignored
- [ ] Can store and retrieve simple key-value pairs
- [ ] Can track constraint card progress
- [ ] Can list all stored keys
- [ ] Can delete specific keys
- [ ] Memory accessible from Claude Code
- [ ] Documentation created
- [ ] No sensitive data in examples

---

## 12. Known Limitations

**Current limitations:**
- Local storage only (not synchronized across devices)
- No automatic expiration (manual cleanup required)
- No encryption (use for non-sensitive data only)
- Storage size grows unbounded without cleanup

**Future improvements:**
- Add automatic expiration based on age
- Add memory size monitoring
- Add encrypted storage option
- Add memory export/import for session backups

---

## 13. Estimated Impact

**Success probability increase:**
- Simple slices: +2-5%
- Complex slices: +5-10%

**Specific improvements:**
- ✅ Low-reasoning models can resume after interruption
- ✅ Constraint checks not forgotten mid-implementation
- ✅ Evidence collection doesn't need to restart
- ✅ Multi-step workflows maintain state

**Time savings:**
- Per resumed session: 5-15 min (context reconstruction eliminated)
- Per multi-step workflow: 10-20 min (checklist state maintained)

**Use cases enabled:**
- ✅ Constraint card progress tracking (10+ checks)
- ✅ Evidence matrix completion tracking (32+ cells)
- ✅ Multi-file refactor state (5+ files)
- ✅ Session handoff between days
- ✅ Interrupted workflow resumption

**Total investment:** 2 hours implementation, 5 min per slice to initialize tracking
