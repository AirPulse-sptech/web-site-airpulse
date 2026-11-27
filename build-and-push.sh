#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== BUILD & PUSH DOCKER HUB (airpulse_deploy) ==="

IMAGE="mateusloualmeida/airpulse_deploy"

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

echo "[3/4] Sanity check: Jira presente na imagem?"
# O deploy Jira depende de src/models/jiraAlertaModel.js. Se a imagem não o
# tiver, o site sobe "ok" mas sem o link do Jira (falso negativo).
if docker run --rm --entrypoint ls "${IMAGE}:${TAG}" /app/src/models/jiraAlertaModel.js >/dev/null 2>&1; then
  echo "src/models/jiraAlertaModel.js encontrado na imagem."
else
  echo " jiraAlertaModel.js AUSENTE na imagem. Push abortado."
  exit 1
fi
if docker run --rm --entrypoint ls "${IMAGE}:${TAG}" /app/app.js >/dev/null 2>&1; then
  echo " /app/app.js encontrado na imagem."
else
  echo " /app/app.js AUSENTE na imagem. Push abortado."
  exit 1
fi

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
