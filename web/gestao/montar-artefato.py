#!/usr/bin/env python3
"""Monta a Gestão num arquivo só, para publicar como artifact do claude.ai.

O artifact roda numa moldura fechada: só scripts de CDN, nada de fetch para
o banco, fonte só embutida. Então: o CSS e os nove scripts entram inline, a
Inter vira data URI, e `window.GESTAO_ARTEFATO` liga o modo em que a Gestão
abre direto na empresa de exemplo e os links ("Abrir a Maestro", "Entrar com
a conta da agência") vão para o site de verdade.

Uso:  python3 web/gestao/montar-artefato.py <saída.html>
"""
import base64, pathlib, sys

AQUI = pathlib.Path(__file__).resolve().parent
ORIGEM = 'https://www.sejamaestro.com.br'
SCRIPTS = ['modelo', 'espelho', 'banco', 'motor', 'demo', 'ui', 'telas', 'folhas', 'app']

def main(saida):
    css = (AQUI / 'gestao.css').read_text(encoding='utf-8')
    fonte = base64.b64encode((AQUI / 'inter.woff2').read_bytes()).decode()
    css = css.replace('url(/web/gestao/inter.woff2)', f'url(data:font/woff2;base64,{fonte})')
    assert 'data:font/woff2' in css, 'a fonte não entrou'
    # a moldura do artifact já afasta a página das barras do sistema
    css += '\n.topoCel{ top:env(safe-area-inset-top, 0px); padding-top:10px }\n'
    partes = [
        '<title>Maestro Gestão</title>',
        '<meta name="theme-color" content="#1C1C1F">',
        f'<style>\n{css}\n</style>',
        '<div id="app"><div class="porta"><p class="dica">Carregando a gestão…</p></div></div>',
        '<script>\nwindow.GESTAO_ARTEFATO = { origem: %r };\n' % ORIGEM +
        "try{ var t = localStorage.getItem('maestro-gestao-tema'); if(t === 'claro' || (!t && document.documentElement.getAttribute('data-theme') === 'light')) document.documentElement.dataset.tema = 'claro'; }catch(e){}\n</script>",
    ]
    for nome in SCRIPTS:
        js = (AQUI / f'{nome}.js').read_text(encoding='utf-8')
        assert '</script' not in js.lower(), f'{nome}.js tem </script> — quebraria o arquivo'
        partes.append(f'<script>\n{js}\n</script>')
    html = '\n'.join(partes) + '\n'
    pathlib.Path(saida).write_text(html, encoding='utf-8')
    print(f'{saida}: {len(html.encode()) / 1024:.0f} KB')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'maestro-gestao.html')
