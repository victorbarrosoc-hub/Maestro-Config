#!/usr/bin/env python3
"""Monta web/index.html a partir do prototipo, com os metadados de app."""
import io, os, re, datetime

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
origem = os.path.join(raiz, 'docs', 'UX', 'prototipo-plataforma.html')
destino = os.path.join(raiz, 'web', 'index.html')

s = io.open(origem, encoding='utf-8').read()

# As telas de lancamento do iPhone. Sem elas o iOS mostra preto puro
# enquanto carrega, e a pagina pinta #161616 logo depois: o degrau de
# preto para cinza e a piscada que se ve ao abrir o app. Geradas por
# web/icones/gerar-icones.py, que tambem escreve as tags.
tags = os.path.join(raiz, 'web', 'icones', 'lancamento.html')
LANCAMENTO = io.open(tags, encoding='utf-8').read().strip() if os.path.exists(tags) else ''

CABECA = '''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Maestro</title>
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#1C1C1C">
<meta name="description" content="O sistema operacional para agências e equipes criativas. Briefing, estratégia, aprovação e publicação num lugar só — com o cliente dentro.">
<!-- tela de início do iPhone -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Maestro">
<link rel="apple-touch-icon" href="icones/maestro-gesto-180.png">
__LANCAMENTO__
<link rel="icon" type="image/png" sizes="192x192" href="icones/maestro-gesto-192.png">
<meta property="og:title" content="Maestro">
<meta property="og:description" content="O sistema operacional para agências e equipes criativas.">
<meta property="og:type" content="website">
'''.replace('__LANCAMENTO__', LANCAMENTO)

# troca o cabecalho antigo (charset + viewport + title) pelo novo
antigo = re.compile(
    r'<meta charset="utf-8">\s*\n\s*<meta name="viewport"[^>]*>\s*\n\s*<title>[^<]*</title>',
    re.I)
if antigo.search(s):
    s = antigo.sub(CABECA.rstrip(), s, count=1)
else:
    s = CABECA + s

carimbo = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
s = ('<!doctype html>\n<!-- Maestro · gerado por web/montar.py em ' + carimbo +
     ' · nao edite este arquivo, edite docs/UX/prototipo-plataforma.html -->\n' + s)

io.open(destino, 'w', encoding='utf-8').write(s)
print('web/index.html montado · %.1f MB · %s' % (len(s.encode()) / 1048576, carimbo))
