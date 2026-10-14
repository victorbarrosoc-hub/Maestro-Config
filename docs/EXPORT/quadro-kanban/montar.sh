#!/usr/bin/env bash
# Junta o PROMPT e os dois arquivos num só (QUADRO-PARA-COLAR.md), para mandar de uma vez.
# Rodar de novo sempre que o esqueleto ou o banco mudarem.
set -euo pipefail
cd "$(dirname "$0")"
{
  cat PROMPT.md
  printf '\n\n---\n\n# Arquivo 1 — quadro-kanban.html\n\nSalve exatamente como está, com o nome `quadro-kanban.html`.\n\n````html\n'
  cat quadro-kanban.html
  printf '\n````\n\n# Arquivo 2 — quadro-banco.sql\n\nSalve exatamente como está, com o nome `quadro-banco.sql`.\n\n````sql\n'
  cat quadro-banco.sql
  printf '\n````\n'
} > QUADRO-PARA-COLAR.md
wc -c QUADRO-PARA-COLAR.md
