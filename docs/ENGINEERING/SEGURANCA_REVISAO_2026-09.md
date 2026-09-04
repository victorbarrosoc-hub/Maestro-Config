# Revisão de segurança — setembro de 2026 (v140)

Revisão do protótipo servido em sejamaestro.com.br (`web/index.html`, gerado de
`docs/UX/prototipo-plataforma.html`). O que foi corrigido no código está na v140.
O que depende do founder está marcado.

## Corrigido na v140

| Risco | O que era | O que ficou |
|---|---|---|
| XSS pelo aviso (toast) | O texto do toast entrava no `innerHTML` sem escape, e carrega nome de card, cliente e pessoa — escritos por outra gente e sincronizados pelo banco | `toast()` escapa a mensagem na entrada. Nenhum toast usa marcação, então nada muda na tela |
| Injeção por `src`/`poster` | Logo do cliente, foto da pessoa e URL de material/arte entravam crus em `<img>`, `<video>` e `<audio>` | `urlSegura()`: só `http(s):`, `blob:` e `data:` de imagem/vídeo/áudio, sempre escapado |
| Tokens de link fracos | Link de aprovação (8 chars de `Math.random`) e link de visualização (~31 bits) | `tokenForte()` com `crypto.getRandomValues`: 22 e 18 caracteres. Links antigos continuam valendo |
| Chave da IA no DOM | O modal preenchia o `<input>` com a chave (visível no inspetor) | O campo vem vazio com a dica "chave guardada"; vazio = manter |
| Sair não derrubava a sessão | Só apagava o `localStorage`; o refresh token continuava válido | `sair()` chama `/auth/v1/logout` antes de limpar |
| Upload só com a chave anônima | O XHR de upload não levava o token de quem está logado | Vai com o `Bearer` da sessão quando existe |
| Quem chega por link guardava tudo | O retrato inteiro da agência ia para o `localStorage` do aparelho do cliente | `guardarTudo()` não roda em `?aprovar=` nem em `?ver=` |
| Sem CSP | Qualquer script podia mandar dados para qualquer lugar; a página podia ser embutida (clickjacking) | `vercel.json`: CSP com `connect-src` só para Supabase, Anthropic e cdnjs (pdf.js), `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy` |

## Do founder — continua aberto

1. **RLS do Supabase** (`docs/ENGINEERING/SUPABASE_FECHAR_A_BRECHA.md`). Hoje as
   políticas são `using(true)`: quem tem a chave publicável (está na página) lê e
   escreve todas as linhas da tabela `pauta` — pautas, briefings, e-mails da
   equipe e as chaves de todos os links de aprovação. Todo controle no código
   (RBAC, trava de gravação) é decorativo até isso fechar. O código já manda o
   JWT do usuário nas chamadas; falta só o SQL do documento.
2. **Políticas do bucket `midia`**: gravação só para `authenticated`, e sem
   `x-upsert` para quem não é dono do caminho.
3. Depois do RLS: validar o link de aprovação e o de visualização no servidor
   (uma RPC por token que devolve só aquele cliente/card), em vez de mandar a
   tabela inteira ao navegador e filtrar lá.

## Como foi verificado

`web/verificar/revisao-geral.mjs` (seção 4): toast com `<img onerror>` não
executa; `urlSegura` barra `javascript:` e `data:text/html`; logo com aspas não
vira atributo; tokens vêm do crypto; a chave da IA não aparece no DOM; quem chega
por link não grava o retrato. A varredura de todas as telas rodou com o CSP
aplicado, sem nenhuma violação no console.
