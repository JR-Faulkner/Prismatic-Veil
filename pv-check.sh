#!/usr/bin/env bash
# Prismatic Veil — pre-commit sanity check
# Catches: JS syntax errors, duplicate top-level data tables, unresolved merge markers.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INDEX="$SCRIPT_DIR/index.html"
JS_TMP="$(mktemp /tmp/pv_check_XXXXXX.js)"
trap "rm -f '$JS_TMP'" EXIT

# ── 1. Extract inline game JS ──
awk '/<script>/{p=1;next} /<\/script>/{p=0} p' "$INDEX" > "$JS_TMP"

if [ ! -s "$JS_TMP" ]; then
  echo "ERROR: could not extract JS from index.html" >&2
  exit 1
fi

# ── 2. Syntax check (also catches duplicate const in same scope) ──
echo "→ JS syntax check..."
if ! node --check "$JS_TMP" 2>&1; then
  echo "FAIL: syntax error in index.html JS" >&2
  exit 1
fi
echo "  ✓ syntax OK"

# ── 3. Duplicate top-level data table declarations ──
# Only checks known global consts that must appear exactly once.
echo "→ Duplicate top-level const check..."
TABLES="SPRITE_PATHS CHARACTER_ANIM_SETS CHARACTER_ANIM_RATES CHARACTER_SPRITE_TUNING CHARACTER_BODY_TUNING CHARACTER_DATA CHARACTER_TRAITS HERO_UI_THEMES WEAPON_DEFS EVOLUTION_DEFS"
FAILED=0
for TABLE in $TABLES; do
  COUNT=$(grep -c "^const ${TABLE} " "$JS_TMP" || true)
  if [ "$COUNT" -gt 1 ]; then
    echo "  FAIL: 'const $TABLE' declared $COUNT times" >&2
    FAILED=1
  fi
done
if [ "$FAILED" -eq 1 ]; then exit 1; fi
echo "  ✓ no duplicate data tables"

# ── 4. Unresolved merge conflict markers ──
echo "→ Merge conflict markers..."
if grep -qP '^(<<<<<<<|=======|>>>>>>>)' "$INDEX"; then
  echo "FAIL: unresolved merge conflict markers in index.html" >&2
  exit 1
fi
echo "  ✓ no conflict markers"

echo ""
echo "✓ All checks passed — safe to commit."
