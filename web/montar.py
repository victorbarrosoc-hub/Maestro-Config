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

# O endereço que o Vercel publica.
#
# Isto NÃO é decoração: o WhatsApp exige URL ABSOLUTA na imagem do preview.
# Com caminho relativo ele não busca a imagem, e o link chega como texto seco.
# Trocou de domínio? troque aqui (ou exporte MAESTRO_URL antes de montar).
SITE = os.environ.get('MAESTRO_URL', 'https://maestroapptest.vercel.app').rstrip('/')

# O nome carrega versão porque o WhatsApp guarda a imagem POR URL e não
# volta a buscar: para trocar a arte, troca-se o nome do arquivo.
OG_IMG = 'icones/maestro-og-v2.png'

DESCRICAO = ('O sistema operacional para agências e equipes criativas. '
             'Briefing, estratégia, aprovação e publicação num lugar só — '
             'com o cliente dentro.')
CHAMADA = ('Briefing, calendário, aprovação e publicação num lugar só — '
           'com o cliente dentro.')

CABECA = '''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Maestro — o sistema operacional para agências criativas</title>
<link rel="canonical" href="__SITE__/">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#1C1C1C">
<meta name="description" content="__DESCRICAO__">

<!-- Favicon. O SVG vem primeiro porque é o que o navegador prefere e o que
     não tem tamanho; os PNG atendem quem não lê SVG. O ícone do APP continua
     sendo outro arquivo, de propósito: ele é desenhado para 180px numa tela
     inicial, e a aba do navegador desenha 16 — onde o traço fino do gesto
     sumia. Ver web/icones/gerar-marca-web.py. -->
<link rel="icon" type="image/svg+xml" href="icones/maestro-fav-v2.svg">
<link rel="icon" type="image/png" sizes="32x32" href="icones/maestro-fav-v2-32.png">
<link rel="icon" type="image/png" sizes="48x48" href="icones/maestro-fav-v2-48.png">
<link rel="icon" type="image/png" sizes="192x192" href="icones/maestro-fav-v2-192.png">

<!-- tela de início do iPhone -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Maestro">
<link rel="apple-touch-icon" href="icones/maestro-gesto-180.png">
__LANCAMENTO__

<!-- O cartão do link (WhatsApp, iMessage, Slack, LinkedIn). Tudo absoluto:
     é a única forma que o robô do WhatsApp aceita. E fica no topo do arquivo
     porque esse robô lê só o começo do documento — e este documento tem 2 MB. -->
<meta property="og:site_name" content="Maestro">
<meta property="og:locale" content="pt_BR">
<meta property="og:type" content="website">
<meta property="og:url" content="__SITE__/">
<meta property="og:title" content="Maestro — o sistema operacional para agências criativas">
<meta property="og:description" content="__CHAMADA__">
<meta property="og:image" content="__SITE__/__OG_IMG__">
<meta property="og:image:secure_url" content="__SITE__/__OG_IMG__">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Maestro — 'Não é problema de tarefa. É de alinhamento.' ao lado de seis cards atravessando as fases de aprovação">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Maestro — o sistema operacional para agências criativas">
<meta name="twitter:description" content="__CHAMADA__">
<meta name="twitter:image" content="__SITE__/__OG_IMG__">
'''.replace('__LANCAMENTO__', LANCAMENTO).replace('__SITE__', SITE) \
    .replace('__OG_IMG__', OG_IMG).replace('__DESCRICAO__', DESCRICAO) \
    .replace('__CHAMADA__', CHAMADA)

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
