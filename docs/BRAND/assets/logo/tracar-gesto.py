#!/usr/bin/env python3
"""
O Gesto — vetorização do desenho do founder.

Isto NÃO desenha o símbolo. Ele já existe: está em
docs/BRAND/assets/ref/gesto-founder-foto.jpg, feito à mão pelo founder.
Este script apenas o decalca — isola o traço dourado da foto, extrai o
contorno com precisão subpixel e ajusta cúbicas de Bézier sobre ele.

Se o founder redesenhar o gesto, troque a foto e rode de novo.
Nunca redesenhe o símbolo à mão.

    pip install pillow numpy scipy scikit-image
    python3 tracar-gesto.py            # imprime o path
    python3 tracar-gesto.py --json     # path + medidas do viewBox

Verificado: desvio máximo de 1,8 px num traço de 594 px de largura (0,3%).
"""
import sys, json
from pathlib import Path
import numpy as np
from scipy import ndimage as nd
from skimage import measure
from PIL import Image

REF = Path(__file__).resolve().parents[1] / 'ref' / 'gesto-founder-foto.jpg'
LARGURA = 240.0        # largura do path no viewBox
TOL_PX = 0.55          # desvio máximo aceito, em pixels da foto


def mascara(caminho=REF):
    """Isola o traço dourado da foto e devolve a máscara binária."""
    a = np.asarray(Image.open(caminho).convert('RGB')).astype(float)
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    dourado = np.minimum(R, G * 1.15) - B          # R e G altos, B baixo
    lum = (R + G + B) / 3
    m = (dourado > 30) & (lum > 55)                # generoso: pega a ponta que desvanece

    def maior(m):
        lab, n = nd.label(m)
        if n == 0: raise SystemExit('nenhum traço dourado encontrado em %s' % caminho)
        return lab == int(np.argmax(nd.sum(m, lab, range(1, n + 1)))) + 1

    m = maior(m)
    m = nd.binary_closing(m, np.ones((3, 3)), iterations=2)   # fecha buraco de jpeg
    m = nd.binary_fill_holes(m)
    m = nd.binary_opening(m, np.ones((3, 3)), iterations=1)   # limpa serrilha
    return maior(m)


def contorno(m):
    """Contorno subpixel, reamostrado, começando pela ponta do fio."""
    cs = measure.find_contours(nd.gaussian_filter(m.astype(float), 1.1), 0.5)
    c = max(cs, key=len)
    P = np.column_stack([c[:, 1], c[:, 0]])                   # (x, y)
    if len(P) > 1 and np.allclose(P[0], P[-1]): P = P[:-1]
    P = np.roll(P, -int(np.argmax(P[:, 0] - P[:, 1] * .55)), axis=0)   # ponta = único canto vivo
    P = np.vstack([P, P[0]])

    d = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]
    n = max(400, int(d[-1] / 1.5))
    U = np.column_stack([np.interp(np.linspace(0, d[-1], n), d, P[:, k]) for k in (0, 1)])
    k = np.array([1, 4, 8, 10, 8, 4, 1], float); k /= k.sum()          # tira o serrilhado, não a forma
    S = np.column_stack([np.convolve(np.r_[U[-4:-1, j], U[:, j], U[1:4, j]], k, 'same')[3:-3]
                         for j in (0, 1)])
    S[0] = S[-1] = U[0]                                                # preserva a ponta
    return S


# ---- ajuste de cúbicas (Philip Schneider, "An Algorithm for Automatically
#      Fitting Digitized Curves", Graphics Gems, 1990) ----
def _q(b, t):
    mt = 1 - t
    return ((mt**3)[:, None] * b[0] + (3 * mt**2 * t)[:, None] * b[1]
            + (3 * mt * t**2)[:, None] * b[2] + (t**3)[:, None] * b[3])

def _qp(b, t):
    mt = 1 - t
    return ((3 * mt**2)[:, None] * (b[1] - b[0]) + (6 * mt * t)[:, None] * (b[2] - b[1])
            + (3 * t**2)[:, None] * (b[3] - b[2]))

def _qpp(b, t):
    mt = 1 - t
    return (6 * mt)[:, None] * (b[2] - 2 * b[1] + b[0]) + (6 * t)[:, None] * (b[3] - 2 * b[2] + b[1])

