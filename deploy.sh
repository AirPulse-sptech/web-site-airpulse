#!/bin/bash
set -e

cd "$(dirname "$0")"
trap 'rm -f "$ENV_FILE" "$KEY_TMP"' EXIT

if [ -z "$1" ]; then
  echo "Uso: ./deploy.sh <ip_publico_ec2>"
  exit 1
fi


EC2_HOST="ubuntu@$1"
EC2_PATH="/home/ubuntu/airpulse"
SQL_FILE="src/database/scriptBd.sql"
RESET_DB="$2"
IMAGE="mateusloualmeida/airpulse_deploy:airpulse"
ENV_FILE="deploy.env"
ENV_LOCAL=".env"
COMPOSE_FILE="docker-compose.yml"
KEY_WIN='C:\Users\loure\OneDrive\Documentos\Sptech\SO\key-par.pem'

echo "== Chave SSH =="
if command -v cygpath >/dev/null 2>&1; then
  KEY_SRC=$(cygpath -u "$KEY_WIN")
elif command -v wslpath >/dev/null 2>&1; then
  KEY_SRC=$(wslpath -u "$KEY_WIN")
else
  KEY_SRC="$KEY_WIN"
fi
KEY_SRC="${KEY_PATH:-$KEY_SRC}"
[ -f "$KEY_SRC" ] || { echo "Chave não encontrada: $KEY_SRC"; exit 1; }
KEY_TMP=$(mktemp)
cp "$KEY_SRC" "$KEY_TMP"
chmod 600 "$KEY_TMP"
SSH_OPTS=(-i "$KEY_TMP" -o StrictHostKeyChecking=accept-new)

ler_env() {
  [ -f "$ENV_LOCAL" ] || return 0
  grep -E "^[[:space:]]*$1=" "$ENV_LOCAL" | tail -n1 \
    | sed -E "s/^[^=]*=//; s/\r$//; s/^'(.*)'$/\1/; s/^\"(.*)\"$/\1/"
}

pedir() {
  local valor
  valor=$(ler_env "$1")
  if [ -n "$valor" ]; then
    echo "$1: usando valor do $ENV_LOCAL"
  elif [ "$2" = "s" ]; then
    read -s -p "$1: " valor; echo
  else
    read -p "$1: " valor
  fi
  printf -v "$1" '%s' "$valor"
}

echo "== Credenciais do deploy AirPulse =="
pedir DB_USER
pedir DB_PASSWORD s
pedir GEMINI_API_KEY s

cat > "$ENV_FILE" <<EOF
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
GEMINI_API_KEY=$GEMINI_API_KEY
EOF
chmod 600 "$ENV_FILE"

echo "== Garantindo Docker na EC2 (instala via apt se faltar) =="
ssh "${SSH_OPTS[@]}" "$EC2_HOST" "(command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1) || { sudo apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-v2 && sudo systemctl enable --now docker; }; sudo usermod -aG docker ubuntu"

echo "== Garantindo pasta remota =="
ssh "${SSH_OPTS[@]}" "$EC2_HOST" "mkdir -p $EC2_PATH/src/database"

echo "== Enviando compose + sql + credenciais para a EC2 =="
scp "${SSH_OPTS[@]}" "$COMPOSE_FILE" "$ENV_FILE" "$EC2_HOST:$EC2_PATH/"
scp "${SSH_OPTS[@]}" "$SQL_FILE" "$EC2_HOST:$EC2_PATH/$SQL_FILE"

if [ "$RESET_DB" = "--reset-db" ]; then
  read -p "Isso APAGA o banco da EC2. Digite 'apagar' para confirmar: " CONF
  [ "$CONF" = "apagar" ] || { echo "Cancelado."; exit 1; }
  ssh "${SSH_OPTS[@]}" "$EC2_HOST" "cd $EC2_PATH && docker compose --env-file $ENV_FILE down || true; docker volume rm mysql_volume || true"
fi

echo "== Criando network/volume (se não existirem) + pull + subida do compose =="
ssh "${SSH_OPTS[@]}" "$EC2_HOST" "docker network create airpulse_net 2>/dev/null; docker volume create mysql_volume 2>/dev/null; cd $EC2_PATH && docker pull $IMAGE && docker compose --env-file $ENV_FILE up -d && rm -f $ENV_FILE" \
  || { echo "ERRO no deploy remoto (código $?)"; exit 1; }


rm -f "$ENV_FILE"
echo "== Deploy concluído =="