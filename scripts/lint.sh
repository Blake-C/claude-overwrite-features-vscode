#!/bin/bash
#
# Runs ESLint and Prettier inside the hardened lint container (docker/lint).
#
#   bash scripts/lint.sh               eslint + prettier --check, repo mounted read-only
#   bash scripts/lint.sh --write       prettier --write + eslint --fix, repo mounted read-write
#   bash scripts/lint.sh --clean       remove every lint image this project built
#   bash scripts/lint.sh --check-base  compare the pinned Node and Alpine versions against upstream
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
LINT_DIR="$REPO/docker/lint"
COMPOSE_FILE="$LINT_DIR/compose.yml"
DOCKERFILE="$LINT_DIR/Dockerfile"
PROJECT_LABEL="com.digitalblake.project=claude-overwrite-features-vscode"

LINT_TAG="$(sed -n 's/^[[:space:]]*"version": "\([^"]*\)".*/\1/p' "$LINT_DIR/package.json" | head -n1)"
LINT_UID="$(id -u)"
LINT_GID="$(id -g)"
export LINT_TAG LINT_UID LINT_GID

compose() {
	docker compose -f "$COMPOSE_FILE" "$@"
}

ensure_image() {
	if ! docker image inspect "claude-overwrite-features/lint:$LINT_TAG" >/dev/null 2>&1; then
		compose build lint
	fi
}

check_base() {
	local from pinned_digest branch pinned_alpine
	from="$(sed -n 's/^FROM node:\([^ ]*\).*/\1/p' "$DOCKERFILE" | head -n1)"
	pinned_digest="${from##*@}"
	branch="$(printf '%s' "$from" | sed -n 's/.*-alpine\([0-9.]*\)@.*/\1/p')"
	pinned_alpine="$(sed -n 's/^ARG ALPINE_VERSION=//p' "$DOCKERFILE")"

	echo "Pinned: node:${from%%@*} with Alpine $pinned_alpine"
	curl -fsS "https://hub.docker.com/v2/repositories/library/node/tags?page_size=100&ordering=last_updated&name=alpine$branch" |
		python3 -I -c '
import json, re, sys
pinned, branch = sys.argv[1], sys.argv[2]
tags = json.load(sys.stdin)["results"]
lts = next((t for t in tags if t["name"] == "lts-alpine" + branch), None)
if lts is None:
	sys.exit("Docker Hub did not return the lts-alpine" + branch + " tag")
versions = [t["name"] for t in tags if t["digest"] == lts["digest"] and re.fullmatch(r"\d+\.\d+\.\d+-alpine" + re.escape(branch), t["name"])]
print("Docker Hub lts-alpine" + branch + ": " + (versions[0] if versions else "unknown version") + " " + lts["digest"])
print("Node: current" if lts["digest"] == pinned else "Node: BEHIND, update the FROM line")
' "$pinned_digest" "$branch"
	curl -fsS https://alpinelinux.org/releases.json |
		python3 -I -c '
import json, sys
pinned, branch = sys.argv[1], sys.argv[2]
branches = json.load(sys.stdin)["release_branches"]
stable = [b for b in branches if b["rel_branch"] != "edge"]
newest_branch = stable[0]["rel_branch"]
current = next(b for b in branches if b["rel_branch"] == "v" + branch)
newest = current["releases"][0]["version"]
print("Alpine v" + branch + " newest release: " + newest)
print("Alpine: current" if newest == pinned else "Alpine: BEHIND, update ARG ALPINE_VERSION and the FROM line")
if newest_branch != "v" + branch:
	print("Alpine " + newest_branch + " is the newest stable branch")
' "$pinned_alpine" "$branch"
}

case "${1:-}" in
"")
	ensure_image
	compose run --rm lint eslint .
	compose run --rm lint prettier --check .
	;;
--write)
	ensure_image
	compose run --rm format prettier --write .
	compose run --rm format eslint --fix .
	;;
--clean)
	images="$(docker images -q --filter "label=$PROJECT_LABEL" | sort -u)"
	if [ -n "$images" ]; then
		# shellcheck disable=SC2086
		docker image rm $images
	fi
	;;
--check-base)
	check_base
	;;
*)
	echo "Usage: bash scripts/lint.sh [--write | --clean | --check-base]" >&2
	exit 1
	;;
esac
