# codex-swarm Integration — Module Isolation Enforcement

## Core Enforcement

The `codex-swarm` CLI now enforces [[tools/Codex-Module-Isolation]] and [[tools/Codex-Validation-Agent]] patterns.

---

## Pre-Execution: Declaration Validation

Before spawning parallel agents, codex-swarm validates the **task declaration**:

```bash
codex-swarm parallel \
  --validate-declarations \
  --declarations task-spec.json \
  < tasks >
```

**Validation checks:**
- ✅ No two agents claim the same file
- ✅ All declared exports exist
- ✅ All imports reference existing exports
- ✅ No circular dependencies (acyclic graph)
- ✅ Dependency order is topologically sortable

**If validation fails:**
```
ERROR: Module isolation violation detected

Agent 1 (auth) claims: auth/__init__.py, auth/models.py
Agent 2 (api) claims: api/__init__.py, api/routes.py
Agent 4 (security) claims: security/__init__.py, security/validators.py

CONFLICT: Agent 1 and Agent 4 both claim auth/__init__.py
  - Agent 1 creates: auth/__init__.py
  - Agent 4 writes to: auth/__init__.py (importing from it)

FIX: Agent 4 should only READ auth/__init__.py, not WRITE to it.
Update task declaration and re-run.

Exit: 1
```

---

## Execution: File Locks & Isolation

During parallel execution, codex-swarm enforces **exclusive write access**:

```bash
# Each agent gets a lock on its module
Agent 1 (auth/):      WRITE lock on auth/**
Agent 2 (api/):       WRITE lock on api/**
Agent 3 (integration/): WRITE lock on integration/**
Agent 4 (security/):   WRITE lock on security/**
Agent 5 (docs/):       WRITE lock on docs/**

# Shared read-only files
Locked files (read-only):
  - main.py
  - requirements.txt
  - setup.py
  - .gitignore
  - config.json
```

**If an agent tries to break isolation:**

```
Agent 2 (api) attempted write to: auth/handlers.py
ERROR: File owned by Agent 1 (auth)
  Agent 2 can READ auth/ but cannot WRITE
  
Attempted operation:
  - File: auth/handlers.py
  - Operation: write
  - Agent: Agent 2 (api)
  - Owner: Agent 1 (auth)

FIX: If you need to modify auth/, update Agent 1's task instead.

Terminating Agent 2...
Exit: 1
```

---

## Task Specification Format

Each parallel task must declare:

```json
{
  "agents": [
    {
      "id": "agent-1",
      "label": "auth-module",
      "task": "Implement auth/ module with User, Session, Token models. ...",
      "module": {
        "name": "auth",
        "path": "auth/",
        "files": [
          "auth/__init__.py",
          "auth/models.py",
          "auth/handlers.py",
          "auth/tests/test_auth.py"
        ]
      },
      "exports": [
        {
          "name": "authenticate",
          "type": "function",
          "signature": "authenticate(user: str, password: str) -> User"
        },
        {
          "name": "verify_token",
          "type": "function",
          "signature": "verify_token(token: str) -> bool"
        },
        {
          "name": "User",
          "type": "class",
          "methods": ["__init__", "validate", "to_dict"]
        }
      ],
      "imports": [],
      "dependents": ["agent-2", "agent-4"],
      "timeout_seconds": 60
    },
    {
      "id": "agent-2",
      "label": "api-routes",
      "task": "Implement api/ routes using auth/ exports. ...",
      "module": {
        "name": "api",
        "path": "api/",
        "files": [
          "api/__init__.py",
          "api/routes.py",
          "api/schemas.py",
          "api/tests/test_routes.py"
        ]
      },
      "exports": [
        {
          "name": "app",
          "type": "object",
          "description": "FastAPI application instance"
        },
        {
          "name": "UserSchema",
          "type": "class",
          "description": "Pydantic schema for user"
        }
      ],
      "imports": [
        {
          "from_module": "auth",
          "items": ["authenticate", "verify_token"]
        }
      ],
      "depends_on": ["agent-1"],
      "timeout_seconds": 60
    },
    {
      "id": "agent-5",
      "label": "documentation",
      "task": "Write documentation (README, API docs, architecture).",
      "module": {
        "name": "docs",
        "path": "docs/",
        "files": [
          "docs/README.md",
          "docs/API.md",
          "docs/ARCHITECTURE.md",
          "docs/SETUP.md"
        ]
      },
      "exports": [],
      "imports": ["auth", "api", "integration", "security"],
      "depends_on": ["agent-1", "agent-2", "agent-3", "agent-4"],
      "timeout_seconds": 30
    }
  ],
  "validation": {
    "run_tests": true,
    "check_imports": true,
    "detect_orphans": true,
    "security_scan": true,
    "documentation_check": true
  },
  "output": {
    "format": "markdown+json",
    "include_manifest": true,
    "include_orphan_report": true
  }
}
```

---

## CLI Commands (Enforcement)

### 1. Pre-Validate Declarations

```bash
codex-swarm validate-declarations \
  --spec task-spec.json \
  --project-root ./project
```

