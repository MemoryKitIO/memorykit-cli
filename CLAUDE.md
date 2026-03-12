# MemoryKit CLI

Official CLI for MemoryKit — memory infrastructure for AI applications.

## Stack

- TypeScript, ESM, Node 18+
- oclif v4 (command framework)
- @inquirer/prompts (interactive input)
- memorykit npm package (Public API SDK)
- vitest (testing)

## Architecture

### Two API Clients

1. **DashboardClient** (`src/lib/dashboard-client.ts`) — for `/api/v1/*` (JWT auth)
   - Auth: register, verify, login, refresh
   - Companies, projects, API keys CRUD
2. **MemoryKit SDK** (npm `memorykit`) — for `/v1/*` (API Key auth)
   - Memories CRUD, search, upload, users, webhooks, status, feedback

### Config Storage: `~/.memorykit/`

- `config.json` — baseUrl, defaultProfile
- `credentials.json` — profiles with JWT tokens and API keys (permissions 0o600)
- Override with `MEMORYKIT_CONFIG_DIR` env var

### Dual Mode

- `--json` flag → structured JSON output `{ ok, data/error }`
- Without `--json` → interactive prompts, spinners, tables
- No TTY + missing flags → error with flag name

## Conventions

- All commands extend `BaseCommand` (provides `--json`, `--profile` flags)
- Commands use `promptIfMissing()` to auto-skip prompts when flags are provided
- Dashboard API types defined in `src/lib/types.ts` (snake_case, matching Backend)
- SDK types imported from `memorykit` package (camelCase)
- Topic separator is space, not colon: `memorykit auth login`
- Error output goes to stderr, data to stdout

## Commands

```
memorykit init                     # Full setup wizard
memorykit auth register|verify|login|logout
memorykit company create|list
memorykit project create|list
memorykit apikey create|list|revoke
memorykit memories create|list|get|update|delete|search|upload
memorykit status
memorykit config set|get|list
```

## Dev

```bash
npm install
npm run build
./bin/dev.js --help        # Run in dev mode
npm test                   # Run tests
```
