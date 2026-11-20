#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if ! docker compose version >/dev/null 2>&1; then
  echo "Instale o Docker Engine e o plugin Docker Compose antes de executar este script." >&2
  exit 1
fi

if [[ ! -f .env.compose ]]; then
  umask 077
  credentials=$(mktemp .env.compose.XXXXXX)
  trap 'rm -f -- "$credentials"' EXIT
  {
    printf '%s\n' 'AIRPULSE_DB_PASSWORD=teste1234'
    printf 'AIRPULSE_MYSQL_ROOT_PASSWORD=%s\n' "$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')"
  } > "$credentials"
  # Publica o arquivo completo sem substituir as credenciais de outra execução.
  if ! ln -T -- "$credentials" .env.compose 2>/dev/null && [[ ! -f .env.compose ]]; then
    echo "Não foi possível criar .env.compose." >&2
    exit 1
  fi
fi

compose=(docker compose --env-file .env.compose)
"${compose[@]}" config --quiet
"${compose[@]}" up -d
"${compose[@]}" ps
