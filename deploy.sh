#!/bin/bash
set -e

# Deploy do site Node (pull-based): NÃO builda, NÃO faz push, NÃO mexe no git.
# A imagem é construída e publicada apenas pelo build-and-push.sh (mantenedor),
# para que qualquer colega consiga fazer deploy sem ter Docker local.
#
# Uso: ./deploy.sh <ip_publico_ec2> [--reset-db]
#
# NODE_IMAGE_TAG pode ser fixado no .env (padrão: airpulse) para rollback.

cd "$(dirname "$0")"
trap 'rm -f "$ENV_FILE" "$KEY_TMP"' EXIT

if [ -z "$1" ]; then
  echo "Uso: ./deploy.sh <ip_publico_ec2> [--reset-db]"
  exit 1
fi

EC2_HOST="ubuntu@$1"
EC2_PATH="/home/ubuntu/airpulse"
SQL_FILE="src/database/scriptBd.sql"
RESET_DB="$2"
ENV_FILE="deploy.env"
ENV_LOCAL=".env"
COMPOSE_FILE="docker-compose.yml"
KEY_WIN='C:\Users\loure\OneDrive\Documentos\Sptech\SO\key-par.pem'

echo "== Arquivos locais necessários =="
# Deploy é só pull: enviaremos compose + SQL. Nada de git pull, docker build ou push.
for ARQUIVO in "$COMPOSE_FILE" "$SQL_FILE"; do
  [ -f "$ARQUIVO" ] || { echo "Arquivo ausente: $ARQUIVO (clone o repositório completo)." >&2; exit 1; }
done

echo "== Chave SSH =="
if command -v cygpath >/dev/null 2>&1; then
  KEY_SRC=$(cygpath -u "$KEY_WIN")
elif command -v wslpath >/dev/null 2>&1; then
  KEY_SRC=$(wslpath -u "$KEY_WIN")
else
  KEY_SRC="$KEY_WIN"
fi
KEY_SRC="${KEY_PATH:-$KEY_SRC}"
[ -f "$KEY_SRC" ] || { echo "Chave não encontrada: $KEY_SRC" >&2; exit 1; }
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

echo "== Configuração do deploy AirPulse =="
pedir DB_USER
pedir DB_PASSWORD s
pedir GEMINI_API_KEY s
pedir aws_s3_bucketgit 
if [ -z "$aws_s3_bucket" ]; then
  echo "Informe aws_s3_bucket no .env com o nome do bucket Gold." >&2
  exit 1
fi
aws_region=$(ler_env aws_region)
aws_s3_alertas_prefix=$(ler_env aws_s3_alertas_prefix)
JIRA_BASE_URL=$(ler_env JIRA_BASE_URL)
JIRA_EMAIL=$(ler_env JIRA_EMAIL)
JIRA_API_TOKEN=$(ler_env JIRA_API_TOKEN)
JIRA_ALERT_PROJECT_KEY=$(ler_env JIRA_ALERT_PROJECT_KEY)
JIRA_ALERT_ISSUE_TYPE=$(ler_env JIRA_ALERT_ISSUE_TYPE)
NODE_IMAGE_TAG=$(ler_env NODE_IMAGE_TAG)

cat > "$ENV_FILE" <<EOF
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
GEMINI_API_KEY=$GEMINI_API_KEY
aws_s3_bucket=$aws_s3_bucket
aws_region=${aws_region:-us-east-1}
aws_s3_alertas_prefix=${aws_s3_alertas_prefix:-03-gold/}
JIRA_BASE_URL=$JIRA_BASE_URL
JIRA_EMAIL=$JIRA_EMAIL
JIRA_API_TOKEN=$JIRA_API_TOKEN
JIRA_ALERT_PROJECT_KEY=$JIRA_ALERT_PROJECT_KEY
JIRA_ALERT_ISSUE_TYPE=${JIRA_ALERT_ISSUE_TYPE:-Task}
NODE_IMAGE_TAG=${NODE_IMAGE_TAG:-airpulse}
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

echo "== Criando network/volume (se não existirem) + PULL + subida do node =="
# Só o serviço node (o mysql sobe junto por depends_on).
# O alertas-java é gerenciado pelo deployjava.sh, para não ser recriado
# com variáveis de ambiente diferentes.
ssh "${SSH_OPTS[@]}" "$EC2_HOST" "docker network create airpulse_net 2>/dev/null; docker volume create mysql_volume 2>/dev/null; cd $EC2_PATH && docker compose --env-file $ENV_FILE pull node && docker compose --env-file $ENV_FILE up -d node && rm -f $ENV_FILE" \
  || { echo "ERRO no deploy remoto (código $?)"; exit 1; }


rm -f "$ENV_FILE"
echo "== Deploy concluído =="
