#!/usr/bin/env bash
#
# The gate, with a server it owns.
#
# WHY THIS EXISTS. `npm run gate` began with `next build`, and every browser check after it
# talked to a `next dev` server somebody had started by hand. Both write to .next. So the
# build pulled the ground out from under the server halfway through the run, and checks
# thirty minutes later failed for reasons that had nothing to do with the code — the
# translator vanishing from five routes, most recently, which I twice diagnosed as something
# else entirely.
#
# A check that fails for environmental reasons is worse than no check: it costs the time of
# investigating it, and it teaches whoever is watching that red does not mean broken.
#
# So the sequence is strictly ordered and the server belongs to the run: build first with
# nothing serving, then start a server, then check, then stop.
#
# WHY `next dev` AND NOT `next start`. Serving the built output would be closer to
# production and was the first attempt — and the server died partway through the run, most
# likely on an API route throwing where a production Node process exits rather than
# recovering. Every check in this suite was written against dev, which absorbs a route error
# and keeps serving. Swapping the runtime and the ordering in one go would have meant
# debugging two things at once; the ordering is the bug, so the ordering is what changes.
set -euo pipefail

PORT="${PORT:-3111}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

server=""
cleanup() {
  # The server is this script's, so this script takes it away — leaving one behind is how
  # the next run ends up talking to a stale build.
  if [ -n "$server" ] && kill -0 "$server" 2>/dev/null; then
    kill "$server" 2>/dev/null || true
    wait "$server" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "── building, with nothing serving ──"
npm run check

echo
echo "── starting the app on :$PORT ──"
npx next dev -p "$PORT" >/tmp/dub-gate-server.log 2>&1 &
server=$!

# Ready means answering, not merely started. A check that races the server produces exactly
# the class of failure this script exists to remove.
for _ in $(seq 1 90); do
  if curl -sf -o /dev/null "http://localhost:$PORT/"; then break; fi
  sleep 1
done
if ! curl -sf -o /dev/null "http://localhost:$PORT/"; then
  echo "the server never answered — see /tmp/dub-gate-server.log"
  exit 1
fi

echo
echo "── checks ──"
BASE_URL="http://localhost:$PORT" npm run gate:browser
