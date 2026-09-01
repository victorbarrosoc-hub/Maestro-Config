#!/usr/bin/env python3
"""
Baixa e guarda as fontes da marca, uma vez.

    python3 docs/BRAND/assets/fontes/baixar.py

Ficam versionadas no repositório de propósito. Todas são SIL Open Font
License 1.1 — redistribuir é permitido —, e ter o arquivo aqui é o que
torna a geração dos ativos REPETÍVEL: quem clonar consegue refazer a
imagem do link sem depender de rede nem de a URL do Google continuar a
mesma. Sem isso, a arte da marca dependeria de um serviço de terceiro
estar no ar no dia em que alguém precisasse regerá-la.
"""
import re, urllib.request
from pathlib import Path

AQUI = Path(__file__).resolve().parent
UA = ('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120 Safari/537.36')

# nome do arquivo -> a consulta que o Google entende
QUERO = {
    'source-serif-4-600.woff2':
        'family=Source+Serif+4:opsz,wght@8..60,600',
    'source-serif-4-600-italico.woff2':
        'family=Source+Serif+4:ital,opsz,wght@1,8..60,600',
    'inter-400.woff2': 'family=Inter:wght@400',
    'inter-600.woff2': 'family=Inter:wght@600',
    'jetbrains-mono-500.woff2': 'family=JetBrains+Mono:wght@500',
}


def pega(consulta):
    css = urllib.request.urlopen(urllib.request.Request(
        'https://fonts.googleapis.com/css2?%s&display=swap' % consulta,
        headers={'User-Agent': UA})).read().decode()
    # o subconjunto latino basta; o resto é peso morto num pôster em português
    bloco = css.split('/* latin */')[1]
    url = re.search(r'url\((https://[^)]+\.woff2)\)', bloco).group(1)
    return urllib.request.urlopen(url).read()


if __name__ == '__main__':
    for arq, consulta in QUERO.items():
        alvo = AQUI / arq
        if alvo.exists():
            print('  %-34s já está aqui' % arq); continue
        dados = pega(consulta)
        alvo.write_bytes(dados)
        print('  %-34s %.0f KB' % (arq, len(dados) / 1024))
