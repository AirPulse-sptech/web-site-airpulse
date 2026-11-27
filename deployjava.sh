#!/bin/bash
set -e

# Deploy Java (pull-based): não builda na EC2 (evita OOM no t2.micro).
# A imagem é construída localmente e publicada no Docker Hub pelo
# script-java/alertas/airpulse-alertas/build-and-push.sh.
#
# Uso: ./deployjava.sh <ip_publico_ec2> [--run-backfill]
#
# Variável opcional JAVA_IMAGE_TAG fixa uma versão específica da imagem
# (default: latest). Ex.: JAVA_IMAGE_TAG=v20261127-0300-abc1234 ./deployjava.sh 1.2.3.4

cd "$(dirname "$0")"
trap 'rm -f "$ENV_FILE" "$KEY_TMP"' EXIT

if [ -z "$1" ]; then
  echo "Uso: ./deployjava.sh <ip_publico_ec2> [--run-backfill]"
  exit 1
fi

EC2_HOST="ubuntu@$1"
EC2_PATH="/home/ubuntu/airpulse"
RUN_BACKFILL="$2"
# Arquivo próprio do deploy Java — NÃO sobrescreve o deploy.env do Node.
ENV_FILE="deploy-java.env"
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
  local var="$1"
  local secret="$2"
  local valor
  valor=$(ler_env "$var")
  if [ -n "$valor" ]; then
    echo "$var: usando valor do $ENV_LOCAL"
  elif [ "$secret" = "s" ]; then
    read -s -p "$var: " valor; echo
  else
    read -p "$var: " valor
  fi
  printf -v "$var" '%s' "$valor"
}

echo "== Configuração do deploy Java Alertas + Backfill =="
pedir aws_s3_bucket
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
# Lido do .env: sem isso, ${JAVA_IMAGE_TAG:-latest} cairia sempre em latest
# e o rollback por tag não funcionaria.
JAVA_IMAGE_TAG=$(ler_env JAVA_IMAGE_TAG)
AWS_ACCESS_KEY_ID=$(ler_env AWS_ACCESS_KEY_ID)
AWS_SECRET_ACCESS_KEY=$(ler_env AWS_SECRET_ACCESS_KEY)
AWS_SESSION_TOKEN=$(ler_env AWS_SESSION_TOKEN)

cat > "$ENV_FILE" <<EOF
aws_s3_bucket=$aws_s3_bucket
aws_region=${aws_region:-us-east-1}
aws_s3_alertas_prefix=${aws_s3_alertas_prefix:-03-gold/}
JIRA_BASE_URL=$JIRA_BASE_URL
JIRA_EMAIL=$JIRA_EMAIL
JIRA_API_TOKEN=$JIRA_API_TOKEN
JIRA_ALERT_PROJECT_KEY=$JIRA_ALERT_PROJECT_KEY
JIRA_ALERT_ISSUE_TYPE=${JIRA_ALERT_ISSUE_TYPE:-Task}
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN
JAVA_IMAGE_TAG=${JAVA_IMAGE_TAG:-latest}
EOF
chmod 600 "$ENV_FILE"

echo "== Garantindo Docker na EC2 =="
ssh "${SSH_OPTS[@]}" "$EC2_HOST" "(command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1) || { sudo apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-v2 && sudo systemctl enable --now docker; }; sudo usermod -aG docker ubuntu"

echo "== Garantindo pasta remota =="
ssh "${SSH_OPTS[@]}" "$EC2_HOST" "mkdir -p $EC2_PATH"

echo "== Enviando compose atualizado + credenciais do Java =="
# Nada de código-fonte: a imagem vem pronta do Docker Hub.
scp "${SSH_OPTS[@]}" "$COMPOSE_FILE" "$EC2_HOST:$EC2_PATH/"
scp "${SSH_OPTS[@]}" "$ENV_FILE" "$EC2_HOST:$EC2_PATH/"

echo "== Pull da imagem + subida do container alertas-java =="
ssh "${SSH_OPTS[@]}" "$EC2_HOST" "cd $EC2_PATH && docker compose --env-file $ENV_FILE pull alertas-java && docker compose --env-file $ENV_FILE up -d alertas-java" \
  || { echo "ERRO no deploy Java (código $?)"; exit 1; }

if [ "$RUN_BACKFILL" = "--run-backfill" ]; then
  echo "== Aguardando container subir (10s) =="
  sleep 10

  echo "== Executando BACKFILL (uma vez) =="
  # O Dockerfile copia o fat JAR para /app/app.jar (WORKDIR /app).
  # --entrypoint "" bypassa o ENTRYPOINT de produção (school.sptech.Main).
  ssh "${SSH_OPTS[@]}" "$EC2_HOST" "cd $EC2_PATH && docker compose --env-file $ENV_FILE run --rm --entrypoint \"\" alertas-java \
    java -cp /app/app.jar \
    br.com.antigravity.airpulse.alertas.backfill.BackfillMain" \
    || { echo "ERRO no backfill (código $?)"; exit 1; }
  echo "== Backfill concluído =="
fi

echo "== Deploy Java concluído =="