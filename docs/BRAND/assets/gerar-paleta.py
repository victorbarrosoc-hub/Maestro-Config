#!/usr/bin/env python3
"""
A cartela de cores da Maestro, em SVG, JSON e texto.

    python3 docs/BRAND/assets/gerar-paleta.py

Lê `packages/tokens/src/tokens.css` e desenha o que está lá. Não digita
nenhum hex: a cartela é uma LEITURA da fonte de verdade, não uma segunda
cópia dela. Se as duas pudessem divergir, um dia divergiriam — e a que
está na mão do designer é justamente a que ninguém confere.
"""
import json, re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[3]
CSS = RAIZ / 'packages' / 'tokens' / 'src' / 'tokens.css'
SAIDA = Path(__file__).resolve().parent / 'paleta'
SAIDA.mkdir(exist_ok=True)

fonte = CSS.read_text(encoding='utf-8')
cores = dict(re.findall(r'--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})', fonte))
comentario = dict(re.findall(r'--([a-z0-9-]+):\s*#[0-9A-Fa-f]{6};\s*/\*\s*(.+?)\s*(?:=.*)?\*/', fonte))

def familia(pref):
    achado = [(k, v) for k, v in cores.items() if re.fullmatch(pref + r'-\d+', k)]
    return sorted(achado, key=lambda kv: int(kv[0].rsplit('-', 1)[1]))

MARCA = [('eerie', 'o palco'), ('taupe', 'a coxia'),
         ('mustard', 'a luz'), ('smoke', 'a partitura')]
GRUPOS = [('Ink · a escuridão do palco', familia('ink')),
          ('Brass · o acento, e só onde ele decide (D-018)', familia('brass')),
          ('Apoio · estado, nunca decoração',
           [kv for p in ('cobalt', 'encore', 'coral', 'violet', 'danger')
            for kv in familia(p)])]


def claro(hexa):
    r, g, b = (int(hexa[i:i+2], 16) / 255 for i in (1, 3, 5))
    return 0.2126*r + 0.7152*g + 0.0722*b > 0.5


def svg():
    L, M, CH, CW = 980, 56, 96, 108      # folha, margem, altura e largura da amostra
    y = 96
    p = [f'<rect width="{L}" height="__ALT__" fill="{cores["ink-950"]}"/>',
         f'<text x="{M}" y="58" fill="{cores["ink-50"]}" font-family="Georgia,serif" '
         f'font-size="30">Maestro — paleta</text>',
         f'<text x="{M}" y="80" fill="{cores["ink-400"]}" '
         f'font-family="ui-monospace,Menlo,monospace" font-size="11" '
         f'letter-spacing="1.4">GERADA DE packages/tokens/src/tokens.css</text>']

    def titulo(t, y):
        p.append(f'<text x="{M}" y="{y}" fill="{cores["ink-300"]}" '
                 f'font-family="ui-monospace,Menlo,monospace" font-size="10.5" '
                 f'letter-spacing="1.8">{t.upper()}</text>')

    def amostra(x, y, nome, hexa, alto=CH, larg=CW-10):
        tinta = cores['ink-950'] if claro(hexa) else cores['ink-50']
        p.append(f'<rect x="{x}" y="{y}" width="{larg}" height="{alto}" rx="10" fill="{hexa}" '
                 f'stroke="{cores["ink-800"]}"/>')
        p.append(f'<text x="{x+11}" y="{y+alto-26}" fill="{tinta}" opacity=".8" '
                 f'font-family="ui-monospace,Menlo,monospace" font-size="9.5">{nome}</text>')
        p.append(f'<text x="{x+11}" y="{y+alto-11}" fill="{tinta}" '
                 f'font-family="ui-monospace,Menlo,monospace" font-size="11.5" '
                 f'font-weight="600">{hexa.upper()}</text>')

    y += 44; titulo('As quatro cores do founder (D-079)', y); y += 16
    for i, (k, papel) in enumerate(MARCA):
        # largura dobrada: o rótulo destas quatro tem o papel junto do nome
        # ("mustard · a luz") e não cabia na amostra estreita das rampas
        amostra(M + i * CW * 2, y, f'{k} · {papel}', cores[k], CH + 14, CW * 2 - 14)
    y += CH + 14 + 34

    for tit, itens in GRUPOS:
        titulo(tit, y); y += 16
        for i, (k, v) in enumerate(itens):
            lin, col = divmod(i, 8)
            amostra(M + col * CW, y + lin * (CH + 10), k, v)
        y += ((len(itens) - 1) // 8 + 1) * (CH + 10) + 26

    alt = y + 24
    corpo = '\n  '.join(x.replace('__ALT__', str(alt)) for x in p)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {L} {alt}" '
            f'width="{L}" height="{alt}" role="img" aria-label="Paleta da Maestro">\n'
            f'  <title>Maestro — paleta</title>\n  {corpo}\n</svg>\n')


(SAIDA / 'paleta.svg').write_text(svg(), encoding='utf-8')

dados = {'marca': {k: {'hex': cores[k], 'papel': papel} for k, papel in MARCA},
         'ink': dict(familia('ink')), 'brass': dict(familia('brass')),
         **{p: dict(familia(p)) for p in ('cobalt', 'encore', 'coral', 'violet', 'danger')}}
(SAIDA / 'paleta.json').write_text(json.dumps(dados, ensure_ascii=False, indent=2) + '\n',
                                   encoding='utf-8')

linhas = ['Maestro — paleta', '=' * 40, '',
          'AS QUATRO CORES DO FOUNDER (D-079)']
for k, papel in MARCA:
    linhas.append('  %-9s %s   %s' % (k, cores[k].upper(), papel))
for tit, itens in GRUPOS:
    linhas += ['', tit.upper()]
    linhas += ['  %-14s %s' % (k, v.upper()) for k, v in itens]
(SAIDA / 'paleta.txt').write_text('\n'.join(linhas) + '\n', encoding='utf-8')

print('paleta/paleta.svg · paleta.json · paleta.txt — %d cores lidas de tokens.css'
      % len(cores))
