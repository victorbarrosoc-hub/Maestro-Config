# Dados em tempo real — do documento inteiro para a linha que mudou

Status: Etapa 0 e o banco da Etapa 1 prontos e provados · app da Etapa 1 a fazer
Data: 25 set 2026

## O pedido

> "Cards que apaguei voltando, card que não libera no check, mídia dentro do
> card sumindo, card mudando de posição na etapa sozinho, informações de texto
> sumindo… tá resetando? Atingindo o limite aí reseta? Quero que mude em quase
> tempo real de um dispositivo pra outro, igual em outras plataformas."

## O diagnóstico

**Não é reset e não é limite do banco.** O único limite que já apagou dado foi
o do navegador (~5 MB), e ele foi fechado na v247.

A causa comum é a arquitetura. Cada cliente é **um documento** (`pauta.dados`
com pauta, mats, refs e lixeira), e o mesmo vale para a casa (`__estado__`). Cada
aparelho guarda uma cópia e sobe **o documento inteiro**. Quando duas cópias
divergem, o navegador faz uma mescla de três lados para decidir quem ganha.

O código mede o custo disso:

| Indicador | Quantidade |
|---|---|
| Pontos de mescla | 79 |
| Referências a lápide | 62 |
| Usos de `localStorage` | 85 |
| Camadas que embrulham funções | 418 |
| Consertos de perda de dado, v151 → v269 | 19 |

Cada queixa é um jeito de a mescla errar:

| Queixa | O que acontece por baixo |
|---|---|
| Card apagado volta | Uma cópia sem a lápide ganha a mescla (v195, v196, v266) |
| Texto some | Duas telas mexem no mesmo card e o documento inteiro de uma cobre a outra (v246) |
| Mídia some | O `blob:` fica no estado (v218) e a lista sem `id` é escolhida inteira (v226) |
| Card muda de lugar | A ordem é **deduzida**, não guardada |
| Card sem "liberar" no Check | Regra que só olhava `texto` (fechado na v270) |
| Demora entre telas | Quem só olha busca a cada 3s; o Realtime avisa só o NOME da linha (v257) |

Enquanto a verdade morar no aparelho, vai aparecer o 20º conserto.

## O modelo novo

Plataformas como Linear, Notion e Figma funcionam assim, e são quatro ideias:

1. **Uma linha por coisa.** Card, mídia e (depois) tarefa têm tabela própria.
   Uma mudança toca uma linha, não o cliente inteiro.
2. **Escrita por campo, no servidor.** A tela manda "legenda = X na versão 7",
   não o documento. Duas pessoas em campos diferentes nunca se apagam. No mesmo
   campo, quem chega depois recebe o **conflito** com o valor de agora (prova 6)
   em vez de apagar.
3. **Apagar é marca, não ausência.** `apagado_em` numa linha que continua
   existindo. Cópia velha não ressuscita (prova 10), ausência não apaga
   (prova 12), e esvaziar a lixeira só tira dela (prova 23).
4. **O banco avisa a linha.** Supabase Realtime `postgres_changes` em `cards` e
   `card_midias`: a outra tela recebe a linha nova em ~0,3s, sem buscar nada.

O aparelho vira **cache**. O que ele guarda serve para abrir rápido e trabalhar
sem rede (fila de mudanças por campo), nunca para decidir o que é verdade.

## As etapas

### Etapa 0 — rede de segurança (pronta · `dados-0-historico.sql`, 31 provas)

- `pauta_historico` registra toda gravação: quem, revisão, e o que sumiu,
  esvaziou ou perdeu mídia. Em perigo, guarda sempre a cópia de antes.
- `maestro_restaurar_card(cliente, card, versão)` devolve **um** card com a
  mídia, sem tocar nos outros. `maestro_restaurar_linha` devolve a linha inteira.
- `pauta_copias` faz uma cópia diária por 14 dias, com `pg_cron`.

### Etapa 1 — card e mídia em tabela (banco pronto · `dados-1-cards.sql`, 38 provas)

