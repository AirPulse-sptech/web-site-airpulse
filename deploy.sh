#!/bin/bash
set -e

cd "$(dirname "$0")"
trap 'rm -f "$ENV_FILE"' EXIT   

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
COMPOSE_FILE="docker-compose.yml"

echo "== Credenciais do deploy AirPulse =="
read -p "DB_USER: " DB_USER
read -s -p "DB_PASSWORD: " DB_PASSWORD; echo
read -s -p "GEMINI_API_KEY: " GEMINI_API_KEY; echo
read -p "aws_access_key_id: " AWS_ACCESS_KEY_ID
read -s -p "aws_secret_access_key: " AWS_SECRET_ACCESS_KEY; echo
read -s -p "aws_session_token: " AWS_SESSION_TOKEN; echo

cat > "$ENV_FILE" <<EOF
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
GEMINI_API_KEY=$GEMINI_API_KEY
aws_access_key_id=$AWS_ACCESS_KEY_ID
aws_secret_access_key=$AWS_SECRET_ACCESS_KEY
aws_session_token=$AWS_SESSION_TOKEN
EOF
chmod 600 "$ENV_FILE"

echo "== Garantindo pasta remota =="
ssh "$EC2_HOST" "mkdir -p $EC2_PATH/src/database"

echo "== Enviando compose + sql + credenciais para a EC2 =="
scp "$COMPOSE_FILE" "$ENV_FILE" "$EC2_HOST:$EC2_PATH/"
scp "$SQL_FILE" "$EC2_HOST:$EC2_PATH/$SQL_FILE"

if [ "$RESET_DB" = "--reset-db" ]; then
  read -p "Isso APAGA o banco da EC2. Digite 'apagar' para confirmar: " CONF
  [ "$CONF" = "apagar" ] || { echo "Cancelado."; exit 1; }
  ssh "$EC2_HOST" "cd $EC2_PATH && docker compose --env-file $ENV_FILE down || true; docker volume rm mysql_volume || true"
fi

echo "== Criando network/volume (se não existirem) + pull + subida do compose =="
ssh "$EC2_HOST" "docker network create airpulse_net 2>/dev/null; docker volume create mysql_volume 2>/dev/null; cd $EC2_PATH && docker pull $IMAGE && docker compose --env-file $ENV_FILE up -d && rm -f $ENV_FILE"


rm -f "$ENV_FILE"
echo "== Deploy concluído =="
