#!/usr/bin/env bash
# One-command setup for the Architect memory service on a fresh Ubuntu 24.04 EC2 instance.
#   curl -fsSL https://raw.githubusercontent.com/mannan-naidu/lyzr-architect-2/claude/jolly-lamport-0pzmql/memory-service/setup.sh | sudo bash
# Asks for your Gemini and Groq keys (input hidden), then prints the URL and token for Vercel.
# Re-run any time to update the code; add RESET_KEYS=1 (… | sudo RESET_KEYS=1 bash) to re-enter the keys.
set -euo pipefail

REPO="https://github.com/mannan-naidu/lyzr-architect-2.git"
BRANCH="${BRANCH:-claude/jolly-lamport-0pzmql}"
DIR=/opt/architect

echo "==> Installing Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Fetching the code"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch -q origin "$BRANCH" && git -C "$DIR" checkout -q -B "$BRANCH" "origin/$BRANCH"
else
  git clone -q --depth 1 --branch "$BRANCH" "$REPO" "$DIR"
fi
cd "$DIR/memory-service"

echo "==> Working out this server's HTTPS address"
TOKEN_IMDS=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
IP=$(curl -fsS -H "X-aws-ec2-metadata-token: $TOKEN_IMDS" http://169.254.169.254/latest/meta-data/public-ipv4)
DOMAIN="${IP//./-}.sslip.io"

ask_keys() {
  # Read from the terminal even when this script is piped from curl. Input is hidden.
  read -rsp "Paste your GEMINI_API_KEY (input hidden), then Enter: " GEMINI < /dev/tty; echo
  read -rsp "Paste your GROQ_API_KEY (input hidden), then Enter: " GROQ < /dev/tty; echo
  GEMINI="$(printf '%s' "$GEMINI" | tr -d '[:space:]')"
  GROQ="$(printf '%s' "$GROQ" | tr -d '[:space:]')"
  case "$GEMINI" in AIza*) echo "    Gemini key looks right (AIza…, ${#GEMINI} chars)";; *) echo "    WARNING: a Gemini API key normally starts with AIza (this one starts with ${GEMINI:0:4}…)";; esac
  case "$GROQ" in gsk_*) echo "    Groq key looks right (gsk_…, ${#GROQ} chars)";; *) echo "    WARNING: a Groq API key normally starts with gsk_ (this one starts with ${GROQ:0:4}…)";; esac
}

check_keys() {
  local g q
  g=$(curl -s -o /dev/null -w "%{http_code}" -H "x-goog-api-key: $1" "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001")
  q=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $2" "https://api.groq.com/openai/v1/models")
  [ "$g" = "200" ] && echo "    Gemini key: accepted by Google" || echo "    Gemini key: REJECTED by Google (HTTP $g). Create a new key at aistudio.google.com and re-run with RESET_KEYS=1."
  [ "$q" = "200" ] && echo "    Groq key: accepted by Groq" || echo "    Groq key: REJECTED by Groq (HTTP $q). Check it at console.groq.com and re-run with RESET_KEYS=1."
}

if [ ! -f .env ]; then
  ask_keys
  SERVICE_TOKEN=$(openssl rand -hex 32)
  umask 077
  cat > .env <<ENV
DOMAIN=$DOMAIN
MEMORY_SERVICE_TOKEN=$SERVICE_TOKEN
GEMINI_API_KEY=$GEMINI
GROQ_API_KEY=$GROQ
COGNIS_LLM_MODEL=groq/openai/gpt-oss-20b
ENV
  check_keys "$GEMINI" "$GROQ"
elif [ "${RESET_KEYS:-0}" = "1" ]; then
  echo "==> Replacing the Gemini and Groq keys (the service token and URL stay the same)"
  ask_keys
  sed -i '/^GEMINI_API_KEY=/d;/^GROQ_API_KEY=/d' .env
  printf 'GEMINI_API_KEY=%s\nGROQ_API_KEY=%s\n' "$GEMINI" "$GROQ" >> .env
  check_keys "$GEMINI" "$GROQ"
fi
sed -i "s/^DOMAIN=.*/DOMAIN=$DOMAIN/" .env

echo "==> Building and starting (first run takes a few minutes)"
docker compose --env-file .env up -d --build --force-recreate

echo "==> Waiting for HTTPS"
for _ in $(seq 1 40); do
  if curl -fsS "https://$DOMAIN/health" >/dev/null 2>&1; then break; fi
  sleep 5
done
curl -fsS "https://$DOMAIN/health" && echo

echo
echo "Done. Add these two variables in Vercel (Settings > Environment Variables), then redeploy:"
echo "  MEMORY_SERVICE_URL=https://$DOMAIN"
echo "  MEMORY_SERVICE_TOKEN=$(grep ^MEMORY_SERVICE_TOKEN= .env | cut -d= -f2)"
