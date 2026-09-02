#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
app_bundle="$script_dir/.build/FlambeMenuBar.app"
project_dir=$(cd "$script_dir/../.." && pwd)

if [ -z "${FLAMBE_API_TOKEN:-}" ] && [ -f "$project_dir/.env" ]; then
  set -a
  source "$project_dir/.env"
  set +a
fi

cd "$script_dir"
swift build -c release
binary_dir=$(swift build -c release --show-bin-path)

mkdir -p "$app_bundle/Contents/MacOS"
cp "$binary_dir/FlambeMenuBar" "$app_bundle/Contents/MacOS/FlambeMenuBar"
cp "$script_dir/Info.plist" "$app_bundle/Contents/Info.plist"

open "$app_bundle" --args "$@"
