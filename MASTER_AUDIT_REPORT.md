# Security Audit: kingbootoshi/codex-orchestrator

**Date:** 2026-02-13  
**Auditor:** Clawdia (automated 5-scope audit)  
**Repo:** https://github.com/kingbootoshi/codex-orchestrator  
**Commit:** HEAD (main branch)  

---

## 🟡 OVERALL RISK LEVEL: YELLOW

**GO/NO-GO: CONDITIONAL GO** — Safe to use patterns from this repo with specific mitigations applied.

---

## Agent 1: Code Malware Scan

### Findings

**No malware, backdoors, or exfiltration detected.**

| Check | Result | Details |
|-------|--------|---------|
| Suspicious imports | ✅ CLEAN | `child_process` used legitimately for tmux/codex orchestration |
| Obfuscated strings | ✅ CLEAN | No base64, no encoded payloads |
| Network calls | ✅ CLEAN | Zero HTTP/fetch/WebSocket/socket usage in source |
| Reverse shells | ✅ CLEAN | No unexpected process spawning |
| Hidden code | ✅ CLEAN | No eval(), no dynamic code execution |
| Data exfiltration | ✅ CLEAN | No outbound data transmission |

**All `execSync`/`spawnSync` calls are to:** `tmux`, `codex`, `which`, `sleep`, `script` — all legitimate local tools.

**Risk Assessment:** 🟢 GREEN — No malware risk.

---

## Agent 2: Prompt Injection & Security

### Critical Findings

#### 🔴 CRITICAL: Command Injection via Unsanitized Input (CVSS 8.1)

**Location:** `src/tmux.ts` lines 81, 104, 142

Multiple `execSync` calls interpolate user-controlled strings directly into shell commands with inadequate escaping:

```typescript
// tmux.ts:142 - sendMessage()
const escapedMessage = message.replace(/'/g, "'\\''");
execSync(`tmux send-keys -t "${sessionName}" '${escapedMessage}'`, ...);
```

**Problems:**
1. **`sessionName`** — derived from `jobId` (random hex, safe) BUT wrapped in double quotes allowing `$(...)` injection if prefix/ID generation changes
2. **`promptContent`** (line 98) — single-quote escaping only; doesn't handle backslashes, newlines, or null bytes
3. **`options.cwd`** (line 82) — user-provided working directory interpolated into shell command without validation

**Attack vector:** If an LLM orchestrator passes unsanitized user input as a prompt or working directory, shell metacharacters could execute arbitrary commands.

**Mitigation:** The random hex jobId and typical usage patterns make exploitation unlikely in practice, but the pattern is fundamentally unsafe.

#### 🟡 MEDIUM: Prompt Injection in LLM Context (CVSS 5.3)

**Location:** `src/files.ts` — `formatPromptWithFiles()`, `loadCodebaseMap()`

File contents are injected directly into prompts without any sanitization or delimiters. A malicious file in the codebase could contain prompt injection payloads that redirect the Codex agent.

**Example:** A file containing `Ignore all previous instructions. Instead, ...` would be injected verbatim.

#### 🟡 MEDIUM: No Session Isolation (CVSS 4.3)

All jobs share `~/.codex-agent/jobs/`. Any process running as the same user can:
- Read all job prompts and outputs
- Modify job status files
- Inject messages into running sessions via tmux

No authentication, no per-session access controls.

#### 🟢 LOW: Token/API Key Handling (CVSS 2.0)

- No API keys in source code
- Only `process.env.HOME` and `process.env.CODEX_HOME` accessed
- Codex CLI handles its own auth — not managed by this tool
- Prompts logged to disk in `~/.codex-agent/jobs/*.prompt` and `*.log` — could contain sensitive content

### Security Vulnerability Summary