def _unit(v):
    n = float(np.hypot(*v))
    return v / n if n > 1e-12 else v

def _param(p):
    u = np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]
    return u / u[-1] if u[-1] > 0 else u

def _gera(p, u, t1, t2):
    A0 = 3 * ((1 - u)**2 * u)[:, None] * t1
    A1 = 3 * ((1 - u) * u**2)[:, None] * t2
    p0, p3 = p[0], p[-1]
    base = (((1 - u)**3 + 3 * (1 - u)**2 * u)[:, None] * p0
            + (3 * (1 - u) * u**2 + u**3)[:, None] * p3)
    X = p - base
    c00, c01, c11 = (A0 * A0).sum(), (A0 * A1).sum(), (A1 * A1).sum()
    x0, x1 = (A0 * X).sum(), (A1 * X).sum()
    det = c00 * c11 - c01 * c01
    corda = float(np.hypot(*(p3 - p0)))
    if abs(det) < 1e-12:
        a1 = a2 = corda / 3
    else:
        a1 = (x0 * c11 - x1 * c01) / det
        a2 = (c00 * x1 - c01 * x0) / det
    if a1 < 1e-6 or a2 < 1e-6: a1 = a2 = corda / 3
    return np.array([p0, p0 + t1 * a1, p3 + t2 * a2, p3])

def _reparam(p, u, b):
    d, d1, d2 = _q(b, u) - p, _qp(b, u), _qpp(b, u)
    num, den = (d * d1).sum(1), (d1 * d1).sum(1) + (d * d2).sum(1)
    return np.where(np.abs(den) < 1e-12, u, u - num / np.where(den == 0, 1, den))

def _erro(p, u, b):
    e = ((_q(b, u) - p)**2).sum(1)
    i = int(np.argmax(e[1:-1])) + 1 if len(e) > 2 else len(e) // 2
    return e.max(), i

def ajusta(p, t1, t2, tol):
    if len(p) < 3:
        s = np.hypot(*(p[-1] - p[0])) / 3
        return [np.array([p[0], p[0] + t1 * s, p[-1] + t2 * s, p[-1]])]
    u = _param(p); b = _gera(p, u, t1, t2); e, i = _erro(p, u, b)
    if e < tol: return [b]
    if e < tol * 16:
        for _ in range(24):
            u = np.sort(np.clip(_reparam(p, u, b), 0, 1)); u[0], u[-1] = 0, 1
            b = _gera(p, u, t1, t2); e, i = _erro(p, u, b)
            if e < tol: return [b]
    tc = _unit(p[i - 1] - p[i + 1])
    return ajusta(p[:i + 1], t1, tc, tol) + ajusta(p[i:], -tc, t2, tol)


def gesto():
    P = contorno(mascara())
    segs = ajusta(P, _unit(P[3] - P[0]), _unit(P[-4] - P[-1]), TOL_PX**2)

    amostra = np.vstack([_q(b, np.linspace(0, 1, 60)) for b in segs])
    desvio = max(float(np.hypot(*(amostra - p).T).min()) for p in P[::5])

    pts = np.vstack(segs)
    x0, y0 = pts[:, 0].min(), pts[:, 1].min()
    esc = LARGURA / (pts[:, 0].max() - x0)
    f = lambda p: ((p[0] - x0) * esc, (p[1] - y0) * esc)
    nu = lambda v: '%g' % round(v, 2)

    d = 'M%s %s' % tuple(nu(v) for v in f(segs[0][0]))
    for b in segs:
        d += 'C%s %s %s %s %s %s' % tuple(nu(v) for c in b[1:] for v in f(c))
    return {'d': d + 'Z', 'largura': LARGURA,
            'altura': round(float((pts[:, 1].max() - y0) * esc), 2),
            'curvas': len(segs), 'desvio_px': round(desvio, 2)}


if __name__ == '__main__':
    g = gesto()
    if '--json' in sys.argv:
        print(json.dumps(g, ensure_ascii=False))
    else:
        print(g['d'])
        print('# %d cúbicas · %g × %g · desvio máx %.2f px na foto'
              % (g['curvas'], g['largura'], g['altura'], g['desvio_px']), file=sys.stderr)
