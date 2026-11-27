#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== BUILD & PUSH DOCKER HUB (airpulse_deploy) ==="

IMAGE="${NODE_IMAGE:-}"
if [ -z "$IMAGE" ] && [ -f .env ]; then
  IMAGE=$(grep -E '^[[:space:]]*NODE_IMAGE=' .env | tail -n1 \
    | sed -E "s/^[^=]*=//; s/\r$//; s/^'(.*)'$/\1/; s/^\"(.*)\"$/\1/")
fi
: "${IMAGE:?Defina NODE_IMAGE no .env com o repositorio da imagem Node.}"

echo "[1/4] Verificando alterações locais em app.js/src/public"
# Deploy é pull-based: a imagem publicada deve refletir o código COMITADO.
# --numstat + -w: diferenças só de espaço/quebra de linha (CRLF) dão 0/0 e são
# ignoradas; só aparecem mudanças com efeito real no código.
ALTERACOES=$(git diff -w --numstat -- app.js src public package.json 2>/dev/null \
  | awk '$1 > 0 || $2 > 0 { print $3 }' || true)
if [ -n "$ALTERACOES" ] && [ "${ALLOW_LOCAL_CHANGES:-0}" != "1" ]; then
  echo ""
  echo "Há alterações NÃO commitadas com efeito real em app.js/src/public/package.json:"
  echo "$ALTERACOES"
  echo "    Commite-as, ou rode com ALLOW_LOCAL_CHANGES=1 se forem intencionais."
  exit 1
fi
echo "    OK (sem mudanças funcionais não commitadas)"

echo "[2/4] docker build (Node 20)"
DATA=$(date +%Y%m%d-%H%M)
GIT_SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "")
if [ -n "$GIT_SHORT" ]; then
  TAG="v${DATA}-${GIT_SHORT}"
else
  TAG="v${DATA}"
fi
docker build -t "${IMAGE}:${TAG}" -t "${IMAGE}:airpulse" .

echo "[3/4] Verificando os arquivos da imagem"
# Caminhos relativos ao WORKDIR /app evitam a conversao de argumentos do Git Bash.
if ! docker run --rm --entrypoint ls "${IMAGE}:${TAG}" src/models/jiraAlertaModel.js app.js >/dev/null; then
  echo "Falha ao verificar os arquivos da imagem. Push abortado." >&2
  exit 1
fi
echo "src/models/jiraAlertaModel.js e app.js encontrados na imagem."

echo "[4/4] docker push ${IMAGE}:${TAG} e :airpulse"
docker push "${IMAGE}:${TAG}"
docker push "${IMAGE}:airpulse"

echo ""
echo " Imagem publicada: ${IMAGE}:${TAG} (+ :airpulse)"
echo ""
echo "Para atualizar na EC2:"
echo "  bash deploy.sh <IP_EC2>"
echo ""
echo "Para fixar uma versão específica (rollback possível):"
echo "  edite o .env e defina NODE_IMAGE_TAG=${TAG}, depois rode deploy.sh"
echo ""
echo "Rollback rápido: volte NODE_IMAGE_TAG para airpulse (ou tag anterior) e rode deploy.sh"
