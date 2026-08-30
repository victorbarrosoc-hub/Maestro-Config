#!/usr/bin/env python3
"""
As rampas de cor da Maestro, geradas a partir das quatro cores do founder.

    eerie black  #1C1C1C   o palco
    purple taupe #474350   a coxia
    mustard      #FFC857   a luz
    white smoke  #F4F7F5   a partitura

Quatro cores não bastam para uma interface: um tema escuro precisa de degraus
finos entre o fundo e a superfície, e o acento precisa de versões para texto
em fundo claro. Então as quatro viram âncoras, e os degraus entre elas são
interpolados em OKLab — espaço perceptual, para que a distância entre dois
degraus vizinhos pareça a mesma em toda a rampa.

Os nomes das variáveis (--ink-*, --brass-*) não mudam: são 307 usos só no
protótipo da plataforma, e a API guarda 'var(--brass-500)' como dado. Muda o
que elas valem. Quem quiser os nomes novos usa os apelidos --eerie/--mustard.

    python3 gerar-rampas.py           # imprime as rampas
    python3 gerar-rampas.py --css     # bloco css pronto
"""
import sys

EERIE, TAUPE, MUSTARD, SMOKE = '#1C1C1C', '#474350', '#FFC857', '#F4F7F5'


# ---------- sRGB ↔ OKLab (Björn Ottosson, 2020) ----------
def _sr(c):  return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
def _sr_i(c): return 12.92 * c if c <= .0031308 else 1.055 * c ** (1 / 2.4) - .055

def hex_oklab(h):
    r, g, b = (_sr(int(h[i:i+2], 16) / 255) for i in (1, 3, 5))
    l = (.4122214708*r + .5363325363*g + .0514459929*b) ** (1/3)
    m = (.2119034982*r + .6806995451*g + .1073969566*b) ** (1/3)
    s = (.0883024619*r + .2817188376*g + .6299787005*b) ** (1/3)
    return (.2104542553*l + .7936177850*m - .0040720468*s,
            1.9779984951*l - 2.4285922050*m + .4505937099*s,
            .0259040371*l + .7827717662*m - .8086757660*s)

def oklab_hex(lab):
    L, a, b = lab
    l = (L + .3963377774*a + .2158037573*b) ** 3
    m = (L - .1055613458*a - .0638541728*b) ** 3
    s = (L - .0894841775*a - 1.2914855480*b) ** 3
    rgb = (+4.0767416621*l - 3.3077115913*m + .2309699292*s,
           -1.2684380046*l + 2.6097574011*m - .3413193965*s,
           -.0041960863*l - .7034186147*m + 1.7076147010*s)
    return '#' + ''.join('%02X' % round(255 * min(1, max(0, _sr_i(min(1, max(0, c)))))) for c in rgb)


def rampa(degraus, ancoras):
    """degraus: nomes em ordem. ancoras: {índice: hex}. Interpola em OKLab."""
    ks = sorted(ancoras)
    labs = {k: hex_oklab(ancoras[k]) for k in ks}
    fora = []
    for i in range(len(degraus)):
        if i in labs: fora.append(labs[i]); continue
        if i < ks[0]:   a, b = ks[0], ks[1]        # extrapola pela ponta
        elif i > ks[-1]: a, b = ks[-2], ks[-1]
        else:
            a = max(k for k in ks if k < i); b = min(k for k in ks if k > i)
        t = (i - a) / (b - a)
        fora.append(tuple(labs[a][j] + t * (labs[b][j] - labs[a][j]) for j in range(3)))
    return [oklab_hex(x) for x in fora]


