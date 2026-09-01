#!/usr/bin/env python3
"""
O favicon da Maestro, em vetor — e o ponto de partida do resto.

    pip install pillow
    python3 web/icones/gerar-marca-web.py     # escreve o SVG
    node    web/icones/gerar-marca-web.mjs    # rasteriza PNG e imagem de link

POR QUE A RASTERIZAÇÃO SAIU DAQUI

A primeira versão deste arquivo desenhava tudo com Pillow, inclusive o nome
"Maestro" a partir dos contornos da fonte. Não funcionou, e o motivo vale
ficar escrito: `ImageDraw.polygon` preenche UM polígono por vez e não conhece
regra de preenchimento. Uma letra não é um polígono — é um conjunto de
contornos onde uns preenchem e outros FURAM, e a fonte pressupõe a regra do
não-zero para decidir qual é qual.

Tentei par-ímpar: abriu fendas nas hastes, porque numa serifa há contornos
que se sobrepõem e dois no mesmo sentido se cancelam. Tentei deduzir o
sentido pela área com sinal: o "o" ficou certo e o "a" e o "e" ficaram com o
miolo cheio, porque a suposição sobre o sentido não valia para todos. Cada
tentativa consertava uma letra e estragava outra — sinal de que o problema
não era o ajuste, era a abordagem.

Quem já sabe aplicar a regra do não-zero é o navegador, e este projeto já
verifica tudo num Chromium de verdade. Então a arte é montada em SVG e
FOTOGRAFADA — que é usar o renderizador certo em vez de reescrever um pior.
O que sobrou aqui é o que Pillow não erraria e o SVG não precisa: nada.
Este arquivo agora só escreve o SVG do favicon, a partir do gesto decalcado.
""" 
import importlib.util, json, re
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]
EERIE, FUNDO_OG, MUSTARD, GELO = '#1C1C1C', '#161616', '#FFC857', '#F4F7F5'
SUPER = 4

spec = importlib.util.spec_from_file_location(
    'tg', RAIZ / 'docs' / 'BRAND' / 'assets' / 'logo' / 'tracar-gesto.py')
tg = importlib.util.module_from_spec(spec); spec.loader.exec_module(tg)
GESTO = tg.gesto()
NOME = json.loads((RAIZ / 'docs' / 'BRAND' / 'assets' / 'logo' /
                   'nome-maestro.json').read_text(encoding='utf-8'))


def subcaminhos(d, por_curva=28):
    """Achata um path SVG numa lista de polígonos.

    Precisa ser um parser de verdade, não um `findall` de números: o gesto
    é só M + cúbicas, mas o nome "Maestro" sai da fonte com V, H e Q — e
    com repetição implícita (uma letra de comando valendo para vários
    conjuntos de números seguidos). Ler os números soltos, ignorando as
    letras, monta a curva errada em silêncio.
    """
    fichas = re.findall(r'[MmLlHhVvCcSsQqTtZz]|-?\d*\.?\d+(?:[eE]-?\d+)?', d)
    saida, atual = [], []
    x = y = 0.0
    ini = (0.0, 0.0)
    ctrl = None                      # último controle, para S e T
    cmd = None
    i = 0

    def cubica(c1, c2, p3):
        nonlocal x, y
        p0 = (x, y)
        for k in range(1, por_curva + 1):
            t = k / por_curva; m = 1 - t
            atual.append((m**3*p0[0] + 3*m*m*t*c1[0] + 3*m*t*t*c2[0] + t**3*p3[0],
                          m**3*p0[1] + 3*m*m*t*c1[1] + 3*m*t*t*c2[1] + t**3*p3[1]))
        x, y = p3

    while i < len(fichas):
        f = fichas[i]
        if f.isalpha():
            cmd = f; i += 1
            if cmd in 'Zz':
                if atual: saida.append(atual); atual = []
                x, y = ini; ctrl = None
            continue
        if cmd is None: i += 1; continue
        rel = cmd.islower(); C = cmd.upper()
        num = lambda k: float(fichas[i + k])

        if C == 'M':
            nx, ny = num(0), num(1)
            x, y = (x + nx, y + ny) if rel else (nx, ny)
            if atual: saida.append(atual)
            atual = [(x, y)]; ini = (x, y); i += 2
            cmd = 'l' if rel else 'L'        # M seguido de números vira L
            ctrl = None
        elif C in 'LT':
            nx, ny = num(0), num(1)
            if C == 'T':
                c = (2*x - ctrl[0], 2*y - ctrl[1]) if ctrl else (x, y)
                p3 = (x + nx, y + ny) if rel else (nx, ny)
                cubica((x + 2*(c[0]-x)/3, y + 2*(c[1]-y)/3),
                       (p3[0] + 2*(c[0]-p3[0])/3, p3[1] + 2*(c[1]-p3[1])/3), p3)
                ctrl = c
            else:
                x, y = (x + nx, y + ny) if rel else (nx, ny)
                atual.append((x, y)); ctrl = None
            i += 2
        elif C == 'H':
            nx = num(0); x = x + nx if rel else nx
            atual.append((x, y)); ctrl = None; i += 1
        elif C == 'V':
            ny = num(0); y = y + ny if rel else ny
            atual.append((x, y)); ctrl = None; i += 1
        elif C in 'CS':
            if C == 'C':
                c1 = (x + num(0), y + num(1)) if rel else (num(0), num(1))
                c2 = (x + num(2), y + num(3)) if rel else (num(2), num(3))
                p3 = (x + num(4), y + num(5)) if rel else (num(4), num(5))
                salto = 6
            else:
                c1 = (2*x - ctrl[0], 2*y - ctrl[1]) if ctrl else (x, y)
                c2 = (x + num(0), y + num(1)) if rel else (num(0), num(1))
                p3 = (x + num(2), y + num(3)) if rel else (num(2), num(3))
                salto = 4
            cubica(c1, c2, p3); ctrl = c2; i += salto
        elif C == 'Q':
            c = (x + num(0), y + num(1)) if rel else (num(0), num(1))
            p3 = (x + num(2), y + num(3)) if rel else (num(2), num(3))
            cubica((x + 2*(c[0]-x)/3, y + 2*(c[1]-y)/3),
                   (p3[0] + 2*(c[0]-p3[0])/3, p3[1] + 2*(c[1]-p3[1])/3), p3)
            ctrl = c; i += 4
        else:
            i += 1
    if atual: saida.append(atual)
    return [s for s in saida if len(s) > 2]


