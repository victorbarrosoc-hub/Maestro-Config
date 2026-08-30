#!/usr/bin/env python3
"""O Gesto — o símbolo da Maestro, desenhado pelo founder e vetorizado aqui.

A forma é gerada de uma ESPINHA (a linha do gesto) e um PERFIL DE LARGURA
(grosso na entrada, fino na ponta). Mudar o símbolo é mudar estes números —
nunca editar o path final à mão.
"""
import math

# a espinha do gesto: entrada grossa, morro, vale, e a cauda longa subindo
ESPINHA = [
    (26, 96), (34, 78), (46, 58), (60, 50), (74, 56), (84, 70),
    (92, 80), (102, 84), (112, 80), (128, 68), (152, 50),
    (180, 33), (206, 20), (228, 10),
]
# a largura em cada ponto da espinha (o afilamento é a assinatura)
LARGURA = [15, 15.5, 15, 14, 13.5, 13, 12.5, 11.8, 10.2, 8.2, 5.8, 3.8, 2.0, 0.9]

def catmull_rom(pts, passos=12):
    """espinha suave passando por todos os pontos"""
    out = []
    p = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i-1], p[i], p[i+1], p[i+2]
        for t in range(passos):
            t /= passos
            t2, t3 = t*t, t*t*t
            x = 0.5*((2*p1[0]) + (-p0[0]+p2[0])*t + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3)
            y = 0.5*((2*p1[1]) + (-p0[1]+p2[1])*t + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
            out.append((x, y))
    out.append(pts[-1])
    return out

def largura_em(t):
    """perfil de largura interpolado ao longo da espinha (t em 0..1)"""
    pos = t * (len(LARGURA) - 1)
    i = min(int(pos), len(LARGURA) - 2)
    f = pos - i
    return LARGURA[i] * (1 - f) + LARGURA[i + 1] * f

def gesto_path():
    linha = catmull_rom(ESPINHA)
    n = len(linha)
    cima, baixo = [], []
    for i, (x, y) in enumerate(linha):
        x0, y0 = linha[max(0, i - 1)]
        x1, y1 = linha[min(n - 1, i + 1)]
        dx, dy = x1 - x0, y1 - y0
        d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        w = largura_em(i / (n - 1)) / 2
        cima.append((x + nx * w, y + ny * w))
        baixo.append((x - nx * w, y - ny * w))
    # a entrada ganha uma tampa redonda de verdade: meia-volta de arco
    x0, y0 = linha[0]
    x1, y1 = linha[1]
    dx, dy = x1 - x0, y1 - y0
    d0 = math.hypot(dx, dy) or 1
    ux, uy = dx / d0, dy / d0            # direção da espinha na entrada
    nx, ny = -uy, ux
    w0 = LARGURA[0] / 2
    tampa = []
    for k in range(1, 12):
        ang = math.pi * k / 12
        cx = x0 - math.cos(ang) * nx * w0 - math.sin(ang) * ux * w0
        cy = y0 - math.cos(ang) * ny * w0 - math.sin(ang) * uy * w0
        tampa.append((cx, cy))
    pts = cima + baixo[::-1] + tampa
    d = 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + ' Z'
    return d

if __name__ == '__main__':
    print(gesto_path())
