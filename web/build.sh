#!/usr/bin/env bash
# Monta web/index.html a partir do prototipo, injetando os metadados de app.
# Rode sempre que o prototipo mudar:  bash web/build.sh
set -euo pipefail
raiz="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$raiz/web/montar.py"
