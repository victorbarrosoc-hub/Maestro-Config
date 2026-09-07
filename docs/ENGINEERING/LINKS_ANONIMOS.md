# Os links de aprovação com a RLS fechada

Status: **de pé** — código verificado (v152) e o SQL rodado no Supabase
Data: 5 de setembro de 2026

---

## 1. O que quebrou, e por quê

Em 4 de setembro a RLS do Supabase foi fechada: só o papel `authenticated`
lê e escreve na tabela `pauta`. Foi a correção certa — antes, qualquer
pessoa com a chave publicável lia a base inteira.

Só que duas portas do produto existem **justamente para quem não tem conta**:

| Link | Quem abre | Para quê |
|---|---|---|
| `?aprovar=<cliente>.<chave>` | o cliente da agência | ver o lote e decidir |
| `?ver=<cliente>.<card>.<token>` | qualquer pessoa | ler um card só |

Para essas pessoas o banco passou a responder `[]`. E `[]` aqui não é "não
tem nada": é "você não pode ver". O efeito, em ordem:

1. A carga falha, o app marca "só neste aparelho" e a chave do link
   (que mora em `__config__`) nunca chega.
2. Sem a chave, o app nunca entra na tela do cliente — o aprovador fica
   olhando o site.
3. Pior: um cliente criado dentro do app tem id **posicional** (`n0`,
   `n1`…). No aparelho de quem só tem o link, `n0` resolve para o cliente
   de **demonstração** que o protótipo semeia. Quando alguma coisa
   aparecia, podia ser a pauta errada.
4. E a decisão do cliente não voltava: ele aprovava, o app dizia "a
   agência já sabe", e a gravação era recusada em silêncio. Ficava no
   celular dele.

## 2. A porta, em vez da parede

Reabrir a tabela para `anon` desfaria a correção de setembro. O caminho é
uma porta estreita: três funções `security definer` no Postgres, que rodam
com privilégio próprio mas **só entregam o que o token do link autoriza**.

| Função | Quem chama | O que faz |
|---|---|---|
| `maestro_link_lote(cliente, chave)` | `?aprovar=` | devolve o cliente e a pauta dele |
| `maestro_link_card(cliente, card, token)` | `?ver=` | devolve **um** card |
| `maestro_link_decidir(cliente, chave, card, fase, nota)` | a decisão | grava a resposta do cliente |

O que a porta **não** deixa passar:

- card que o cliente ainda não viu (fases `rascunho`, `criado`, `revisao`)
  não sai no lote, e não pode ser decidido;
- anexo de um card escondido não viaja junto;
- a chave e o token **não voltam** na resposta (quem tem o link já os tem);
- a chave de um cliente não abre a pauta de outro;
- decidir só muda fase, `ajustePendente` e o histórico de alterações. Não
  cria card, não apaga, não mexe em texto, data, nem em outra linha;
- `agendado` e `postado` ficam de fora de propósito: agendar e publicar
  são da agência;
- a nota do cliente entra com no máximo 2000 caracteres, e o histórico
  para de crescer em 200 entradas.

Cada gravação **sobe a revisão da linha** (`dados.rev`) e carimba o card
com a hora (`mod`). É o que faz o motor de sincronia da v151, do lado da
agência, perceber a decisão e preferi-la a uma edição mais velha.

## 3. O que o founder fez (5 de setembro)

Rodou o arquivo abaixo no SQL Editor do Supabase, uma vez, e o editor
respondeu `Success`. Fica registrado porque é o passo a refazer se o projeto
do Supabase for recriado do zero:

```
cole e rode  docs/ENGINEERING/links-anonimos.sql
```

É idempotente (pode rodar de novo). Ele cria as funções, tira o acesso de
todo mundo e devolve `execute` só para `anon` e `authenticated`. A tabela
`pauta` continua fechada como está hoje — nada de política nova nela.

Para conferir que pegou, no mesmo editor:

```sql
select public.maestro_link_lote('n0', 'uma-chave-que-nao-existe');   -- null
```

Antes de rodar o SQL o app não quebra: ele bate na porta, vê que ela não
existe e segue como antes. Foi o que aconteceu na primeira tentativa —
`ERROR 42883: function does not exist` — porque a conferência foi rodada
antes do arquivo. Primeiro o arquivo, depois a conferência.

## 4. Como foi verificado

**No banco.** `docs/ENGINEERING/links-anonimos-teste.sql` levanta um
Postgres de rascunho com os papéis `anon`/`authenticated`, a mesma RLS do
Supabase e dados de exemplo, aplica o arquivo de verdade e testa como quem
chega pelo link. Rodado em PostgreSQL 16.13 no dia 5: passou inteiro —
tabela fechada para o anônimo, chave errada não abre, rascunho não vaza,
anexo de card escondido não viaja, chave de um cliente não abre a pauta de
outro, decisão grava e sobe a revisão, e entrada torta (injeção, nulos,
card não numérico, chave curta) é recusada.

**No app.** `web/verificar/v152-link-rpc.mjs` — 41 checagens num navegador
de verdade, com um banco de mentira que fala PostgREST e devolve `[]` na
tabela (como o Supabase faz hoje para o anônimo):

1. o lote abre pelo link, sem o rascunho interno, e o cliente do banco
   vence o cliente de demonstração que o aparelho semeia;
2. chave errada não abre e a pessoa é avisada do que fazer;
3. aprovar chega ao banco, sobe a revisão e carimba a hora;
4. pedir alteração leva o recado junto e marca ajuste pendente;
5. sem rede, a resposta fica numa fila no aparelho, a pessoa é avisada de
   que ainda não foi, e ela vai sozinha quando a rede volta;
6. banco sem as funções: nada quebra;
7. o link de um card abre a folha e não escreve nada — e não deixa o card
   guardado no aparelho de quem abriu;
8. token errado não abre;
9. alteração num card de texto (que termina em `rascunho`) é aceita.

## 5. Uma coisa que o teste ensinou

Um gesto do cliente move a fase do card **mais de uma vez**: `decidirCard`
manda o card para produção e, logo depois, a camada do ciclo devolve ao
Plan (`texto_ok`; num card de texto, `rascunho`). Mandar as duas seria
mandar uma decisão pela metade — a segunda chegaria sem o recado e
apagaria o "ajuste pendente" da primeira. A fila espera o gesto terminar e
manda **uma**, a final.

## 6. O que continua aberto

- **Storage.** A arte carrega porque o bucket `midia` tem leitura pública, e
  ela foi mantida assim de propósito em 7/set, quando a escrita foi fechada
  (`bucket-midia-politicas.sql`): subir, apagar e trocar passaram a exigir
  login, a leitura não. Fechar também a leitura exige servir por URL assinada,
  que o app ainda não faz — é o que falta aqui.
- **Limite de tentativa.** A porta não tem contador: alguém pode tentar
  chaves em sequência. São 22 caracteres de `crypto.getRandomValues`, o
  que torna a busca inviável na prática, mas um limite por IP no Supabase
  (ou um `pg_sleep` de 200 ms na recusa) seria mais honesto.
- **Id posicional.** `n0`, `n1`… vêm da posição em `S.novos`. Dois
  aparelhos criando clientes sem sincronizar no meio podem trocar os ids.
  Isso é trabalho de id vindo do servidor — API, não protótipo (D-080).