**Output:**
```
✅ Declaration validation passed

Agents: 5
Files: 18 total
- Agent 1: 4 files (auth/)
- Agent 2: 4 files (api/)
- Agent 3: 2 files (integration/)
- Agent 4: 3 files (security/)
- Agent 5: 4 files (docs/)

Dependency graph (acyclic):
  agent-1 (auth) → no dependencies
  agent-2 (api) → depends on agent-1
  agent-3 (integration) → depends on agent-2
  agent-4 (security) → depends on agent-1, agent-2
  agent-5 (docs) → depends on all

Exports verified:
  agent-1: 3 exports (authenticate, verify_token, User)
  agent-2: 2 exports (app, UserSchema)
  agent-3: 2 exports (ExternalServiceConnector, sync_data)
  agent-4: 3 exports (audit_log, validate_input, enforce_policy)
  agent-5: 0 exports (documentation only)

Imports verified:
  agent-2 imports from agent-1: ✅ all exist
  agent-3 imports from agent-2: ✅ all exist
  agent-4 imports from agent-1, agent-2: ✅ all exist
  agent-5 reads from all: ✅ OK

No conflicts detected. Ready to spawn.
```

### 2. Spawn with Enforcement

```bash
codex-swarm parallel \
  --spec task-spec.json \
  --isolate-modules \
  --enforce-locks \
  --validate-final \
  --wait
```

**During execution:**
```
[15:45:23] Starting parallel execution (5 agents)
[15:45:23] Agent 1 (auth) starting → PID 8432, lock auth/
[15:45:23] Agent 2 (api) starting → PID 8433, lock api/
[15:45:23] Agent 3 (integration) starting → PID 8434, lock integration/
[15:45:23] Agent 4 (security) starting → PID 8435, lock security/
[15:45:23] Agent 5 (docs) starting → PID 8436, lock docs/

[15:46:02] Agent 1 completed (359 tokens) → auth/ generated
[15:46:15] Agent 2 completed (412 tokens) → api/ generated
[15:46:28] Agent 3 completed (287 tokens) → integration/ generated
[15:46:45] Agent 4 completed (401 tokens) → security/ generated
[15:47:12] Agent 5 completed (198 tokens) → docs/ generated

[15:47:13] All agents completed. Starting validation...
```

### 3. Validation Phase (Automatic)

```bash
codex-swarm validate \
  --modules ./project \
  --spec task-spec.json \
  --report-format markdown+json \
  --output validation-report.md
```

**Validation runs:**
- ✅ Import resolution check
- ✅ Function/class definition scan
- ✅ Orphaned code detection
- ✅ Test execution (pytest, unittest, etc.)
- ✅ Security scanning (hardcoded secrets, unsafe patterns)
- ✅ Documentation completeness
- ✅ Type hints validation (if applicable)

**Output Example:**
```
# Validation Report: 2026-02-13T15:47:45Z

## Status: ❌ FAILED (issues found)

### Summary
- Agents completed: 5/5 ✅
- Import resolution: 14/15 ⚠️ (1 missing)
- Test pass rate: 26/27 ⚠️ (1 failure)
- Orphaned functions: 1 ❌
- Security issues: 0 ✅
- Documentation: 95% ✅

### Critical Issues (BLOCK MERGE)
1. **Missing import**: agent-2 (api/routes.py:42) imports from agent-1 but expects `hash_password()` which is not exported
   - Fix: Add `hash_password` to agent-1 exports

### Warnings (REVIEW)
1. **Unused function**: agent-4 (security/validators.py:128) defines `old_validation_v1()` but it's never called
2. **Test failure**: agent-3 (integration/tests/test_connectors.py:15) - timeout in external API call
3. **Low coverage**: agent-4 has 45% test coverage (below 70% threshold)

### Info
- All agents produced expected file count
- No circular dependencies detected
- All docstrings present and formatted correctly

### Recommendations
1. Agent 1: Add `hash_password()` to __init__.py exports
2. Agent 4: Delete unused `old_validation_v1()` function
3. Agent 3: Add timeout handling to external API calls
4. Agent 4: Write additional tests for security module

### Change Manifest
[Detailed manifest of all changes, organized by agent]

## Next Steps
1. Fix critical import issue (agent-1 re-run)
2. Address warnings (optional, but recommended)
3. Re-validate
4. Merge when all critical issues resolved
```

---

## Enforcement Rules (Hard Coded)

### Rule 1: No Cross-Module Writes
```bash
if agent_writes_to_file(agent_id, file_path):
  if not file_path.startswith(agent_module_path[agent_id]):
    ERROR("File ownership violation")
    exit(1)
```

### Rule 2: Dependency Acyclic
```bash
if has_cycle(dependency_graph):
  ERROR("Circular dependency detected")
  print_cycle()
  exit(1)
```

### Rule 3: Validation Always Runs
```bash
if --validate-final or --validate-post:
  run_validation_agent()
  if critical_issues:
    exit(1)  # Don't merge
  elif warnings:
    prompt_user("Warnings found. Continue? [Y/n]")
```

