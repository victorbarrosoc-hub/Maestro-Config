#!/usr/bin/env python3
"""
Os ícones do app, gerados a partir do gesto do founder.

Fundo eerie black, gesto em mustard — a paleta da marca. O path vem de
docs/BRAND/assets/logo/tracar-gesto.py, que decalca o desenho dele; aqui
ele é só achatado em polígono e pintado com supersampling.

    pip install pillow
    python3 web/icones/gerar-icones.py

Os nomes carregam a versão do símbolo de propósito: o vercel.json serve
/icones/* como immutable por um ano, então trocar o conteúdo de um nome
antigo não chega no celular de ninguém. Nome novo, ícone novo.
"""
import importlib.util, re
from pathlib import Path
from PIL import Image, ImageDraw

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]
EERIE, MUSTARD = '#1C1C1C', '#FFC857'
SUPER = 4                      # supersampling: desenha grande e reduz

spec = importlib.util.spec_from_file_location(
    'tg', RAIZ / 'docs' / 'BRAND' / 'assets' / 'logo' / 'tracar-gesto.py')
tg = importlib.util.module_from_spec(spec); spec.loader.exec_module(tg)


def pontos_do_path(d, por_curva=24):
    """Achata o contorno (M + cúbicas + Z) numa lista de pontos."""
    n = [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', d)]
    p0 = (n[0], n[1]); pts = [p0]; i = 2
    while i + 5 < len(n) + 1 and i + 5 <= len(n):
        c1, c2, p3 = (n[i], n[i+1]), (n[i+2], n[i+3]), (n[i+4], n[i+5])
        for k in range(1, por_curva + 1):
            t = k / por_curva; m = 1 - t
            pts.append((m**3*p0[0] + 3*m*m*t*c1[0] + 3*m*t*t*c2[0] + t**3*p3[0],
                        m**3*p0[1] + 3*m*m*t*c1[1] + 3*m*t*t*c2[1] + t**3*p3[1]))
        p0 = p3; i += 6
    return pts


def icone(lado, fracao, saida):
    G = tg.gesto()
    pts = pontos_do_path(G['d'])
    L = lado * SUPER
    larg = L * fracao
    esc = larg / G['largura']
    dx = (L - larg) / 2
    dy = (L - G['altura'] * esc) / 2
    im = Image.new('RGB', (L, L), EERIE)
    ImageDraw.Draw(im).polygon([(x * esc + dx, y * esc + dy) for x, y in pts], fill=MUSTARD)
    im.resize((lado, lado), Image.LANCZOS).save(AQUI / saida, optimize=True)
    print('  %-30s %d px · gesto em %d%% da largura' % (saida, lado, round(fracao * 100)))


# As telas de lançamento do iPhone. O iOS não usa o background_color do
# manifesto: sem apple-touch-startup-image ele mostra PRETO PURO enquanto
# carrega, e a página pinta #161616 logo depois — o degrau de preto para
# cinza é a piscada que se vê ao abrir o app. Cada arquivo é a cor do
# primeiro quadro da página, na resolução exata de um aparelho.
FUNDO_INICIAL = '#161616'
APARELHOS = [   # (largura css, altura css, dpr)
    (440, 956, 3),   # 16 Pro Max
    (430, 932, 3),   # 15/16 Pro Max, 14 Pro Max
    (428, 926, 3),   # 12/13/14 Pro Max
    (402, 874, 3),   # 16 Pro
    (393, 852, 3),   # 14 Pro, 15, 16
    (390, 844, 3),   # 12, 13, 14
    (375, 812, 3),   # X, XS, 11 Pro, 12/13 mini
    (414, 896, 3),   # XS Max, 11 Pro Max
    (414, 896, 2),   # XR, 11
    (414, 736, 3),   # 8 Plus
    (375, 667, 2),   # 8, SE
]


def lancamento():
    saidas = []
    for lc, ac, dpr in APARELHOS:
        arq = 'lancamento-%dx%d@%dx.png' % (lc, ac, dpr)
        Image.new('RGB', (lc * dpr, ac * dpr), FUNDO_INICIAL).save(AQUI / arq, optimize=True)
        saidas.append((arq, lc, ac, dpr))
    return saidas


def tags_html(saidas):
    """As tags para o cabeçalho — o iOS só aceita a imagem com media exato."""
    return '\n'.join(
        '<link rel="apple-touch-startup-image" href="icones/%s"\n'
        '      media="(device-width:%dpx) and (device-height:%dpx) and '
        '(-webkit-device-pixel-ratio:%d) and (orientation:portrait)">' % (a, lc, ac, d)
        for a, lc, ac, d in saidas)


if __name__ == '__main__':
    print('ícones do app, a partir do gesto decalcado:')
    for lado, arq in [(180, 'maestro-gesto-180.png'), (192, 'maestro-gesto-192.png'),
                      (512, 'maestro-gesto-512.png')]:
        icone(lado, .76, arq)
    # maskable: o Android recorta em círculo, então o gesto fica na zona segura
    icone(512, .56, 'maestro-gesto-maskable-512.png')

    saidas = lancamento()
    print('telas de lançamento (%s): %d aparelhos' % (FUNDO_INICIAL, len(saidas)))
    (AQUI / 'lancamento.html').write_text(tags_html(saidas) + '\n', encoding='utf-8')
    print('  tags do cabeçalho em icones/lancamento.html — montar.py lê daqui')
