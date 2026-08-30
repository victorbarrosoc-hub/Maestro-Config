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

## "Subiu e não mudou nada"

Duas causas, e o jeito de separar as duas em uma batida: **Menu → rodapé**, onde
está `Protótipo vNN · dia`. Se o número for o novo, subiu — o que você está
olhando é outra coisa. Se for o antigo:

1. **O deploy não rodou.** Confira se o commit está na `main` (é ela que o Vercel
   publica) e se o deploy aparece no painel.
2. **O aparelho guardou a página.** O `vercel.json` manda `no-cache` no `/`, mas
   o app da tela de início do iPhone é teimoso: ele pode continuar mostrando a
   cópia antiga mesmo com o servidor respondendo a nova. Abra o mesmo endereço no
   **Safari** (não pelo ícone) para ver a versão do servidor. Se lá estiver nova e
   no ícone estiver velha, era cache — remova o ícone e adicione de novo.

> O `headers` do `vercel.json` casa pelo caminho **pedido**, não pelo destino da
> reescrita. A regra existia só para `/web/index.html`, e ninguém pede esse
> caminho — o telefone pede `/`. Por isso a página principal ficou sem regra de
> cache até 30/08.

## Tela de início do iPhone

Safari → compartilhar → **Adicionar à Tela de Início**. Abre em tela cheia
(`display: standalone`), sem barra do navegador, com o M em latão como ícone.

Os ícones em `icones/` são gerados por código (sem dependência externa) — o
gerador está no histórico do commit que criou esta pasta.
