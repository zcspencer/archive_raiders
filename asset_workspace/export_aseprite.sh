#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$SCRIPT_DIR/aesprite/Pixel Art"
OUT_DIR="$SCRIPT_DIR/aesprite/assets"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Source directory not found: $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

exported=0
skipped=0

while IFS= read -r -d '' file; do
  rel_path="${file#"$SRC_DIR"/}"
  rel_dir="$(dirname "$rel_path")"
  base="$(basename "$rel_path" .aseprite)"

  dest_dir="$OUT_DIR"
  if [[ "$rel_dir" != "." ]]; then
    dest_dir="$OUT_DIR/$rel_dir"
  fi
  mkdir -p "$dest_dir"

  dest_file="$dest_dir/$base.png"

  if [[ "$dest_file" -nt "$file" ]]; then
    echo "  skip (up to date): $rel_path"
    ((skipped++))
    continue
  fi

  echo "  export: $rel_path -> ${dest_file#"$OUT_DIR"/}"
  /Users/zach/src/github.com/aseprite/builds/aseprite-release/bin/aseprite -b "$file" --save-as "$dest_file"
  ((exported++))
done < <(find "$SRC_DIR" -name '*.aseprite' -print0 | sort -z)

echo ""
echo "Done. Exported: $exported, Skipped: $skipped"
