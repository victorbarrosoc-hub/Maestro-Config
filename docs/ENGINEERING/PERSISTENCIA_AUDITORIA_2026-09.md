# Auditoria da persistência — 4 e 5 de setembro de 2026

Status: **corrigido no protótipo (v151)** · verificado por teste de dois aparelhos
Escopo: `docs/UX/prototipo-plataforma.html` (o protótipo servido em sejamaestro.com.br)

> O relato do fundador: *"Às vezes os dados salvam corretamente no Supabase,
> às vezes parecem salvar apenas localmente, e às vezes o comportamento muda
> completamente, parecendo que o estado local está dessincronizado do banco
> de dados ou sobrescrevendo requisições."*

---

## 1. A stack, para quem não sabia

Não há React, nem `useState`, nem cache de biblioteca. É **um arquivo HTML** de
~32 mil linhas com um estado global `S`, um `render()` que redesenha tudo e
`fetch` cru para o PostgREST do Supabase, tabela `pauta` (uma linha por
`cliente`, coluna `dados` jsonb). Os blocos novos são anexados no fim e
sobrescrevem funções antigas por *wrapper*. Persistência antes da v151:

| Onde | O que | Quem grava | Quem lê |
|---|---|---|---|
| linha por cliente (`ln`, `cj`, `n0`…) | pauta, refs, mats, lixeira, projetos, painel | `sbGravar` (upsert da linha inteira, 1,4 s após cada render) | `sbCarregar` (abertura) |
| `__estado__` | **tudo** de `S` que não está em `PASSAGEIRO` (~90 chaves) | `enviarEstado` (upsert, 1,2 s após cada render e pelo pulso) | `buscarEstado` (abertura +2,6 s, botão ⟳, e a trava da v88) |
| `__config__`, `__chat__`, `__mandala__`, `__cerebro__`, `__estudio__` | cliEdit/cliFora/agência/ensaio, chat, mandala, cérebro, estúdio | cadeia `sbGravarConfig` (1,5 s) | wrappers de `sbCarregar` + timers |
| localStorage `maestro-prototipo-v1` | pautas, novos, mat, refs | `salvarLocal` | abertura |
| localStorage `maestro-estado-v1` | o mesmo pacote do `__estado__` | `guardarTudo` | abertura |

Ou seja: o mesmo dado (`ensaio`, `chat`, `cliEdit`, `lixeira`, `projetos`…)
morava em **duas ou três linhas do banco** e em dois caches locais, cada um
aplicado numa ordem diferente conforme o caminho de entrada.

## 2. Onde estava o gargalo

Não era uma função. Era uma **política**: *quem grava por último vence*,
aplicada a **pacotes inteiros**, combinada com uma releitura que aplicava o
banco por cima da memória.

1. **A trava da v88 desfazia a edição recém-feita.** Toda escrita passava por
   `podeGravar()`; se a aba tinha ficado escondida (trocar de app no celular)
   ou passado 10 min, ela **relia o `__estado__` e o aplicava inteiro sobre
   `S`** — no meio da requisição, com o corpo já serializado com o valor
   novo. Resultado: a mudança sumia da tela, o banco recebia o valor novo, e
   o pulso seguinte (1,2 s) mandava o estado revertido de volta ao banco. O
   dado mais novo perdia para o mais velho, **nos dois lados**. É o
   "comportamento muda completamente".

2. **Cliente que este aparelho não conhecia tinha a pauta apagada.**
   `sbCarregar` ignorava a linha de um cliente fora de `CLIS()` no momento
   da carga (aparelho novo, Safari com dados limpos, ou cliente criado no
   outro aparelho). O cliente chegava 2,6 s depois pelo `__estado__`, a
   pauta dele aqui estava vazia, e o primeiro `sbGravar` subia `pauta: []`
   por cima da linha real. É o "às vezes some".