# a rampa neutra: do fundo mais fundo até a partitura, passando pela coxia
INK = ['950', '900', '850', '800', '700', '600', '500', '400', '300', '200', '100', '50']
def rampa_neutra():
    """A rampa neutra: luminosidade da rampa antiga, cor da paleta nova.

    Distribuir os doze degraus linearmente entre eerie e smoke parece
    correto e não é: a interface precisa dos degraus apertados perto do
    branco (uma superfície clara e a borda dela quase se tocam) e folgados
    no meio. Essa distribuição já estava calibrada. O que muda com o
    founder é a cor, não a estrutura — então guardamos as luminosidades
    antigas, encaixamos as três âncoras dele e tiramos matiz e croma da
    interpolação entre elas.
    """
    ANTIGA = ['#08090B','#0D0F12','#121418','#181B20','#23272E','#333941',
              '#4C535D','#6B7280','#9AA1AC','#C4C9D0','#E3E6EA','#F4F6F8']  # 950 → 50
    L_ant = [hex_oklab(h)[0] for h in ANTIGA]
    Le, Lt, Ls = (hex_oklab(c)[0] for c in (EERIE, TAUPE, SMOKE))

    # o trecho entre a coxia (600) e o palco (900) mantém as proporções antigas
    def entre(i600, i900, i):
        t = (L_ant[i600] - L_ant[i]) / (L_ant[i600] - L_ant[i900])
        return Lt - t * (Lt - Le)

    L = list(L_ant)
    L[11], L[5], L[1] = Ls, Lt, Le                      # 50, 600, 900 = as âncoras
    for i in (4, 3, 2):  L[i] = entre(5, 1, i)          # 700, 800, 850
    L[0] = Le - (L_ant[1] - L_ant[0])                   # 950, um degrau abaixo do palco

    # matiz e croma: neutros abaixo do palco, puxando para a coxia e voltando
    ancoras = sorted([(Le, hex_oklab(EERIE)[1:]), (Lt, hex_oklab(TAUPE)[1:]),
                      (Ls, hex_oklab(SMOKE)[1:])])
    def ab(x):
        if x <= ancoras[0][0]:  return ancoras[0][1]
        if x >= ancoras[-1][0]: return ancoras[-1][1]
        for (l0, ab0), (l1, ab1) in zip(ancoras, ancoras[1:]):
            if l0 <= x <= l1:
                t = (x - l0) / (l1 - l0)
                return tuple(ab0[j] + t * (ab1[j] - ab0[j]) for j in (0, 1))
    return [oklab_hex((x,) + ab(x)) for x in L]

ink = rampa_neutra()

# a rampa do acento: mustard no 500, onde a interface já o procura
BRASS = ['900', '800', '700', '600', '500', '400', '300', '200', '100', '50']
brass = rampa(BRASS, {4: MUSTARD, 0: '#3A2B0C', 9: '#FFF3D8'})


def contraste(a, b):
    def lum(h):
        r, g, bb = (_sr(int(h[i:i+2], 16) / 255) for i in (1, 3, 5))
        return .2126*r + .7152*g + .0722*bb
    x, y = sorted((lum(a), lum(b)), reverse=True)
    return (x + .05) / (y + .05)


if __name__ == '__main__':
    if '--css' in sys.argv:
        print('  /* --- Ink · a rampa neutra, ancorada em eerie black, purple taupe')
        print('         e white smoke (docs/BRAND/assets/gerar-rampas.py) ------------- */')
        for n, c in zip(INK, ink): print('  --ink-%-4s %s;' % (n + ':', c))
        print()
        print('  /* --- Brass · a rampa do acento, ancorada em mustard no 500 --------- */')
        for n, c in zip(BRASS, brass): print('  --brass-%-4s %s;' % (n + ':', c))
    else:
        for n, c in zip(INK, ink):
            print('ink-%-4s %s   contraste com smoke: %5.2f' % (n, c, contraste(c, SMOKE)))
        print()
        for n, c in zip(BRASS, brass):
            print('brass-%-4s %s   sobre eerie: %5.2f   sobre smoke: %5.2f'
                  % (n, c, contraste(c, EERIE), contraste(c, SMOKE)))
        print()
        for nome, c in [('smoke sobre eerie', SMOKE), ('mustard sobre eerie', MUSTARD)]:
            print('%-22s %5.2f' % (nome, contraste(c, EERIE)))
        print('%-22s %5.2f  (por isso texto claro sobre mustard continua proibido)'
              % ('smoke sobre mustard', contraste(SMOKE, MUSTARD)))