- **Tabelas.** `cards` guarda `versao` por card e `campos_versao` por campo,
  `posicao` e `apagado_em` / `varrido_em`. `card_midias` separa `mat` (peça) e
  `ref` (link). `cards_historico` guarda cada campo com antes, depois e autor.
- **Portas** (`authenticated`, sempre da agência de quem está logado):
  - `maestro_card_criar`, `_mudar(cliente, id, base, campos, tirar, posicao)`,
    `_apagar`, `_restaurar`, `_varrer`;
  - `maestro_midia_por`, `_mudar`, `_tirar`, `_devolver`, `_ordenar`.

  Escrever direto na tabela é recusado (prova 30). O número do card vem do
  banco (prova 21, adeus v199). `blob:` não entra (prova 17).
- **O espelho.** A linha `pauta` de cada cliente continua existindo e é
  remontada pelo banco a cada mudança. Por isso o link do cliente
  (`maestro_link_lote`, `_card`, `_decidir`) e os aparelhos com o app antigo
  seguem funcionando sem mudar nada.
- **A trava da pauta.** Quem ainda grava na pauta (a decisão do cliente pelo
  link, um aparelho antigo) tem a gravação traduzida em **diferença por campo
  contra a linha atual**:
  - campo mudado muda aquele campo;
  - card novo nasce;
  - card apagado continua apagado;
  - card ausente não é apagado;
  - card que entrou na lixeira é apagado;
  - mídia nova entra;
  - mídia retirada fica marcada.

  A decisão do cliente chega à tabela e dispara o tempo real (prova 13).
- **Reversível.** `maestro_cards_ligar(org)` copia tudo e liga a trava.
  `maestro_cards_desligar(org)` volta ao jeito antigo com a pauta completa,
  porque o espelho nunca parou (prova 37).
- **Uma decisão tomada nas provas.** Uma cópia velha, com o card fora da
  lixeira e de volta na lista, é **idêntica** a uma restauração feita pela
  pauta. Na dúvida, a exclusão vence: restaurar é pela porta ou pelo histórico.

**No app (a fazer):**

1. Ler `cards` e `card_midias` e montar `S.pautas` e `S.mat` a partir delas.
   As telas não mudam.
2. Trocar `sbGravar(cliente)` por chamadas de campo. Cada tela que edita um
   card manda só os campos que mudaram, com a `versao` que abriu. Conflito vira
   aviso: "Fulano mudou a legenda agora — ficar com a dele ou a sua?".
3. Assinar `postgres_changes` em `cards` e `card_midias` no canal que a v257
   já abre (hoje `postgres_changes: []`) e aplicar a linha recebida.
4. Mover no Ensaio e no Cronograma grava `posicao` (meio entre vizinhos).
5. Fila sem rede: as mudanças por campo ficam guardadas e sobem na ordem ao
   voltar a rede, e o conflito aparece do mesmo jeito.
6. Portão de versão: o app antigo, numa agência ligada, recarrega. A trava
   protege o banco enquanto isso.
7. A mescla de três lados **sai** para cards e mídia. É o que tira de cena as
   causas da maioria dos 19 consertos.

### Etapa 2 — tarefas do Ensaio em tabela

O mesmo desenho para `S.ensaio.tarefas`: coluna e posição guardadas,
responsável e cronômetro por campo.

### Etapa 3 — o resto do `__estado__`

Equipe, CRM, conversas (mensagem é linha e só se acrescenta) e configuração.
Ao fim, o `localStorage` guarda só cache e preferência.

**Durante as etapas 1 e 2, feature nova na plataforma fica congelada.** Cada
feature nova hoje é mais um lugar em que a mescla pode errar.

## O que o founder roda no Supabase

1. **Etapa 0**: `dados-0-historico.sql` no SQL Editor. Antes, ligar `pg_cron`
   em Database → Extensions, para a cópia diária entrar sozinha.
2. **Backup**: o plano pago tem cópia diária e PITR (voltar a qualquer
   minuto). Settings → Add-ons.
3. **Etapa 1**: `dados-1-cards.sql` só cria (prova 1). Ligar
   (`select maestro_cards_ligar('maestro')`) **só junto com o app da Etapa 1**
   no ar.
