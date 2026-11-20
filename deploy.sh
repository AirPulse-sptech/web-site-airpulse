#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if [[ $# -gt 1 || ( $# -eq 1 && "$1" != --ec2 ) ]]; then
  echo "Uso: bash deploy.sh [--ec2]" >&2
  exit 2
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Instale o Docker Engine e o plugin Docker Compose antes de executar este script." >&2
  exit 1
fi

compose=(docker compose --env-file .env.compose)

if [[ ${1:-} == --ec2 ]]; then
  metadata=http://169.254.169.254/latest
  if ! token=$(curl --noproxy '*' -fsS --max-time 4 -X PUT "$metadata/api/token" \
    -H 'X-aws-ec2-metadata-token-ttl-seconds: 60') ||
    ! AIRPULSE_DB_BIND_IP=$(curl --noproxy '*' -fsS --max-time 4 \
      -H "X-aws-ec2-metadata-token: $token" "$metadata/meta-data/local-ipv4") ||
    [[ ! $AIRPULSE_DB_BIND_IP =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ || $AIRPULSE_DB_BIND_IP == 0.0.0.0 ]]; then
    echo "Não foi possível descobrir o IPv4 privado da EC2. Confira se o IMDSv2 está acessível." >&2
    exit 1
  fi

  export AIRPULSE_DB_BIND_IP
  compose+=(-f compose.yaml -f compose.ec2.yaml)
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

"${compose[@]}" config --quiet
"${compose[@]}" up -d
"${compose[@]}" ps

if [[ ${1:-} == --ec2 ]]; then
  printf 'Conexão MySQL da Lambda: DB_HOST=%s DB_PORT=3306\n' "$AIRPULSE_DB_BIND_IP"
fi
