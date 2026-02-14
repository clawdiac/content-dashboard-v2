# Codex Module Isolation Framework

## Core Principle

**One agent = one module. No agent touches another agent's files.**

When spawning 5 parallel Codex agents, each gets:
- ✅ Dedicated module/directory
- ✅ Explicit file list (what it can write)
- ✅ Clear API boundaries (how other modules call it)
- ✅ No overlap with other agents

---

## File Structure Template

```
project/
├── auth/                    (Agent 1)
│   ├── __init__.py
│   ├── models.py
│   ├── handlers.py
│   └── tests/
├── api/                     (Agent 2)
│   ├── __init__.py
│   ├── routes.py
│   ├── schemas.py
│   └── tests/
├── integration/             (Agent 3)
│   ├── __init__.py
│   ├── connectors.py
│   └── tests/
├── security/                (Agent 4)
│   ├── __init__.py
│   ├── validators.py
│   ├── policies.py
│   └── tests/
├── docs/                    (Agent 5)
│   ├── README.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── SETUP.md
└── main.py                  (Shared entry point - validated agent only)
```

**Rule: Each agent owns exactly one folder. Period.**

---

## Task Specification Template

When spawning parallel agents, provide EXPLICIT boundaries:

```
codex-swarm parallel \
  "Agent 1: Implement auth/ module with User, Session, Token models. 
   Files: auth/__init__.py, auth/models.py, auth/handlers.py
   Exports: authenticate(user, password), verify_token(token)
   Dependencies: None (foundational module)
   Tests: auth/tests/test_auth.py" \
  
  "Agent 2: Implement api/ routes using auth/ exports.
   Files: api/__init__.py, api/routes.py, api/schemas.py
   Imports: from auth import authenticate, verify_token
   Exports: app (FastAPI instance)
   Dependencies: auth/ (must be complete first)
   Tests: api/tests/test_routes.py" \
  
  "Agent 3: Implement integration/ connectors for external APIs.
   Files: integration/__init__.py, integration/connectors.py
   Imports: from api import app
   Exports: connect_external(service), sync_data(service)
   Dependencies: api/ (must complete first)
   Tests: integration/tests/test_connectors.py" \
  
  "Agent 4: Security hardening - audit, validators, policies.
   Files: security/__init__.py, security/validators.py, security/policies.py
   Imports: from auth import verify_token, from api import app
   Exports: audit_request(req), validate_payload(data)
   Dependencies: auth/, api/ (must complete first)
   Tests: security/tests/test_security.py" \
  
  "Agent 5: Write documentation (README, API docs, architecture).
   Files: docs/README.md, docs/API.md, docs/ARCHITECTURE.md, docs/SETUP.md
   Reads: All modules (for documentation)
   Writes: docs/ only (no code modules)
   Dependencies: All modules (must complete first)
   Tests: None (markdown validation only)" \
  
  --isolate-modules \
  --validate-final \
  --dependency-order
```

---

## Dependency Declaration

**Each agent must declare:**

```
AGENT_1_AUTH:
  MODULE: auth/
  FILES: __init__.py, models.py, handlers.py, tests/test_auth.py
  EXPORTS: authenticate(), verify_token(), create_session()
  IMPORTS: None
  DEPENDS_ON: None
  
AGENT_2_API:
  MODULE: api/
  FILES: __init__.py, routes.py, schemas.py, tests/test_routes.py
  EXPORTS: app (FastAPI), get_user_route(), health_check()
  IMPORTS: auth (authenticate, verify_token)
  DEPENDS_ON: AGENT_1_AUTH

AGENT_3_INTEGRATION:
  MODULE: integration/
  FILES: __init__.py, connectors.py, tests/test_integration.py
  EXPORTS: ExternalServiceConnector, sync_data()
  IMPORTS: api (app)
  DEPENDS_ON: AGENT_2_API
  
AGENT_4_SECURITY:
  MODULE: security/
  FILES: __init__.py, validators.py, policies.py, tests/test_security.py
  EXPORTS: audit_log(), validate_input(), enforce_policy()
  IMPORTS: auth (verify_token), api (app)
  DEPENDS_ON: AGENT_1_AUTH, AGENT_2_API
  
AGENT_5_DOCS:
  MODULE: docs/
  FILES: README.md, API.md, ARCHITECTURE.md, SETUP.md
  EXPORTS: None (documentation only)
  IMPORTS: All modules (for reference)
  DEPENDS_ON: All agents (docs come last)
```