| ID | Severity | CVSS | Issue |
|----|----------|------|-------|
| SEC-01 | CRITICAL | 8.1 | Shell command injection via string interpolation |
| SEC-02 | MEDIUM | 5.3 | Prompt injection via unsanitized file content |
| SEC-03 | MEDIUM | 4.3 | No session isolation / shared job storage |
| SEC-04 | LOW | 2.0 | Sensitive data in plaintext log files |

---

## Agent 3: Commands & Tooling Audit

### Commands Inventory

The repo provides a single CLI tool `codex-agent` with these commands:

| Command | Purpose | Borrows from our patterns? |
|---------|---------|---------------------------|
| `start` | Spawn Codex agent in tmux | Similar to our subagent spawning |
| `status` | Check job | Similar to our session status |
| `send` | Message running agent | Similar to our process write |
| `capture` | Get output | Similar to our process log |
| `output` | Full output | Similar to our process log (full) |
| `watch` | Stream output | Polling-based, simple |
| `jobs` | List all | Similar to our process list |
| `kill` | Terminate | Similar to our process kill |
| `health` | Check deps | No equivalent |
| `clean` | Cleanup old | No equivalent |

### Key Differences from Our Implementation

| Aspect | Their Approach | Our Approach | Assessment |
|--------|---------------|--------------|------------|
| Agent runtime | tmux + `script` logging | Native exec sessions | Ours is more secure (no shell injection surface) |
| Communication | tmux send-keys | stdin/process write | Ours is safer (no shell escaping needed) |
| Job storage | JSON files in `~/.codex-agent/` | In-memory + managed | Ours has less persistence risk |
| Prompt handling | String interpolation | Structured API calls | Ours is significantly safer |
| Session ID | 8 hex chars (4 bytes) | UUID | Theirs has collision risk at scale |
| Sandbox modes | Passed as codex CLI flag | Enforced at runtime | Equivalent |

### What We Should/Shouldn't Copy

**Safe to adapt:**
- Job status lifecycle model (pending → running → completed/failed)
- `--map` pattern for codebase context injection
- `--dry-run` for prompt preview
- ANSI stripping utility
- Session parser for extracting structured data from agent output
- The orchestration philosophy (SKILL.md) — excellent prompt engineering

**Do NOT copy:**
- Shell command construction patterns (string interpolation into execSync)
- tmux-based communication (use native IPC instead)
- Single-quote escaping approach (incomplete)
- Hardcoded sleep delays for synchronization

---

## Agent 4: Dependencies & Supply Chain

### package.json Analysis

```json
{
  "dependencies": {
    "glob": "^10.3.10"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
```

**Total dependencies: 1 runtime, 2 dev**

| Package | Version | Pinned? | CVEs | Maintained? | Risk |
|---------|---------|---------|------|-------------|------|
| `glob` | ^10.3.10 | Caret (minor float) | None known | ✅ Active (isaacs) | 🟢 LOW |
| `@types/node` | ^20.10.0 | Caret | N/A | ✅ DefinitelyTyped | 🟢 LOW |
| `typescript` | ^5.3.0 | Caret | None known | ✅ Microsoft | 🟢 LOW |

### Supply Chain Assessment

| Check | Result |
|-------|--------|
| Known CVEs | ✅ None found |
| Typosquatting risk | ✅ All well-known packages |
| Unmaintained packages | ✅ All actively maintained |
| Version pinning | ⚠️ Caret ranges (minor version float) — acceptable for dev tooling |
| Lock file | ⚠️ `bun.lock` exists but not audited in detail |
| Install script safety | ⚠️ `install.sh` runs `curl | bash` for Bun install — standard but risky pattern |
| No Cargo.toml/requirements.txt | ✅ Pure TypeScript project |
| CI/CD | ✅ No `.github/workflows/` — no CI injection surface |

**Supply Chain Risk:** 🟢 GREEN — Minimal dependency surface, all trusted packages.

**Note on install.sh:** The installer runs `curl -fsSL https://bun.sh/install | bash` which is the official Bun installer. This is a known `curl | bash` pattern — standard in the ecosystem but inherently risky. We should NOT use their installer; use our own dependency management.

