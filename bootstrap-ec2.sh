#!/usr/bin/env bash
set -euo pipefail

project_dir="$HOME/web-site-airpulse"
repository=https://github.com/AirPulse-sptech/web-site-airpulse.git
branch=feat/adicionando-inicializador-projeto
deploy_user=$(id -un)
packages=()

if ! command -v git >/dev/null; then
  packages+=(git)
fi

if ! command -v curl >/dev/null; then
  packages+=(curl)
fi

if ! docker compose version >/dev/null 2>&1; then
  packages+=(docker.io docker-compose-v2)
fi

if (( ${#packages[@]} )); then
  if ! command -v apt-get >/dev/null; then
    echo "A instalação automática é para uma EC2 com Ubuntu." >&2
    exit 1
  fi

  sudo apt-get update
  sudo apt-get install -y "${packages[@]}"
fi

if ! getent group docker >/dev/null; then
  sudo groupadd --force docker
fi

if ! id -nG "$deploy_user" | grep -qw docker; then
  sudo usermod -aG docker "$deploy_user"
fi

if ! systemctl is-active --quiet docker; then
  sudo systemctl enable --now docker
fi

if [[ ! -d "$project_dir/.git" ]]; then
  git clone --branch "$branch" --single-branch "$repository" "$project_dir"
fi

if [[ ! -f "$project_dir/deploy.sh" || ! -f "$project_dir/compose.ec2.yaml" ]]; then
  echo "Atualize o clone em $project_dir com os arquivos de deploy da branch $branch." >&2
  exit 1
fi

cd -- "$project_dir"

# Reaproveita o arquivo criado por deploys anteriores executados com sudo.
if [[ -f .env.compose && ! -L .env.compose && ! -O .env.compose ]]; then
  sudo chown -h -- "$(id -u):$(id -g)" .env.compose
fi

if id -nG | grep -qw docker; then
  exec bash ./deploy.sh --ec2
fi

exec sg docker -c 'exec bash ./deploy.sh --ec2'
