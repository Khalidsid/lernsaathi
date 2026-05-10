# MCP Database/Prisma Implementation Brief

**Status:** ready to implement
**Estimated time:** 6 hours
**Priority:** Tier 1 - Critical for Slices 3.12, 3.13 data verification
**Blocks:** Review count fixes, evidence collection, data governance validation

---

## 1. Goal

Add Database MCP server to enable AI agents to query Prisma schema, inspect data, and validate database state without manual Railway console access.

---

## 1.5. ⚠️ CONSTRAINT CARD

**Allowed files**:
- `package.json`
- `mcp-config.json`
- `scripts/mcp-database-server.mjs` (new)
- `lib/mcp-db-helpers.ts` (new)
- `.env.local.example` (add MCP_DB_URL example)
- `docs/mcp/MCP_DATABASE_USAGE.md` (new)

**Forbidden areas**:
- Do NOT expose to production database (use local/staging only)
- Do NOT allow write operations without explicit confirmation
- Do NOT log sensitive data (emails, passwords, tokens)
- Do NOT bypass Prisma Client (direct SQL requires review)

**Expected git diff**:
```
M package.json
M mcp-config.json
A scripts/mcp-database-server.mjs
A lib/mcp-db-helpers.ts
M .env.local.example
A docs/mcp/MCP_DATABASE_USAGE.md
```

**Mandatory checks**:
- [ ] Only connects to local/dev database?
- [ ] Read-only mode enforced by default?
- [ ] Sensitive fields redacted in responses?
- [ ] Prisma Client used (not raw SQL)?
- [ ] Error handling prevents credential exposure?
- [ ] Documentation includes safety warnings?

**Stop conditions**:
- Cannot safely isolate from production database
- Prisma Client version incompatibility
- MCP server requires credentials in plain text config
- Data redaction becomes too complex

---

## 2. Installation

```bash
# Option A: Use official Postgres MCP (if available)
npm install --save-dev @modelcontextprotocol/server-postgres

# Option B: Build custom Prisma wrapper (recommended)
# (Implementation below)
```

For this project, **Option B is recommended** because:
- Uses existing Prisma Client
- Respects schema types
- Can enforce read-only mode
- Already has your DB connection configured

---

## 3. Custom Prisma MCP Server

Create `scripts/mcp-database-server.mjs`:

