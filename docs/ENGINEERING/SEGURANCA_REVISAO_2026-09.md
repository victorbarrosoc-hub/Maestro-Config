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

## Fechado no código — 6 de setembro (v165)

**Material de um cliente aparecia em outro.** O id do card é do cliente, não da
casa: na semente a Loja Norte tem cards de 1 a 7 e a EJUP também. `S.mat` e
`S.refs` guardavam por id e mais nada, então os dois cards 1 dividiam a mesma
pilha de anexos — e a pilha vai para a linha do banco de cada cliente e para o
link de aprovação dele. Arte de um cliente podia, portanto, aparecer no link do
outro. O sintoma que denunciou foi mais inocente: uma tarefa recém-criada
mostrando "10 peças anexadas".

A chave passou a ser `cliente|id`; a sincronia grava com o dono da linha; os
botões que atravessam clientes levam o dono no atributo; e os dois lugares que
ainda criavam id com `Math.max(ids desta pauta)+1` passaram a usar o contador
ancorado no relógio da v151. O que estava guardado no aparelho com a chave
antiga volta com dono. Provado em `web/verificar/v165-material-por-cliente.mjs`
— 21 provas, vermelhas na v164 e verdes na v165.

## Fechado pelo founder — 7 de setembro

3. **Políticas do bucket `midia`** ✅. O bucket tinha três políticas, todas para
   `public`: subir, apagar e ler. Como a chave publicável está no código da
   página, à vista, qualquer pessoa podia trocar arte já aprovada depois do
   aceite, ou apagá-la. Agora subir, apagar e trocar exigem `authenticated`, e
   trocar um arquivo existente exige ser o dono — que é o que fecha o
   "sobrescrever a peça depois do aceite". A leitura continua pública de
   propósito: é dela que dependem os links de aprovação de quem não tem login.

   O rascunho que estava neste projeto **fechava errado**, e falhava parecendo
   sucesso: o loop de limpeza não encontrava a política de `insert` (a condição
   dela mora em `with_check`, e o filtro olhava só o `qual`), enquanto a de
   `select` fechava a leitura. Quem o rodasse ficaria com os links quebrados e
   o buraco de escrita intacto. Corrigido em `bucket-midia-politicas.sql`, com
   o defeito preservado como PROVA 0 de `bucket-midia-teste.sql` — 10 provas
   contra um PostgreSQL 16.13. O founder rodou em 7 de setembro: quatro
   políticas, `{public}` só no SELECT.

## Do founder — continua aberto
1. Limite de tentativas na porta dos links (hoje não há contador; a chave tem
   22 caracteres de `crypto`, o que torna a busca inviável, mas um limite por
   IP seria mais honesto).

## Como foi verificado

`web/verificar/revisao-geral.mjs` (seção 4): toast com `<img onerror>` não
executa; `urlSegura` barra `javascript:` e `data:text/html`; logo com aspas não
vira atributo; tokens vêm do crypto; a chave da IA não aparece no DOM; quem chega
por link não grava o retrato. A varredura de todas as telas rodou com o CSP
aplicado, sem nenhuma violação no console.
