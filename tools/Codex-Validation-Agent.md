# Codex Validation Agent Specification

## Role

After all parallel Codex agents complete, the **Validation Agent** (final Codex instance) runs a comprehensive integration check:

- ✅ Verifies all modules connect correctly
- ✅ Detects orphaned/unused code
- ✅ Reports broken imports and circular dependencies
- ✅ Generates a detailed change manifest
- ✅ Flags security issues or code smells
- ✅ Tests the entire system end-to-end

---

## Inputs

The validator receives:

```
VALIDATION_INPUT:
  - All modules from agents 1-5 (file tree)
  - Declaration document from orchestrator (dependencies, exports, imports)
  - Project requirements.txt (dependencies)
  - Test suite (all tests from each module)
```

---

## Checks (Automated)

### 1. Import Resolution
```
For each file in each module:
  - Parse all imports
  - Verify target module exists
  - Verify target export exists
  - Check for circular imports
  - Detect missing dependencies
```

**Output Format:**
```
✅ auth.models.User imported in api.routes.login → OK
❌ api.schemas.UserSchema imported in security.validators → MODULE NOT FOUND
⚠️  integration.connectors imports from api, which imports from auth → OK (acyclic)
❌ CIRCULAR: auth imports from api imports from auth → ERROR
```

### 2. Function/Class Definitions
```
For each module:
  - List all exported functions/classes
  - List all internal functions/classes (not exported)
  - Find all usages of each function
  - Flag unused functions (orphaned code)
```

**Output Format:**
```
✅ auth.authenticate() - used 3 times (api.routes, security.validators, main.py)
⚠️  auth.hash_password() - used 1 time (only in tests)
❌ api.deprecated_login() - NEVER USED (orphaned)
❌ security.old_validation_v1() - NEVER USED (orphaned)
✅ docs exports README.md - documentation only (OK)
```

### 3. Test Coverage
```
For each module:
  - Run unit tests
  - Collect coverage report
  - Verify critical paths tested
  - Run integration tests across all modules
```

**Output Format:**
```
✅ auth/tests/test_auth.py - PASSED (12/12 tests)
✅ api/tests/test_routes.py - PASSED (8/8 tests)
❌ integration/tests/test_connectors.py - FAILED (3 failures, 5 passed)
  - Failed: test_external_sync (timeout)
  - Failed: test_error_handling (wrong exception type)
  - Failed: test_retry_logic (assertion error)
⚠️  security/tests/test_security.py - PASSED (6/6) but low coverage (45%)
✅ Overall integration test - PASSED
```

### 4. Code Quality Checks
```
For each module:
  - Check for hardcoded secrets (API keys, passwords)
  - Check for unsafe patterns (eval, exec, pickle)
  - Check for SQL injection risks
  - Check for missing error handling
  - Check code style consistency
  - Check type hints (if applicable)
```

**Output Format:**
```
❌ SECURITY: api.routes line 42 - hardcoded API_KEY found
⚠️  UNSAFE: security.validators line 15 - eval() used (replace with ast.literal_eval)
⚠️  MISSING ERROR HANDLING: integration.connectors line 28 - external API call not wrapped
✅ TYPE HINTS: 95% of functions have proper type annotations
✅ CODE STYLE: All PEP 8 compliant
```

### 5. Documentation Completeness
```
For each exported function/class:
  - Check for docstring
  - Check docstring format (Google/NumPy style)
  - Verify parameters documented
  - Verify return type documented
  - Cross-reference with docs/API.md
```

**Output Format:**
```
✅ auth.authenticate() - documented, parameters clear, examples provided
❌ api.get_user_route() - MISSING docstring
⚠️  integration.sync_data() - docstring incomplete (missing return type)
✅ All exported functions documented in docs/API.md
```

---

## Output Artifacts

### 1. Verification Report
```markdown
# Codex Validation Report
Date: 2026-02-13T17:XX:XX
Status: ❌ FAILED (issues found, manual review required)

## Summary
- Agents completed: 5/5 ✅
- Modules created: 5/5 ✅
- Import resolution: 12/14 pass ⚠️
- Test pass rate: 26/27 ✅
- Orphaned functions: 2 ❌
- Security issues: 1 ⚠️
- Documentation: 95% complete

## Issues Found

### Critical (Block Integration)
1. **Circular import**: auth ↔ security
2. **Hardcoded secret**: api/routes.py line 42

### Warnings (Manual Review)
1. **Unused function**: api.deprecated_login()
2. **Low test coverage**: security/ (45%)
3. **Missing error handling**: integration.connectors line 28

### Info (For Future)
1. integration.sync_data() timeout in tests — slow external API?
2. Consider adding type hints to security module

## Recommendations
1. Break circular import: move auth.verify_token to separate module
2. Move API_KEY to environment variable
3. Delete api.deprecated_login() (orphaned)
4. Add integration tests for security module
5. Add timeout handling to external connectors

## Files Modified by Each Agent
- Agent 1: 3 files (auth/)
- Agent 2: 4 files (api/)
- Agent 3: 2 files (integration/)
- Agent 4: 3 files (security/)
- Agent 5: 4 files (docs/)
Total: 16 files

## Change Manifest
[See attached manifest file]

## Next Steps
1. Review issues with team
2. Agent re-run to fix critical issues
3. Re-validate
4. Merge and deploy
```

