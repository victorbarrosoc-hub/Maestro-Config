# Dados em tempo real — do documento inteiro para a linha que mudou

Status: Etapa 0 aplicada no banco (26 set) · Etapa 1 pronta e provada; app v271 no ar em 26 set · falta o SQL e ligar
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

### Etapa 0 — rede de segurança (APLICADA no banco em 26 set · `dados-0-historico.sql`, 31 provas)

- `pauta_historico` registra toda gravação: quem, revisão, e o que sumiu,
  esvaziou ou perdeu mídia. Em perigo, guarda sempre a cópia de antes.
- `maestro_restaurar_card(cliente, card, versão)` devolve **um** card com a
  mídia, sem tocar nos outros. `maestro_restaurar_linha` devolve a linha inteira.
- `pauta_copias` faz uma cópia diária por 14 dias, com `pg_cron`.

### Etapa 1 — card e mídia em tabela (pronta, falta ligar · `dados-1-cards.sql`, 44 provas + app v271, 51 provas)

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

**No app (v271, `web/dados/tempo-real.js`):**

A camada é carregada à parte, porque o protótipo está no teto de 3,05 MB. Ela
só liga quando a agência está virada no banco; sem isso, ou sem o arquivo, o
app é exatamente o de antes (provas 10.1 a 10.4). As telas não mudaram:
`S.pautas`, `S.mat`, `S.refs` e `S.lixeira` seguem sendo o que elas desenham.
O que mudou é quem enche e quem esvazia essas listas.

1. **Lê das tabelas.** Na carga, `cards` e `card_midias` montam as quatro
   listas, na ordem guardada.
2. **Grava por campo.** Antes de cada gravação do `Sincro`, cada card manda só
   os campos que mudaram, com a versão que a tela conhecia. No conflito, a
   tela mostra o que está no banco e avisa "Outra pessoa mudou X agora". O
   botão "Recuperar a minha" devolve a versão de quem perdeu.
3. **O formulário velho não apaga.** Um editor aberto antes de uma mudança
   remota devolve o valor antigo ao salvar. A camada reconhece esse eco e
   mantém o que chegou (prova 2b, pelo editor de verdade).
4. **Tempo real.** `postgres_changes` em `cards` e `card_midias`, filtrado
   pela agência, entrega a mudança em milissegundos. Sem o canal, a camada
   pergunta a cada 4s "o que mudou desde X?".
5. **Lixeira.** Pôr na lixeira apaga, "Resgatar" restaura, "Esvaziar" varre.
   Card apagado não volta, nem por tela velha nem por app antigo.
6. **Ausência não é exclusão.** Card que some da tela sem ir à lixeira volta.
7. **Sem rede.** O que mudou fica numa fila, só com os campos, e sobe sozinho
   quando a rede volta, mesmo depois de fechar o app.
8. **A linha `pauta` do app vai sem as chaves de card.** O resto dela
   (projetos, painel) segue pelo `Sincro`; o banco remonta o espelho, e o link
   do cliente continua lendo dele.

Provas: `web/verificar/v271-o-card-em-tempo-real.mjs`, 51 provas. Dois
navegadores de verdade contra um Postgres com os dois arquivos SQL de
verdade; a suíte só faz o papel do PostgREST e do Realtime.

**Ficou para depois, de propósito:**
- A ordem arrastada à mão dentro de uma coluna. O Ensaio ordena as
  **tarefas**, e tarefa é a Etapa 2.
- O portão que recarrega o app antigo. Até lá, a trava protege o banco. Num
  aparelho com o app antigo, resgatar da lixeira não funciona até recarregar.

**Como ligar (na ordem):**
1. Rodar `dados-1-cards.sql` no SQL Editor. Ele só cria tabelas e funções;
   nada muda enquanto a agência não for ligada.
2. Publicar o app v271. Ele também não muda nada enquanto a agência não for
   ligada.
3. `select public.maestro_cards_ligar('maestro');`. Se houver card sem número
   válido, ele recusa e diz quais.
4. Abrir o app de novo em cada aparelho.

Para voltar atrás: `select public.maestro_cards_desligar('maestro');`. A pauta
está completa, porque o espelho nunca parou.

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