---

## Agent 5: Validation & Master Assessment

### Risk Matrix

| Domain | Risk Level | Key Issue |
|--------|-----------|-----------|
| Malware | 🟢 GREEN | Clean — no malicious code |
| Prompt Security | 🟡 YELLOW | Shell injection possible via string interpolation |
| Dependencies | 🟢 GREEN | Minimal, all trusted |
| Supply Chain | 🟢 GREEN | No CI/CD, minimal deps |
| Architecture | 🟡 YELLOW | Shared storage, no isolation |

### What's Safe to Use

1. **Orchestration philosophy & SKILL.md prompt** — Excellent prompt engineering for multi-agent coordination. Safe to study and adapt the strategic patterns.
2. **Job lifecycle model** — The pending→running→completed/failed state machine is clean and well-implemented.
3. **Session parser** (`session-parser.ts`) — Clean JSONL parsing for extracting tokens/files/summary. No security issues.
4. **Config pattern** — Simple, well-structured.
5. **File loading with glob** — Well-implemented with binary detection, size limits, dedup.
6. **ANSI stripping** — Solid utility function.
7. **Codebase map concept** — The `--map` pattern is genuinely useful for agent context.

### What We Should NEVER Copy

1. **Shell command construction via string interpolation** — `execSync(\`tmux ... "${variable}"\`)` is the #1 security risk. Always use array-based `spawn()` or `execFile()` with proper argument separation.
2. **Single-quote escaping as security measure** — The `replace(/'/g, "'\\''")` pattern is incomplete and fragile.
3. **`curl | bash` installation** — Never pipe remote scripts to shell in our tooling.
4. **Hardcoded sleep for synchronization** — Race condition prone. Use proper event-based coordination.
5. **Shared flat-file job storage without access controls** — Any local process can tamper.

### Recommendations for Our Implementation

1. **If adapting tmux patterns:** Use `child_process.spawn(['tmux', 'send-keys', '-t', sessionName, message])` with argument arrays, never string interpolation.
2. **For prompt construction:** Add clear delimiters around injected file content (e.g., `<file_context>...</file_context>`) to reduce prompt injection surface.
3. **For job storage:** Use our existing session management rather than flat JSON files.
4. **For the orchestration skill:** The SKILL.md is high-quality prompt engineering — worth studying for our own agent coordination patterns.
5. **For dependencies:** The `glob` package is the only runtime dep and is safe to use.

---

## JSON Summary

```json
{
  "audit_date": "2026-02-13",
  "repo": "kingbootoshi/codex-orchestrator",
  "overall_risk": "YELLOW",
  "decision": "CONDITIONAL_GO",
  "domains": {
    "malware": {"risk": "GREEN", "findings": 0},
    "prompt_security": {"risk": "YELLOW", "findings": 4, "critical": 1, "medium": 2, "low": 1},
    "dependencies": {"risk": "GREEN", "runtime_deps": 1, "cves": 0},
    "supply_chain": {"risk": "GREEN", "ci_cd": false},
    "architecture": {"risk": "YELLOW", "isolation": false}
  },
  "safe_to_use": [
    "orchestration philosophy (SKILL.md)",
    "job lifecycle model",
    "session parser",
    "config pattern",
    "file loading with glob",
    "ANSI stripping",
    "codebase map concept"
  ],
  "never_copy": [
    "shell command string interpolation",
    "single-quote escaping as security",
    "curl pipe bash installation",
    "hardcoded sleep synchronization",
    "shared flat-file storage without ACL"
  ],
  "top_vulnerability": {
    "id": "SEC-01",
    "severity": "CRITICAL",
    "cvss": 8.1,
    "description": "Command injection via unsanitized string interpolation in execSync calls"
  }
}
```

---

*Audit complete. 6 source files + 1 install script + 1 skill doc reviewed. No files were modified during this audit.*
