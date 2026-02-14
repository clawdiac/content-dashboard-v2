#!/usr/bin/env bash
# skill-loader.sh — Injects skill role instructions into codex-swarm prompts
# Usage: source this or call: ./skill-loader.sh <skill> <prompt...>

SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

resolve_skill() {
  local skill="$1"
  case "$skill" in
    reviewer)      echo "reviewer.md" ;;
    implementer)   echo "implementer.md" ;;
    qa|qa-validator) echo "qa-validator.md" ;;
    discovery)     echo "discovery.md" ;;
    wiring)        echo "wiring.md" ;;
    *)
      # Try direct file match
      if [[ -f "$SKILLS_DIR/$skill.md" ]]; then
        echo "$skill.md"
      else
        echo ""
      fi
      ;;
  esac
}

inject_skill() {
  local skill="$1"
  shift
  local prompt="$*"
  
  local file
  file=$(resolve_skill "$skill")
  if [[ -z "$file" ]]; then
    echo "ERROR: Unknown skill '$skill'" >&2
    echo "Available: reviewer | implementer | qa | discovery | wiring" >&2
    return 1
  fi
  
  local skill_path="$SKILLS_DIR/$file"
  if [[ ! -f "$skill_path" ]]; then
    echo "ERROR: Skill file not found: $skill_path" >&2
    return 1
  fi
  
  cat "$skill_path"
  echo ""
  echo "---"
  echo ""
  echo "## Task"
  echo ""
  echo "$prompt"
}

# If run directly
if [[ "${BASH_SOURCE[0]:-$0}" == "$0" ]]; then
  if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <skill> <prompt...>"
    echo "Skills: reviewer | implementer | qa | discovery | wiring"
    exit 1
  fi
  inject_skill "$@"
fi