---

## Validation Rules (Pre-Spawn)

Before launching parallel agents, the orchestrator verifies:

- ✅ No two agents claim the same file
- ✅ All declared exports exist in the module
- ✅ All imports reference existing exports from other modules
- ✅ No circular dependencies
- ✅ Dependency order is acyclic (can be topologically sorted)
- ✅ Each agent's task is self-contained

If validation fails → **Stop and ask user to clarify**. Don't spawn conflicts.

---

## Execution Order

If dependencies are declared, orchestrator can:

**Option A: Sequential** (safe but slower)
```
Agent 1 (auth) → complete
Agent 2 (api) → depends on 1, start after 1 done
Agent 3 (integration) → depends on 2, start after 2 done
...
```

**Option B: Parallel with Verification** (faster, recommended)
```
Agent 1 (auth) → start immediately
Agent 2 (api) → start immediately (will import auth stubs if needed)
Agent 3 (integration) → start immediately
Agent 4 (security) → start immediately
Agent 5 (docs) → start immediately

After all complete:
  ↓
[VALIDATION AGENT checks all imports resolve]
  ↓
If issues → Report, don't integrate
If clean → Merge, test, commit
```

**Kevin's choice**: Which order for parallel coding tasks?

---

## Example: Actual Code Isolation

### Agent 1 Task (Auth)
```python
# auth/__init__.py
class User:
    def __init__(self, username, password):
        self.username = username
        self.password = password

def authenticate(user, password):
    # validation logic
    return User(user, password)

def verify_token(token):
    # token validation logic
    return True
```

### Agent 2 Task (API - imports auth)
```python
# api/__init__.py
from auth import authenticate, verify_token
from fastapi import FastAPI

app = FastAPI()

@app.post("/login")
def login(username: str, password: str):
    user = authenticate(username, password)
    return {"token": "..."}

@app.get("/profile")
def get_profile(token: str):
    if verify_token(token):
        return {"profile": "..."}
    return {"error": "unauthorized"}
```

**Agent 2 NEVER touches auth/. Agent 1 NEVER touches api/.**

---

## File Lock During Parallel Execution

During parallel execution, prevent writes to shared files:

```bash
# Locked files (read-only during parallel execution)
- main.py
- requirements.txt
- setup.py
- .gitignore
- README.md (until docs agent)

# Agent-owned files (each agent has exclusive write access)
- auth/** (Agent 1)
- api/** (Agent 2)
- integration/** (Agent 3)
- security/** (Agent 4)
- docs/** (Agent 5)
```

If an agent tries to write to a locked file or another agent's directory → **Validation agent flags it**.

---

## Post-Execution Validation

After all 5 agents complete, before merging:

- ✅ No conflicts in git (each file modified by only one agent)
- ✅ All imports resolve
- ✅ No duplicate definitions
- ✅ All exports used (no orphaned functions)
- ✅ Tests pass for each module
- ✅ Overall integration tests pass

→ Validation agent handles this. See [[tools/Codex-Validation-Agent]].

---

## This Pattern Enables

✅ 5 agents working simultaneously on the same project  
✅ No merge conflicts (by design)  
✅ Clear ownership (each agent owns one folder)  
✅ Explicit dependencies (no surprises)  
✅ Automated validation (zero manual integration work)  

---

## Next: Document This

I need to create:
- `tools/Codex-Validation-Agent.md` — Final verification spec
- `tools/Codex-Parallel-Task-Template.md` — Task specification template
- `decisions/2026-02-13-codex-module-isolation.md` — Design decision

Ready to lock these down?
