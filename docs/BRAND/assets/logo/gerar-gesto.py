#!/usr/bin/env python3
"""O Gesto — o símbolo da Maestro, desenhado pelo founder.

Revisão 2: curvilíneo como um movimento perfeito. A espinha agora são
TRÊS arcos cúbicos emendados com tangente contínua (subida ao morro,
morro→vale, vale→ponta) — nada de polilinha suavizada, que deixava
ondulação parasita. A largura é interpolada com cosseno entre âncoras,
sem quebra de derivada. Mudar o símbolo é mudar estes números.
"""
import math

# nós da espinha: (ponto, tangente unitária, força de saída, força de chegada)
# tangente horizontal no topo do morro e no fundo do vale = curvas limpas
NOS = [
    ((8,  114), (0.47, -0.88),  30, 0),    # a entrada, deitada como a dele
    ((57,  53), (1.0,   0.0),   18, 24),   # o topo do morro, mais fechado
    ((93,  98), (1.0,   0.0),   19, 17),   # o vale em u, estreito e fundo
    ((239,  3), (0.84, -0.545),  0, 68),   # a ponta — o fio, longe
]
# âncoras de largura ao longo do traço (t, largura)
LARGURAS = [(0.0, 16.0), (0.24, 12.5), (0.42, 8.5), (0.55, 5.5),
            (0.70, 3.2), (0.85, 1.8), (1.0, 0.8)]

def bezier(p0, p1, p2, p3, t):
    u = 1 - t
    return (u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
            u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1])

def espinha(pontos_por_arco=120):
    linha = []
    for i in range(len(NOS) - 1):
        (a, ta, fa, _), (b, tb, _, fb) = NOS[i], NOS[i+1]
        c1 = (a[0] + ta[0]*fa, a[1] + ta[1]*fa)
        c2 = (b[0] - tb[0]*fb, b[1] - tb[1]*fb)
        for k in range(pontos_por_arco):
            linha.append(bezier(a, c1, c2, b, k / pontos_por_arco))
    linha.append(NOS[-1][0])
    return linha

def largura_em(t):
    """cosseno entre âncoras: sem quebra de derivada em nenhum ponto"""
    for (t0, w0), (t1, w1) in zip(LARGURAS, LARGURAS[1:]):
        if t <= t1:
            f = (t - t0) / (t1 - t0)
            f = (1 - math.cos(f * math.pi)) / 2
            return w0 * (1 - f) + w1 * f
    return LARGURAS[-1][1]

def gesto_path():
    linha = espinha()
    # comprimento acumulado — a largura anda pelo comprimento, não pelo índice
    acum = [0.0]
    for i in range(1, len(linha)):
        acum.append(acum[-1] + math.hypot(linha[i][0]-linha[i-1][0],
                                          linha[i][1]-linha[i-1][1]))
    total = acum[-1]
    n = len(linha)
    cima, baixo = [], []
    for i, (x, y) in enumerate(linha):
        x0, y0 = linha[max(0, i-1)]
        x1, y1 = linha[min(n-1, i+1)]
        dx, dy = x1-x0, y1-y0
        d = math.hypot(dx, dy) or 1
        nx, ny = -dy/d, dx/d
        w = largura_em(acum[i] / total) / 2
        cima.append((x + nx*w, y + ny*w))
        baixo.append((x - nx*w, y - ny*w))
    # tampa redonda na entrada
    x0, y0 = linha[0]
    ux, uy = NOS[0][1]
    nx, ny = -uy, ux
    w0 = LARGURAS[0][1] / 2
    tampa = []
    for k in range(1, 14):
        ang = math.pi * k / 14
        tampa.append((x0 - math.cos(ang)*nx*w0 - math.sin(ang)*ux*w0,
                      y0 - math.cos(ang)*ny*w0 - math.sin(ang)*uy*w0))
    pts = cima + baixo[::-1] + tampa
    return 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + ' Z'

if __name__ == '__main__':
    print(gesto_path())
