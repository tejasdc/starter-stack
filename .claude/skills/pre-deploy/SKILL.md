---
name: pre-deploy
description: "Pre-deployment checklist before pushing to main or deploying to Render. Scans for dangerous patterns and runs full build+tests."
user_invocable: true
---

# Pre-Deploy Checklist

Run this before pushing to main or deploying to Render.

## Step 1: Scan for dangerous patterns

Run these greps and flag any matches:

```bash
# Temp/admin/debug routes
grep -rn "admin\|/debug\|/temp\|/cleanup" packages/api/src/routes/ --include="*.ts"

# Hardcoded secrets or tokens
grep -rn "sk_live\|sk_test\|Bearer.*[a-zA-Z0-9_]{20}" packages/ --include="*.ts" | grep -v "node_modules\|\.test\.\|tests/"

# Queue names with colons (BullMQ breaks)
grep -rn "new Queue\|new Worker" packages/api/src/ --include="*.ts" | grep ":"

# zod-to-json-schema imports (incompatible with Zod v4)
grep -rn "zod-to-json-schema\|zodToJsonSchema" packages/ --include="*.ts" | grep -v "node_modules"
```

If ANY return matches, STOP and review before proceeding.

## Step 2: Full build pipeline

Run `/run-tests` skill or manually:

```bash
pnpm --filter @starter/shared build
pnpm --filter @starter/api exec tsc --noEmit
pnpm --filter @starter/web exec tsc --noEmit
pnpm --filter @starter/api test
pnpm --filter @starter/web build
```

## Step 3: Validate render.yaml

Verify:
- [ ] Service names match Render dashboard
- [ ] Build commands include shared build before dependent builds
- [ ] Node version matches `.nvmrc` (22+)
- [ ] Environment variables reference correct service names

## Step 4: Git status check

```bash
git status
git diff --stat main...HEAD
```

Verify:
- [ ] No untracked `.env` files or credentials
- [ ] No temporary/debug files being committed

## Step 5: Migration safety (if applicable)

- [ ] Migration is additive (no DROP COLUMN/TABLE)
- [ ] New columns have defaults or are nullable
- [ ] Indexes created CONCURRENTLY on large tables

## Report

| Check | Status | Findings |
|-------|--------|----------|
| Dangerous patterns | PASS/FAIL | List matches |
| Build pipeline | PASS/FAIL | List failures |
| render.yaml | PASS/FAIL | List issues |
| Git status | PASS/FAIL | List concerns |
| Migration safety | PASS/FAIL/N/A | List issues |