3. **Escrita perdida em silêncio.** `enviarEstado` descartava a mudança se
   já havia um envio em voo (e a assinatura do pulso já tinha sido
   atualizada: ficava só no localStorage até a próxima edição). Cinco
   gravações laterais engoliam qualquer erro em `catch(e){}`. Um `[]` sem
   sessão virava "só neste aparelho" na abertura e nada tentava de novo.
   `sbCarregar` pintava "salvo" por ter **lido**. É o "salva só
   localmente".

4. **Escrita fantasma a cada abertura.** O jsonb devolve as chaves em outra
   ordem; o espelho (texto) nunca batia e todas as linhas eram reescritas
   1,4 s após cada carga — o que multiplicava as janelas de corrida.

5. **Estado de tela viajava no pacote** (mês do calendário, filtro, modal
   aberto, bandeiras `viaLink`/`soVer`): ler o banco mudava a tela do outro
   aparelho.

## 3. O que mudou (v151)

Arquivo: `docs/UX/prototipo-plataforma.html`. Cinco edições no lugar (as
funções originais delegam para o motor novo, porque timers e listeners
seguram a referência antiga) e um bloco `v151` no fim. Sem mudança de
esquema no banco: a revisão mora dentro do jsonb (`dados.rev`).

| Mudança | Como |
|---|---|
| **Revisão por linha** | Gravar é `PATCH …?cliente=eq.X&dados->>rev=eq.N` com `Prefer: return=representation`. Zero linhas de volta = alguém gravou antes → lê, mescla, tenta de novo (até 4×). Linha nova nasce por `POST` sem `merge-duplicates` (409 = outro criou no meio). |
| **Mescla de três lados** | Base (o que vi por último no banco) × local × remoto, chave por chave no `__estado__` e item por item (por `id`) em pautas, tarefas do Ensaio, lixeira, projetos. Só eu mudei → fica o meu; só lá mudou → entra o de lá; os dois → carimbo mais novo vence (`Sincro.carimbos` por chave; `mod` por card). Contador `prox` nunca volta. |
| **Nenhuma escrita sem leitura** | `sbCarregar` guarda **toda** linha que chega (`Sincro.brutas`), mesmo de cliente ainda desconhecido; quando o cliente aparece, a linha entra antes de qualquer gravação. Primeira escrita de uma linha nunca lida faz `GET` antes. |
| **Sem descarte em voo** | Mudança durante um envio marca `pendente` e reenvia ao terminar. Um relógio de 2 s descarrega o que ficou para trás (telas cujo render sai cedo). |
| **Falha com cara** | Selo do Cronograma, ponto no botão ⟳ (âmbar = pendente, vermelho = falhou), aviso com o motivo: sessão vencida (401, e a porta abre), política da tabela (403), sem rede (tenta de novo sozinho, com recuo exponencial, e no evento `online`). "Salvo" só após 2xx. Uma leitura não apaga um erro de escrita. |
| **Ids de card pelo relógio** | `_pid` nasce de `Date.now()` e volta a ele após cada carga. Antes, dois aparelhos criavam cards com o **mesmo id** e a mescla os tomava por um só. |
| **Estado de tela fica aqui** | `SO_DAQUI` (≈60 chaves de UI) não sobe nem desce pelo `__estado__`. |
| **Sem escrita fantasma** | Espelho comparado por conteúdo canônico, não por texto. |
| **Carga protege o que é meu** | As linhas laterais continuam substituindo a chave inteira ao chegar; o motor guarda o que eu tinha antes e faz três lados nas chaves `cliEdit/cliFora/agencia/ensaio/chat/mandala/cerebro/estudio`. |

Persistência local nova: `maestro-sincro-v1` (hashes por chave, carimbos) e
`maestro-sincro-bases-v1` (a base das linhas por cliente e do pacote, quando
cabe) — é o que permite mesclar depois de recarregar a página.

### Fonte da verdade, hoje