```javascript
#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

// Initialize Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.MCP_DATABASE_URL || process.env.DATABASE_URL
    }
  }
})

// Sensitive fields to redact
const REDACTED_FIELDS = new Set([
  'passwordHash',
  'idempotencyKey',
  'authToken',
  'providerAccountId'
])

function redactSensitiveData(data) {
  if (!data) return data
  if (Array.isArray(data)) return data.map(redactSensitiveData)
  if (typeof data !== 'object') return data

  const redacted = { ...data }
  for (const key of Object.keys(redacted)) {
    if (REDACTED_FIELDS.has(key)) {
      redacted[key] = '[REDACTED]'
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key])
    }
  }
  return redacted
}

// Create MCP server
const server = new Server(
  {
    name: 'lernsaathi-database',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'prisma_findMany',
        description: 'Query multiple records from a Prisma model (read-only)',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'Prisma model name (e.g., "user", "learningEvent")',
              enum: [
                'user',
                'learnerProfile',
                'examReadinessMap',
                'learningEvent',
                'mistake',
                'mistakeExampleAttempt',
                'idempotencyRecord'
              ]
            },
            where: {
              type: 'object',
              description: 'Prisma where clause (optional)'
            },
            select: {
              type: 'object',
              description: 'Fields to select (optional, defaults to all)'
            },
            take: {
              type: 'number',
              description: 'Limit results (default 10, max 100)'
            },
            orderBy: {
              type: 'object',
              description: 'Sort order (optional)'
            }
          },
          required: ['model']
        }
      },
      {
        name: 'prisma_count',
        description: 'Count records matching criteria',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              enum: [
                'user',
                'learnerProfile',
                'examReadinessMap',
                'learningEvent',
                'mistake',
                'mistakeExampleAttempt',
                'idempotencyRecord'
              ]
            },
            where: {
              type: 'object',
              description: 'Filter criteria'
            }
          },
          required: ['model']
        }
      },
      {
        name: 'prisma_groupBy',
        description: 'Aggregate and group records',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            by: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to group by'
            },
            where: { type: 'object' },
            _count: { type: 'boolean' }
          },
          required: ['model', 'by']
        }
      },
      {
        name: 'verify_reviewCount',
        description: 'Verify today\'s review count matches LearningEvent rows (Slice 3.13)',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' }
          },
          required: ['userId']
        }
      },
      {
        name: 'verify_userProvisioning',
        description: 'Verify user has all required records (User, Profile, ExamMap)',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string' }
          },
          required: ['email']
        }
      }
    ]
  }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'prisma_findMany': {
        const { model, where, select, take = 10, orderBy } = args
        const modelName = model.charAt(0).toLowerCase() + model.slice(1)

        if (!prisma[modelName]) {
          throw new Error(`Unknown model: ${model}`)
        }

        const results = await prisma[modelName].findMany({
          where,
          select,
          take: Math.min(take, 100),
          orderBy
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(redactSensitiveData(results), null, 2)
            }
          ]
        }
      }

      case 'prisma_count': {
        const { model, where } = args
        const modelName = model.charAt(0).toLowerCase() + model.slice(1)

        const count = await prisma[modelName].count({ where })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count }, null, 2)
            }
          ]
        }
      }

      case 'prisma_groupBy': {
        const { model, by, where, _count } = args
        const modelName = model.charAt(0).toLowerCase() + model.slice(1)

        const results = await prisma[modelName].groupBy({
          by,
          where,
          _count: _count ? true : undefined
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        }
      }

      case 'verify_reviewCount': {
        const { userId } = args

        // Get today's date range
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        // Count LearningEvent rows with inputType = "revision_attempt"
        const eventCount = await prisma.learningEvent.count({
          where: {
            userId,
            inputType: 'revision_attempt',
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        })

        // Count actual revision reviews (would need RevisionReview table or check Mistake.lastReviewedAt)
        const mistakeReviews = await prisma.mistake.count({
          where: {
            userId,
            lastReviewedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        })

        const result = {
          userId,
          date: startOfDay.toISOString().split('T')[0],
          learningEventCount: eventCount,
          actualReviews: mistakeReviews,
          discrepancy: mistakeReviews - eventCount,
          issue: mistakeReviews !== eventCount
            ? 'MISMATCH: Review count does not match LearningEvent rows'
            : 'OK: Counts match'
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      }

      case 'verify_userProvisioning': {
        const { email } = args

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            profile: true,
            examMap: true
          }
        })

        if (!user) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'User not found', email }, null, 2)
              }
            ]
          }
        }

        const result = {
          email: user.email,
          userId: user.id,
          hasProfile: !!user.profile,
          hasExamMap: !!user.examMap,
          authProvider: user.authProvider,
          createdAt: user.createdAt,
          provisioningComplete: !!(user.profile && user.examMap),
          issues: []
        }

        if (!user.profile) result.issues.push('MISSING: LearnerProfile')
        if (!user.examMap) result.issues.push('MISSING: ExamReadinessMap')
        if (user.authProvider === 'email' && user.passwordHash === null) {
          result.issues.push('MISSING: passwordHash for email auth')
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(redactSensitiveData(result), null, 2)
            }
          ]
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: error.message,
              tool: name,
              args: args
            },
            null,
            2
          )
        }
      ],
      isError: true
    }
  }
})

// Start server
const transport = new StdioServerTransport()
await server.connect(transport)

console.error('Lernsaathi Database MCP server running')
