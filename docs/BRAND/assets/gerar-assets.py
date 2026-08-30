#!/usr/bin/env python3
"""
Gera todos os arquivos da marca. Nunca edite os .svg à mão.

    python3 gerar-assets.py

Duas peças, ambas em curvas — nenhum arquivo depende de fonte instalada:
  · o gesto, decalcado do desenho do founder   (logo/tracar-gesto.py)
  · o nome, em Source Serif 4 virada em path   (logo/gerar-nome.py → nome-maestro.json)
"""
import json, importlib.util
from pathlib import Path

AQUI = Path(__file__).resolve().parent

def carrega(nome, arq):
    spec = importlib.util.spec_from_file_location(nome, AQUI / arq)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

G = carrega('tg', 'logo/tracar-gesto.py').gesto()
D, GW, GH = G['d'], G['largura'], G['altura']
N = json.loads((AQUI / 'logo' / 'nome-maestro.json').read_text(encoding='utf-8'))

MOSTARDA, EERIE, FUMACA = '#FFC857', '#1C1C1C', '#F4F7F5'
TINTA = N['largura_tinta'] / N['upem']          # largura de "Maestro" por em
CAPS  = N['altura_maiuscula'] / N['upem']       # altura da maiúscula por em
ESQ   = N['esquerda'] / N['upem']               # espaço à esquerda do M

def svg(arq, vb, w, h, corpo, titulo):
    (AQUI / arq).write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" width="%g" height="%g"\n'
        '     role="img" aria-label="Maestro">\n  <title>%s</title>\n%s</svg>\n'
        % (vb, w, h, titulo, corpo), encoding='utf-8')
    print('  %-44s %s' % (arq, vb))

def g(cor, x=0, y=0, s=1):
    t = '' if (x, y, s) == (0, 0, 1) else ' transform="translate(%g %g) scale(%g)"' % (x, y, round(s, 5))
    return '  <g%s><path fill="%s" d="%s"/></g>\n' % (t, cor, D)

def nome(x, base, corpo, cor):
    """x = borda esquerda da tinta do M; base = linha de base."""
    s = corpo / N['upem']
    return ('  <g transform="translate(%g %g) scale(%g)"><path fill="%s" d="%s"/></g>\n'
            % (round(x - ESQ * corpo, 2), base, round(s, 5), cor, N['d']))

print('gesto: %d cúbicas, desvio %.2f px · nome: %s' % (G['curvas'], G['desvio_px'], N['fonte']))

# ---- o símbolo solto, com respiro de 8 ----
P = 8
for arq, cor, tit in [('maestro-symbol.svg',       MOSTARDA, 'O Gesto (decalcado do desenho do founder)'),
                      ('maestro-symbol-ink.svg',   EERIE,    'O Gesto, eerie black'),
                      ('maestro-symbol-white.svg', FUMACA,   'O Gesto, white smoke')]:
    svg('logo/' + arq, '%g %g %g %g' % (-P, -P, GW + 2*P, GH + 2*P),
        512, round(512 * (GH + 2*P) / (GW + 2*P), 1), g(cor), 'Maestro — ' + tit)

# ---- lockup horizontal ----
AG, CORPO, RESP = 92.0, 78.0, 34.0
ESC = AG / GH; LG = GW * ESC
LARG = LG + RESP + TINTA * CORPO
BASE = AG / 2 + CAPS * CORPO / 2
for arq, cn, tit in [('maestro-lockup-horizontal.svg',      EERIE,  'Lockup horizontal, claro'),
                     ('maestro-lockup-horizontal-dark.svg', FUMACA, 'Lockup horizontal, escuro')]:
    svg('logo/' + arq, '0 0 %.0f %.0f' % (round(LARG), AG), round(LARG) * 2, AG * 2,
        g(MOSTARDA, 0, 0, ESC) + nome(LG + RESP, BASE, CORPO, cn), 'Maestro — ' + tit)

# ---- lockup vertical: a assinatura ----
LGV, CORPV, RESPV = 200.0, 58.0, 30.0
ESCV = LGV / GW; AGV = GH * ESCV; LNV = TINTA * CORPV
LARGV = max(LGV, LNV); ALTV = AGV + RESPV + CAPS * CORPV
svg('logo/maestro-lockup-vertical.svg', '0 0 %.0f %.0f' % (round(LARGV), round(ALTV)),
    round(LARGV) * 2, round(ALTV) * 2,
    g(MOSTARDA, (LARGV - LGV) / 2, 0, ESCV) + nome((LARGV - LNV) / 2, ALTV, CORPV, FUMACA),
    'Maestro — Lockup vertical (a assinatura)')

# ---- favicon ----
LF = 42.0; EF = LF / GW
svg('icon/favicon.svg', '0 0 48 48', 48, 48,
    '  <rect width="48" height="48" rx="12" fill="%s"/>\n' % EERIE
    + g(MOSTARDA, (48 - LF) / 2, (48 - GH * EF) / 2, EF), 'Maestro — Favicon')

# ---- ícone do app ----
LI = 390.0; EI = LI / GW
svg('icon/maestro-app-icon.svg', '0 0 512 512', 512, 512,
    '  <defs><linearGradient id="fundo" x1="0" y1="0" x2="0" y2="1">\n'
    '    <stop offset="0" stop-color="#2A2A2A"/><stop offset="1" stop-color="%s"/>\n'
    '  </linearGradient></defs>\n'
    '  <path d="M256 0C74 0 0 74 0 256s74 256 256 256 256-74 256-256S438 0 256 0Z" fill="url(#fundo)"/>\n' % EERIE
    + g(MOSTARDA, (512 - LI) / 2, (512 - GH * EI) / 2, EI), 'Maestro — App icon')