- Pauta, refs, mats, lixeira, projetos, painel: **a linha do cliente**.
- Todo o resto (equipe, ensaio, chat, cliEdit, agência, mandala, cérebro,
  estúdio, peças…): **`__estado__`**, chave por chave.
- As linhas laterais continuam sendo escritas (compatibilidade e leitura na
  abertura), mas o `__estado__` é aplicado depois e decide. Elas podem ser
  aposentadas numa versão futura sem perda.

## 4. Verificação

`web/verificar/v151-persistencia.mjs` — um PostgREST de mentira em memória
(upsert, `PATCH` com filtro em `dados->>rev`, 401/403/rede fora/atraso) e
duas páginas apontando para ele = dois aparelhos. 37 checagens:

1. cliente que só o banco conhecia: a pauta chega inteira e **não é apagada**
   pelo primeiro salvar; abrir sem mexer não reescreve nada; uma tarefa
   criada sem rede sobrevive à recarga que trouxe o `__config__` e sobe
   quando a rede volta;
2. dois aparelhos criam cards no mesmo cliente sem sincronizar: o banco fica
   com os três, os dois aparelhos veem os três, a revisão só cresce;
3. releitura da trava v88 no meio de uma edição do Ensaio: a tarefa fica onde
   a pessoa pôs **e** o movimento do outro aparelho entra;
4. 403: selo "sem salvar", fase `erro` com motivo, pendência declarada,
   aviso, botão vermelho, banco intacto; rede fora → `semRede`; rede volta →
   retoma sozinho, fica `ok` sem pendência e o card chega;
5. 401: `semSessao` e a porta de entrar abre;
6. duas abas escrevendo o mesmo cliente com respostas cruzadas: os dois cards
   sobrevivem e houve `PATCH` recusado pela revisão;
7. link de aprovação não escreve nada.

As 39 suítes anteriores continuam passando (rodadas contra o arquivo novo).

## 5. O que a auditoria achou e **não** cabe no protótipo

| Achado | Por quê fica aberto | Caminho |
|---|---|---|
| Links `?ver=` e `?aprovar=` são anônimos; sob a RLS de 4/set recebem `[]` e o cliente não vê o card nem a chave chega | é servidor: precisa de uma função (RPC) que valide o token do link e devolva só aquele card | `docs/ENGINEERING/SEGURANCA_REVISAO_2026-09.md` § aberto |
| Ids de cliente posicionais (`n0`, `n1`…): dois aparelhos criando clientes sem sincronizar podem trocar de dono | id tem de vir do servidor | API (D-080) |
| `sair()` derruba a sessão do outro aparelho (logout global); duas abas com refresh token rotativo | é o fluxo de auth do Supabase; mudar exige `scope=local` e cuidado com a rotação | pequeno, próxima rodada |
| Upload por XHR usa o token cru, sem renovar: após 1 h ocioso a arte fica só aqui | trocar por `token()` antes do envio | pequeno, próxima rodada |
| Toasts "salvo"/"no ar" disparados no clique, antes da requisição | são muitos pontos; o selo e o ponto do botão já dizem a verdade | UX, sem urgência |
| `__estudio__` substitui o estúdio de todas as pessoas | passa pelo `__estado__` com mescla; a linha lateral segue como estava | aposentar a lateral |

## 6. Como conferir no celular

1. Abrir em dois aparelhos, logado nos dois.
2. Criar um card no cliente X no celular; no computador, sem atualizar,
   criar outro card no mesmo cliente. Esperar 5 s. Tocar ⟳ nos dois: os dois
   cards aparecem nos dois.
3. Trocar de app no celular, voltar, mover uma tarefa no Ensaio: ela fica
   onde ficou (antes, voltava sozinha).
4. Modo avião, mover uma tarefa: ponto vermelho no ⟳ e "sem salvar" no
   selo. Sair do modo avião: some sozinho, "salvo HH:MM".
