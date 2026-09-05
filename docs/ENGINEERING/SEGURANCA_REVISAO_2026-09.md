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

## Fechado pelo founder — 4 de setembro

1. **RLS do Supabase** ✅ (`docs/ENGINEERING/SUPABASE_FECHAR_A_BRECHA.md`). Era o
   item que fazia todo o resto ser decorativo: as políticas eram `using(true)` e
   quem tivesse a chave publicável lia e escrevia tudo. O founder rodou o SQL e
   conferiu dos dois lados — sem login a API responde `[]`; logado, os clientes e
   as pautas carregam. Falta confirmar só a gravação, pelo selo do Cronograma
   (`salvo 14:32` = insert/update valendo).

2. **Validação dos links no servidor** ✅ (5 set, v152). Era o item 2 da lista
   do founder: o link de aprovação e o de visualização passaram a ser resolvidos
   por três funções `security definer`, que conferem o token e devolvem só
   aquele cliente ou aquele card — em vez de mandar a tabela ao navegador e
   filtrar lá. A decisão do cliente também volta por lá, com fase, campos e
   histórico limitados. Provado contra um PostgreSQL 16 de verdade e no
   navegador: `docs/ENGINEERING/LINKS_ANONIMOS.md`. O founder rodou o SQL no
   Supabase em 5 de setembro — a porta está de pé.

## Do founder — continua aberto
1. **Políticas do bucket `midia`**: gravação só para `authenticated`, e sem
   `x-upsert` para quem não é dono do caminho. Enquanto a leitura do bucket
   continuar pública, a arte carrega nos links; ao fechá-la, os links precisam
   de URL assinada (ainda não têm).
2. Limite de tentativas na porta dos links (hoje não há contador; a chave tem
   22 caracteres de `crypto`, o que torna a busca inviável, mas um limite por
   IP seria mais honesto).

## Como foi verificado

`web/verificar/revisao-geral.mjs` (seção 4): toast com `<img onerror>` não
executa; `urlSegura` barra `javascript:` e `data:text/html`; logo com aspas não
vira atributo; tokens vêm do crypto; a chave da IA não aparece no DOM; quem chega
por link não grava o retrato. A varredura de todas as telas rodou com o CSP
aplicado, sem nenhuma violação no console.
