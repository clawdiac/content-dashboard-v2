#!/bin/bash
# Autonomous Clawdia GitHub commit script
# Commits improvements, optimizations, and agent flows

cd /Users/clawdia/.openclaw/workspace

# Load environment
source .env

# Configure git
git config user.email "kkclawdmac@gmail.com"
git config user.name "Clawdia"

# Stage changes (MEMORY.md, agent flows, improvements)
git add MEMORY.md SOUL.md AGENTS.md tools/ decisions/ references/ memory/ 2>/dev/null

# Check if there are changes
if ! git diff --cached --quiet; then
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
  git commit -m "🤖 Autonomous update: improvements, optimizations, agent flows [$TIMESTAMP]"
  
  # Push to GitHub
  git push -u origin main 2>&1 || git push -u origin master 2>&1
  
  echo "✅ Commit pushed at $TIMESTAMP"
else
  echo "ℹ️  No changes to commit at $(date '+%Y-%m-%d %H:%M:%S')"
fi