### Rule 4: No Orphan Exports
```bash
# After validation, if exports declared but never used:
for export in declared_exports:
  if not used_anywhere(export):
    WARNING(f"{export} never used")
```

---

## Full Workflow (End-to-End)

```bash
# Step 1: Write task declaration
cat > tasks.json << 'EOF'
{
  "agents": [
    {
      "id": "agent-1",
      "task": "Implement auth module...",
      "module": { "name": "auth", "path": "auth/" },
      "exports": ["authenticate", "verify_token", "User"],
      "imports": []
    },
    ...
  ]
}
EOF

# Step 2: Validate declarations
codex-swarm validate-declarations --spec tasks.json
# Output: ✅ All checks passed

# Step 3: Spawn parallel agents (with enforcement)
codex-swarm parallel \
  --spec tasks.json \
  --isolate-modules \
  --enforce-locks \
  --validate-final \
  --wait
# Output: [agents running...] → [validation running...] → PASS/FAIL

# Step 4: If PASS → Merge
git add .
git commit -m "Multi-agent parallel execution: $(date)"

# If FAIL → Review issues
cat validation-report.md  # Review recommendations
# Fix identified issues
# Re-run specific agents (optional)
```

---

## Error Handling

### File Lock Violation
```
ERROR: File lock violation
Agent 2 (api) attempted write to auth/models.py
File is owned by Agent 1 (auth) and is locked during execution

Stack trace:
  codex-swarm/parallel.ts:234
  Agent 2 callback, write to auth/models.py
  
Remediation:
1. Review Agent 2's task — does it need to modify auth/?
2. If yes, update Agent 1's task to create the file
3. Re-run validation
4. Re-spawn agents
```

### Circular Dependency
```
ERROR: Circular dependency detected
Dependency graph has cycle:
  agent-1 (auth) → agent-2 (api)
  agent-2 (api) → agent-3 (integration)
  agent-3 (integration) → agent-1 (auth)  ← Cycle!

FIX: Break the cycle by refactoring imports
  Option A: Move common code to shared module
  Option B: Reorganize module boundaries
  Option C: Use dependency injection instead of imports
  
Re-run validation after fixing.
```

### Missing Export
```
ERROR: Import resolution failed
Agent 2 (api) imports `hash_password` from agent-1 (auth)
But agent-1 does not export `hash_password`

Agent 1 exports: authenticate, verify_token, User
Agent 2 imports: authenticate, verify_token, hash_password ← NOT FOUND

FIX:
1. Agent 1: Add hash_password function and declare in exports
2. Re-run validation
3. Re-spawn Agent 1 (or both agents)
```

---

## Success Example

```bash
$ codex-swarm parallel \
  --spec nig-gabets-launch.json \
  --isolate-modules \
  --validate-final \
  --wait

[14:32:10] Starting 5-agent parallel execution
[14:32:10] Validation: declarations... ✅
[14:32:10] Agent 1 (viral-hooks) starting
[14:32:10] Agent 2 (brand-assets) starting
[14:32:10] Agent 3 (social-automation) starting
[14:32:10] Agent 4 (analytics-setup) starting
[14:32:10] Agent 5 (launch-docs) starting

[14:35:45] All agents completed
[14:35:45] Running validation...
[14:36:02] Validation complete ✅

VALIDATION RESULTS
✅ Status: PASS (all checks green)
✅ Imports: 12/12 resolved
✅ Tests: 34/34 passed
✅ Orphans: 0 detected
✅ Security: 0 issues
✅ Documentation: 100% complete

CHANGE MANIFEST
- viral-hooks/: 3 files, 412 lines
- brand-assets/: 5 files, 1203 lines
- social-automation/: 4 files, 856 lines
- analytics-setup/: 3 files, 634 lines
- launch-docs/: 4 files, 2100 lines

Ready to merge. Total execution: 4m 52s
```

---

## Integration with Opus Orchestrator

When Opus spawns parallel Codex agents:

```python
# Opus decides multi-agent task needed
result = sessions_spawn(
  task="NiggaBets launch: hooks + assets + automation + analytics + docs",
  label="niggabets-parallel-launch",
  model="openai-codex/gpt-5.3-codex",
  payload={
    "approach": "codex-swarm",
    "agents": 5,
    "isolation": "module",
    "validation": "required",
    "specification_file": "nig-gabets-launch.json"
  }
)

# Internally executes:
# codex-swarm parallel \
#   --spec nig-gabets-launch.json \
#   --isolate-modules \
#   --validate-final

# Returns to Opus with validation report
# Opus synthesizes: "Launch ready" or "Fix issues first"
# Delivers to Telegram
```

---

## You Can Now

✅ Spawn 5 agents with **zero merge conflicts**  
✅ Auto-validate **imports + exports + tests**  
✅ Detect **orphaned code** automatically  
✅ Block merge on **critical issues**  
✅ Get **detailed change manifests**  
✅ Integrate seamlessly with **Opus Orchestrator**  

All enforced at the CLI level. No manual coordination needed. 🚀
