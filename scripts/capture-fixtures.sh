#!/usr/bin/env bash
# Refresh test fixtures by capturing real OS output.
# Run on the matching OS; commits to test/fixtures/<platform>/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OS="$(uname -s)"

case "$OS" in
  Darwin)
    DEST="$ROOT/test/fixtures/mac"
    mkdir -p "$DEST"
    lsof -iTCP -sTCP:LISTEN -P -n > "$DEST/lsof-listening.txt" || true
    echo "captured: $DEST/lsof-listening.txt"
    ;;
  Linux)
    DEST="$ROOT/test/fixtures/linux"
    mkdir -p "$DEST"
    ss -tlnp > "$DEST/ss-listening.txt" || true
    echo "captured: $DEST/ss-listening.txt"
    ;;
  MINGW*|CYGWIN*|MSYS*)
    DEST="$ROOT/test/fixtures/windows"
    mkdir -p "$DEST"
    netstat -ano > "$DEST/netstat-ano.txt" || true
    echo "captured: $DEST/netstat-ano.txt"
    ;;
  *)
    echo "unsupported OS: $OS" >&2
    exit 1
    ;;
esac
