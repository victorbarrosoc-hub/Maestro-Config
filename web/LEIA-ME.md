# web/ — o que o Vercel serve

`index.html` é **gerado**, não editado à mão. A fonte é
`docs/UX/prototipo-plataforma.html`.

```bash
bash web/build.sh      # remonta o index.html com os metadados de app
```

O `montar.py` troca o cabeçalho do protótipo pelo cabeçalho de app: manifesto,
`apple-touch-icon`, `apple-mobile-web-app-capable` e cor de tema. O resto do
arquivo passa intacto.

## Vercel

O `vercel.json` na raiz reescreve `/` para `/web/index.html`, então não é
preciso configurar Root Directory no painel. Basta apontar o projeto para o
repositório.

## Tela de início do iPhone

Safari → compartilhar → **Adicionar à Tela de Início**. Abre em tela cheia
(`display: standalone`), sem barra do navegador, com o M em latão como ícone.

Os ícones em `icones/` são gerados por código (sem dependência externa) — o
gerador está no histórico do commit que criou esta pasta.
