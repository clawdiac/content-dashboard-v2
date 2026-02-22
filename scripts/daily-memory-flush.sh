#!/bin/bash
# Daily Memory Flush Master: Orchestrates end-of-day memory operations
# Single source of truth: clawdia-vault/daily/

WORKSPACE="/Users/clawdia/.openclaw/workspace"
VAULT="$WORKSPACE/clawdia-vault"
VAULT_DAILY="$VAULT/daily"
TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)

echo "=========================================="
echo "🔄 Daily Memory Flush: $TIMESTAMP"
echo "=========================================="
echo ""

# 1. Run gap detection
echo "1️⃣  Gap Detection"
bash "$WORKSPACE/scripts/memory-gap-detect.sh" 2>&1 | sed 's/^/   /'
echo ""

# 2. Run session cleanup (capture yesterday's large sessions)
echo "2️⃣  Session Cleanup"
bash "$WORKSPACE/scripts/cron-session-cleanup.sh" 2>&1 | sed 's/^/   /'
echo ""

# 3. Feed QMD vault
echo "3️⃣  QMD Vault Sync"
bash "$WORKSPACE/scripts/qmd-feed-daily.sh" 2>&1 | sed 's/^/   /'
echo ""

# 4. Update MEMORY.md open items (basic check)
echo "4️⃣  Memory Status Check"
MEMORY_FILE="$WORKSPACE/MEMORY.md"
LAST_UPDATE=$(stat -f %Sm -t "%Y-%m-%d %H:%M" "$MEMORY_FILE" 2>/dev/null || stat -c %y "$MEMORY_FILE" 2>/dev/null | cut -d' ' -f1-2)
echo "   Last MEMORY.md update: $LAST_UPDATE"
echo "   Daily vault files: $(ls -1 $VAULT_DAILY/2026-*.md 2>/dev/null | wc -l)"
echo "   Vault location: $VAULT_DAILY"
echo ""

echo "=========================================="
echo "✅ Daily Memory Flush Complete"
echo "=========================================="
