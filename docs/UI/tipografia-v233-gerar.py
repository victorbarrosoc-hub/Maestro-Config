#!/usr/bin/env python3
"""v233 — gera os ajustes por regra da camada de tipografia.

Lê cada regra de CSS do protótipo que usava var(--mono), var(--serif) ou
fonte abaixo de 11px e devolve a regra de ajuste no MESMO @media, com
:not(.site *). Foi rodado UMA vez, sobre a v232 (o arquivo sem a própria
camada — senão ele lê a si mesmo); o resultado está colado no fim de
docs/UX/prototipo-plataforma.html, em <style id="v233-tipografia">.

    python3 docs/UI/tipografia-v233-gerar.py <prototipo-v232.html>
"""
import re, sys
src = open(sys.argv[1]).read()

def blocos(texto):
    return re.findall(r'<style[^>]*>(.*?)</style>', texto, re.S)

def regras(css):
    """(contexto_at, seletor, corpo) — um nível de @media/@supports."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out = []; i = 0; pilha = []; buf = ''
    while i < len(css):
        c = css[i]
        if c == '{':
            cab = buf.strip(); buf = ''
            if cab.startswith('@media') or cab.startswith('@supports'):
                pilha.append(cab)
            elif cab.startswith('@'):
                # @keyframes/@font-face: pula o bloco inteiro
                d = 1; i += 1
                while i < len(css) and d:
                    d += (css[i] == '{') - (css[i] == '}'); i += 1
                continue
            else:
                j = css.index('}', i)
                out.append((tuple(pilha), cab, css[i+1:j])); i = j
        elif c == '}':
            if pilha: pilha.pop()
            buf = ''
        else:
            buf += c
        i += 1
    return out

def prop(corpo, nome):
    m = re.findall(r'(?:^|;)\s*' + nome + r'\s*:\s*([^;]+)', corpo)
    return m[-1].strip() if m else None

def px(v):
    m = re.match(r'([\d.]+)px', v or '')
    return float(m.group(1)) if m else None

def em(v):
    m = re.match(r'(-?[\d.]+)em', v or '')
    return float(m.group(1)) if m else None

MARCA = {'.logo b', '.aside .lg b', '.clrail .marca', '.fxTopo .marca b', '.sigfield'}
CODIGO = {'.seal', '.estCrono', '.kbTempo', '.hxCrono', '.tempo .v', '.clTC'}

def sel_fora_do_site(sel):
    partes = [p.strip() for p in sel.split(',') if p.strip()]
    ok = []
    for p in partes:
        if '${' in p or p.startswith('.site') or ' .site' in p: return None
        m = re.search(r'::?(before|after|placeholder|first-line|first-letter|marker|selection|-webkit-[a-z-]+)$', p)
        ok.append(p[:m.start()] + ':not(.site *)' + p[m.start():] if m else p + ':not(.site *)')
    return ', '.join(ok)

saida = {}
vistos = 0
for css in blocos(src):
    for ctx, sel, corpo in regras(css):
        if '${' in corpo: continue
        mono = 'var(--mono)' in corpo; serif = 'var(--serif)' in corpo
        fs0 = px(prop(corpo, 'font-size'))
        miudo = fs0 is not None and fs0 < 11
        if not (mono or serif or miudo): continue
        s = sel.strip()
        if s in MARCA or s in CODIGO: continue
        novo = sel_fora_do_site(s)
        if not novo: continue
        imp = lambda nome: ' !important' if re.search(nome + r'\s*:[^;]*!important', corpo) else ''
        decl = []
        if mono:
            tt = prop(corpo, 'text-transform')
            ls = em(prop(corpo, 'letter-spacing'))
            fs = px(prop(corpo, 'font-size'))
            if tt and 'uppercase' in tt:
                decl.append('text-transform:none' + imp('text-transform'))
            if ls is not None and ls > .03:
                decl.append('letter-spacing:0' + imp('letter-spacing'))
            if fs is not None and fs < 11.5:
                novo_fs = 11.5 if fs < 10.5 else 12
                if tt and 'uppercase' in tt: novo_fs = 12
                decl.append('font-size:%gpx' % novo_fs + imp('font-size'))
            if tt and 'uppercase' in tt and not prop(corpo, 'font-weight'):
                decl.append('font-weight:500')
        if miudo and not mono:
            # piso de 11px para todo texto da interface (a revisão contou 13
            # tamanhos na tela do Ensaio; 9px não se lê num celular)
            decl.append('font-size:11px' + imp('font-size'))
        if serif:
            fw = prop(corpo, 'font-weight')
            if not fw or fw.split()[0] in ('400', 'normal'):
                decl.append('font-weight:600' + imp('font-weight'))
            ls = em(prop(corpo, 'letter-spacing'))
            decl.append('letter-spacing:-.015em' + imp('letter-spacing'))
        if not decl: continue
        vistos += 1
        saida.setdefault(ctx, []).append('%s{%s}' % (novo, ';'.join(decl)))
        if any(d.startswith('text-transform:none') for d in decl) and '::' not in novo:
            # o texto é escrito em minúscula e a caixa alta vinha do CSS:
            # sem ela, a inicial sobe (vale onde o elemento é bloco)
            pl = ', '.join(x.strip() + '::first-letter' for x in novo.split(', '))
            saida[ctx].append('%s{text-transform:uppercase}' % pl)

linhas = []
for ctx, rs in saida.items():
    corpo = '\n'.join(rs)
    for at in reversed(ctx):
        corpo = '%s{\n%s\n}' % (at, corpo)
    linhas.append(corpo)
print('/* gerado: %d regras */' % vistos, file=sys.stderr)
print('\n'.join(linhas))