### 2. Change Manifest
```json
{
  "validation_run": "2026-02-13T17:XX:XX",
  "status": "failed_with_issues",
  "files_created": [
    "auth/__init__.py",
    "auth/models.py",
    "auth/handlers.py",
    "auth/tests/test_auth.py",
    "api/__init__.py",
    "api/routes.py",
    "api/schemas.py",
    "api/tests/test_routes.py",
    "integration/__init__.py",
    "integration/connectors.py",
    "integration/tests/test_connectors.py",
    "security/__init__.py",
    "security/validators.py",
    "security/policies.py",
    "security/tests/test_security.py",
    "docs/README.md",
    "docs/API.md",
    "docs/ARCHITECTURE.md",
    "docs/SETUP.md"
  ],
  "issues": [
    {
      "severity": "critical",
      "type": "circular_import",
      "description": "auth/__init__.py imports from security, security imports from auth",
      "file": "auth/__init__.py",
      "line": 3,
      "fix": "Move verify_token to separate validators module"
    },
    {
      "severity": "critical",
      "type": "hardcoded_secret",
      "description": "API_KEY hardcoded in source",
      "file": "api/routes.py",
      "line": 42,
      "fix": "Use environment variable (os.getenv('API_KEY'))"
    },
    {
      "severity": "warning",
      "type": "orphaned_code",
      "description": "Function never called",
      "file": "api/routes.py",
      "function": "deprecated_login",
      "usage_count": 0,
      "fix": "Remove function or restore usage"
    }
  ],
  "test_results": {
    "passed": 26,
    "failed": 1,
    "coverage": {
      "auth": "95%",
      "api": "88%",
      "integration": "72%",
      "security": "45%",
      "overall": "75%"
    }
  }
}
```

### 3. Orphan Detection Report
```
ORPHANED FUNCTIONS (never called):
- api.deprecated_login() [api/routes.py:52]
- security.old_validation_v1() [security/validators.py:128]

UNUSED IMPORTS:
- api/routes.py imports 'json' but never uses it

UNUSED EXPORTS:
- integration.connectors exports 'debug_mode' but never imported

RECOMMENDATIONS:
- Delete deprecated_login() (confirm with team first)
- Delete old_validation_v1() (confirm with team first)
- Remove unused imports
- Remove unused exports or document why they're exported
```

---

## Validation Agent Prompt

```
You are the Codex Validation Agent.

Your job: After 5 parallel Codex agents complete coding their modules,
verify everything works together. 

You will receive:
1. All modules from agents 1-5 (code files)
2. Dependency declaration (what each agent exports/imports)
3. Test suite (all unit + integration tests)
4. Project structure

Run these checks IN ORDER:
1. Import Resolution — all imports valid?
2. Function Definitions — any orphaned code?
3. Test Execution — all tests pass?
4. Code Quality — security, style, completeness?
5. Documentation — all functions documented?

Generate:
- Verification report (markdown)
- Change manifest (JSON)
- Orphan detection report
- Actionable fix recommendations

If CRITICAL issues found (circular imports, hardcoded secrets, failing tests):
- Flag as "BLOCK INTEGRATION"
- Recommend specific agent re-run
- Suggest fixes

If only WARNINGS (low coverage, unused functions, style issues):
- Flag as "REQUIRES REVIEW"
- Suggest improvements
- OK to integrate (with review)

Be thorough. Be specific. Be actionable.
```

---

## When to Run Validation

**Always run validation after parallel agents complete, BEFORE merging:**

```bash
codex-swarm parallel \
  "task 1" \
  "task 2" \
  "task 3" \
  "task 4" \
  "task 5" \
  --validate-final  # ← Automatically triggers validation
```

**Manual validation:**
```bash
codex-swarm validate \
  --modules ./project \
  --declarations task-declarations.json \
  --report-format markdown+json
```

---

## Integration with Opus Orchestrator

When Opus spawns 5 parallel Codex agents:

1. **Pre-spawn validation** (Opus checks declarations)
2. **Parallel execution** (5 Codex agents work)
3. **Post-spawn validation** (Validation agent runs)
4. **Results synthesis** (Opus reads validation report)
5. **Status to user** (Telegram: success or issues requiring manual review)

Example Opus → User message:
```
Multi-Agent Coding Task Complete ✅

Status: PASSED with WARNINGS

Modules Created: 5/5
- auth/ ✅
- api/ ✅
- integration/ ✅
- security/ ✅
- docs/ ✅

Tests: 26/27 PASSED ⚠️
- integration/tests/test_connectors.py: 1 failure (timeout)

Issues Found: 2 ⚠️
1. Low test coverage in security/ (45%)
2. Unused function in api.deprecated_login()

Recommendations:
1. Review timeout issue in connectors
2. Investigate security module coverage
3. Delete api.deprecated_login()

Ready to merge? [YES] [REVIEW ISSUES FIRST] [ABORT]
```

---

## Success Criteria

Validation passes if:
- ✅ All imports resolve
- ✅ No circular dependencies
- ✅ No hardcoded secrets or unsafe patterns
- ✅ All tests pass (or failures documented)
- ✅ No critical orphaned code
- ✅ All public functions documented

Validation warns if:
- ⚠️ Low test coverage (<70%)
- ⚠️ Missing error handling
- ⚠️ Code style issues
- ⚠️ Unused functions (low priority)

This ensures Kevin can **deploy with confidence** after validation passes. 👻
