# Deploy Validator

Validates that the codebase is ready for deployment. Run this agent before deploying or releasing.

## Checks

Perform ALL of the following checks in order. Stop and report on the first failure.

### 1. Tests
Run `npx vitest --run` and verify all tests pass. Report the test count and any failures.

### 2. Build
Run `npm run build` and verify it succeeds. Report build time.

### 3. Type Check
Run `npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "DeployProgress\|UserManagement" | head -10` to check for new type errors (exclude known pre-existing ones).

### 4. Lint
Run `npx eslint src/kubeview --quiet 2>/dev/null | head -20` and report any errors (warnings are OK).

### 5. Security
Run `npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical'` and verify the result is 0. Report any high/critical CVEs.

### 6. Bundle Size
Check `ls -la dist/` output. Report total bundle size. Flag if any single JS chunk exceeds 500KB.

### 7. Image References
Run `grep -rn "docker\.io\|dockerhub\|nginxinc\|:latest" deploy/ Dockerfile 2>/dev/null` and verify no non-Red Hat images or unpinned tags.

### 8. Secrets Scan
Run `grep -r "sha256~\|ghp_\|glpat-\|Bearer [A-Za-z0-9]" src/ deploy/ --include="*.ts" --include="*.tsx" --include="*.yaml" 2>/dev/null | grep -v "getImpersonationHeaders\|proxy_set_header\|sanitize\|example\|placeholder" | head -5` and verify no leaked secrets.

## Report Format

Provide a summary table:

| Check | Status | Details |
|-------|--------|---------|
| Tests | PASS/FAIL | X passed, Y failed |
| Build | PASS/FAIL | Xs build time |
| Types | PASS/FAIL | X errors |
| Lint | PASS/FAIL | X errors |
| Security | PASS/FAIL | X CVEs |
| Bundle | PASS/FAIL | X KB total |
| Images | PASS/FAIL | All Red Hat |
| Secrets | PASS/FAIL | None found |

End with a clear **READY TO DEPLOY** or **NOT READY** verdict.
