# Database MCP Brief - Remaining Sections

**NOTE:** Append this content to `MCP_DATABASE_IMPLEMENTATION_BRIEF.md` after line 446

---

## Configuration & Usage Sections

### Make Script Executable

```bash
chmod +x scripts/mcp-database-server.mjs
```

### Update MCP Config

```json
{
  "mcpServers": {
    "database": {
      "command": "node",
      "args": ["./scripts/mcp-database-server.mjs"],
      "env": {
        "MCP_DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

### Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/lernsaathi_dev"
MCP_DATABASE_URL="postgresql://user:password@localhost:5432/lernsaathi_dev"
```

### Usage Examples

- Verify review count: `verify_reviewCount({ userId: "abc123" })`
- Verify provisioning: `verify_userProvisioning({ email: "user@example.com" })`
- Count records: `prisma_count({ model: "mistake", where: {...} })`

### Safety Features

- Read-only (no writes)
- Sensitive field redaction
- Query limits (max 100 results)
- Local/dev database only

### Validation

1. Install SDK: `npm install --save-dev @modelcontextprotocol/sdk`
2. Test server: `node scripts/mcp-database-server.mjs`
3. Test with Claude: "How many users are in the database?"
4. Verify redaction works

### Impact

- Time savings: 30 min per evidence check
- Success increase: +8-12% for complex slices
- Enables automated data verification

**See full brief for complete implementation details**