GESTO_PTS = subcaminhos(GESTO['d'])[0]


def area_com_sinal(pts):
    """Positiva ou negativa conforme o contorno gira num sentido ou no outro."""
    s = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return s / 2


def pinta_contornos(im, subs, cor):
    """Desenha uma FORMA com buracos — as contraformas das letras.

    O `polygon` do PIL preenche um polígono por vez e não conhece regra de
    preenchimento: em sequência, o contorno de dentro do "o" é pintado
    igual ao de fora e o miolo fica cheio.

    Tentei par-ímpar (XOR de cada contorno) e ela ERRA aqui, de um jeito
    que só se vê ampliando: numa serifa há contornos que se SOBREPÕEM, e
    dois contornos no mesmo sentido se cancelam — abrindo fendas finas no
    meio das hastes. Foi o que apareceu na primeira imagem gerada.

    O certo é a regra do não-zero, que é a que a fonte pressupõe. Aqui ela
    sai de graça pela DIREÇÃO de cada contorno: numa fonte, o de fora gira
    num sentido e a contraforma no contrário. Então soma-se tudo que gira
    num sentido (união, sem cancelar) e subtrai-se o que gira no outro.
    """
    fora = Image.new('1', im.size, 0)
    dentro = Image.new('1', im.size, 0)
    for sub in subs:
        alvo = fora if area_com_sinal(sub) >= 0 else dentro
        # o `outline` fecha a costura: dois contornos que se ENCOSTAM em vez
        # de se sobrepor deixam uma fresta de um pixel entre eles, porque a
        # rasterização é meio-aberta — ampliado, virava um fio escuro no meio
        # da haste da letra
        ImageDraw.Draw(alvo).polygon(sub, fill=1, outline=1)
    # ImageChops.invert NÃO funciona em modo '1': ele inverte o byte, e o
    # pixel do buraco vira 254 — verdadeiro. Foi o que deixou o miolo do "o"
    # cheio mesmo com o contorno interno separado corretamente. XOR com uma
    # imagem toda em 1 é a negação que o modo '1' entende.
    tudo_um = Image.new('1', im.size, 1)
    mascara = ImageChops.logical_and(fora, ImageChops.logical_xor(dentro, tudo_um))
    im.paste(Image.new('RGB', im.size, cor), mask=mascara)


def poe_gesto(dr, pts, esc, dx, dy, cor, grossura=0):
    p = [(x * esc + dx, y * esc + dy) for x, y in pts]
    dr.polygon(p, fill=cor)
    if grossura:                 # a massa que faz o traço sobreviver ao 16px
        dr.line(p + [p[0]], fill=cor, width=max(1, int(grossura)), joint='curve')


# ---------------------------------------------------------------- favicon
def favicon_svg(saida, fracao=0.92):
    """O favicon, em vetor.

    O engrossamento não é enfeite: a 16px o traço fino do gesto afina para
    menos de um pixel e some — sobra um risco diagonal que não é marca
    nenhuma. Ampliar não resolve, porque o que falta é MASSA. Então o
    contorno vira também `stroke`, e o gesto ocupa 92% do quadro.

    Testei inverter (gesto escuro sobre campo mustard): lê ainda mais forte
    e foi recusado — a D-018 reserva o brass para o que espera por você, e
    um favicon inteiro de brass gasta a cor onde ela não decide nada.
    """
    lado = 64
    larg = lado * fracao
    esc = larg / GESTO['largura']
    dx, dy = (lado - larg) / 2, (lado - GESTO['altura'] * esc) / 2
    d = re.sub(r'-?\d*\.?\d+', lambda m: '%g' % round(float(m.group()) * esc, 2), GESTO['d'])
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lado} {lado}" '
           f'width="{lado}" height="{lado}" role="img" aria-label="Maestro">'
           f'<rect width="{lado}" height="{lado}" fill="{EERIE}"/>'
           f'<g transform="translate({dx:.2f} {dy:.2f})">'
           f'<path d="{d}" fill="{MUSTARD}" stroke="{MUSTARD}" '
           f'stroke-width="{lado*0.07:.2f}" stroke-linejoin="round"/></g></svg>')
    (AQUI / saida).write_text(svg, encoding='utf-8')
    print('  %-28s vetor · %d bytes' % (saida, len(svg)))


if __name__ == '__main__':
    favicon_svg('maestro-fav-v2.svg')
    print('  os PNG e a imagem de link saem daqui:  node web/icones/gerar-marca-web.mjs')
