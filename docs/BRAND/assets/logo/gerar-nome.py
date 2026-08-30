#!/usr/bin/env python3
"""
"Maestro" em contornos — a serifa da referência do founder, virada em path.

Um arquivo de logo não pode depender de fonte instalada nem de webfont: se a
Source Serif 4 não carregar, o nome cai numa fonte qualquer e a marca quebra.
Então o nome é convertido em curvas uma vez e guardado em nome-maestro.json.

Precisa de rede (baixa a fonte do Google Fonts). Só rode de novo se mudar a
fonte, o tracking ou o texto:

    pip install fonttools brotli uharfbuzz
    python3 gerar-nome.py

Fonte: Source Serif 4, SemiBold (600), eixo óptico em 40 (tamanho de display —
serifas mais finas e mais contraste, que é o que um logotipo pede).
Licença: SIL Open Font License 1.1 — uso comercial e modificação liberados.
"""
import io, json, re, urllib.request
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform
import uharfbuzz as hb

TEXTO, PESO, OPSZ, TRACK = 'Maestro', 600, 40, 0.01
CSS = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,%d&display=swap' % PESO
UA  = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
SAIDA = Path(__file__).resolve().parent / 'nome-maestro.json'


def baixa_fonte():
    css = urllib.request.urlopen(urllib.request.Request(CSS, headers={'User-Agent': UA})).read().decode()
    bloco = css.split('/* latin */')[1]                       # o subconjunto latino basta
    url = re.search(r'url\((https://[^)]+\.woff2)\)', bloco).group(1)
    return urllib.request.urlopen(url).read()


def contornos(dados):
    f = instancer.instantiateVariableFont(TTFont(io.BytesIO(dados)), {'opsz': OPSZ}, inplace=False)
    f.flavor = None                                           # o HarfBuzz não lê woff2: grava ttf cru
    buf = io.BytesIO(); f.save(buf)
    face = hb.Face(buf.getvalue()); fonte = hb.Font(face)
    if fonte.get_nominal_glyph(ord('M')) in (None, 0):        # sem isso, tudo vira .notdef em silêncio
        raise SystemExit('a fonte não foi lida: "M" caiu no glifo nulo')
    upem = face.upem; fonte.scale = (upem, upem); hb.ot_font_set_funcs(fonte)
    b = hb.Buffer(); b.add_str(TEXTO); b.guess_segment_properties()
    hb.shape(fonte, b, {'kern': True, 'liga': True})          # kerning de verdade, não soma de avanços

    ordem, gs = f.getGlyphOrder(), f.getGlyphSet()
    caneta = SVGPathPen(gs, ntos=lambda v: '%g' % round(v, 1))
    limites = BoundsPen(gs)
    x = 0.0
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        g = gs[ordem[info.codepoint]]
        t = Transform(1, 0, 0, -1, x + pos.x_offset, pos.y_offset)   # eixo y da fonte é invertido
        g.draw(TransformPen(caneta, t)); g.draw(TransformPen(limites, t))
        x += pos.x_advance + TRACK * upem
    x0, y0, x1, y1 = limites.bounds
    return {'texto': TEXTO, 'fonte': 'Source Serif 4 SemiBold, opsz %d' % OPSZ,
            'licenca': 'SIL OFL 1.1', 'upem': upem, 'd': caneta.getCommands(),
            'avanco': round(x - TRACK * upem, 1),
            'esquerda': round(x0, 1), 'largura_tinta': round(x1 - x0, 1),
            'altura_maiuscula': round(-y0, 1)}


if __name__ == '__main__':
    n = contornos(baixa_fonte())
    SAIDA.write_text(json.dumps(n, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('%s · %d chars · tinta %g × %g em milésimos de em'
          % (SAIDA.name, len(n['d']), n['largura_tinta'], n['altura_maiuscula']))
