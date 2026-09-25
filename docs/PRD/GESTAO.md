# PRD — Gestão (MPGP) · a empresa inteira num fluxo só

Status: **construído e no ar à parte**, em `sejamaestro.com.br/gestao` (arquivos
em `web/gestao/`), sem tocar no código da plataforma. 66 provas em
`web/verificar/gestao-fluxo.mjs`. Quando estiver aprovado, mescla (seção 10).
Artifact (empresa de exemplo, para ver no celular):
`claude.ai/artifact/4BwcrJKpWshAYkLt1PHhwa` — montado por
`python3 web/gestao/montar-artefato.py <saída.html>` e republicado no mesmo link.
Fonte: *Manual de Gestão da EJUP no ClickUp* (25/set/2026, Dr. Pivôtto).

---

## 1. O que o manual pede, numa frase

Um PDCA distribuído em cinco áreas — **Estratégico** (Plan), **Comercial** e
**Produção** (Do), **Acompanhamento** (Check-Act), **Pessoas e Conhecimento**
(Act) — em que cada conclusão numa área gera trabalho na seguinte. No ClickUp
isso ficou só no texto das descrições: nenhuma régua própria, nenhum campo,
nenhuma automação, nenhum dashboard (manual, seção 9). Aqui essas lógicas são
o próprio sistema.

## 2. A divisão que evita conflito: trabalho × registro

A Maestro já tem as **cinco frentes do manual** no Ensaio (Estratégico,
Comercial, Produção, Acompanhamento, Pessoas e Conhecimento — v106/v233) e o
quadro do Ensaio **é** a "régua genérica PDCA" do manual (Inbox · Plan · Do ·
Check · Act). Então:

| Onde | O quê | Exemplo |
|---|---|---|
| **Ensaio (plataforma)** | o TRABALHO — tarefas PDCA de todas as frentes | "Gravar episódio 18", "Revisar contrato da Dra. Izabel" |
| **Gestão (este módulo)** | os REGISTROS com régua própria | a oportunidade, o contrato, a parcela, o aluno, a oferta, o projeto MPGP, o KPI |

Um registro nunca vira tarefa duplicada: ele **gera** tarefas (automações) e
mostra as do Ensaio que falam dele. A Produção inteira do manual (Produtora e
Agência) **é a Maestro**: Pré-produção = Plan, Gravação/Edição = Do, Revisão
editorial = Check, Aprovação = Com o cliente, Publicação = Act. A Gestão não
reimplementa nada disso — mostra, só lendo, o estado de produção de cada
cliente e abre a Maestro no card certo.

## 3. O centro: o CLIENTE (conta) e a esteira única

Toda informação tem um lugar só (princípio 1). O cliente é uma **conta**, e a
etapa dele na esteira **não é um campo que alguém edita — é lida dos
registros**. Não existe "a jornada diz ativo mas o contrato está vencido".

```
Prospecção → Negociação → Proposta → Fechamento → Onboarding → Em execução → Renovação → Base & Indicações
 (smart lead)  (MQL/SQL)   (enviada)   (ganho,       (contrato     (produção     (vence em    (farming:
                                        contrato)     assinado)     na Maestro)   ≤60 dias)    recompra, indicação)
```

**Mover o cliente é fazer a ação da etapa**, com a lista do que vai nascer à
vista antes de confirmar. Exemplo — "Marcar como ganho" (B2B/Expert):

- nasce o **Contrato** (A elaborar), com valor, início e fim;
- nascem as **parcelas** em Contas a Receber (mensal, parcelado ou à vista);
- nasce a **jornada** no Acompanhamento (Contrato Ativo B2B em Setup, ou a
  Jornada Expert de 6 meses com as entregas do Mês 1 ao 6);
- se há revenue share, fica registrado para gerar **repasse** a cada
  recebimento;
- tudo entra na **linha do tempo** do cliente, com quem fez e quando.

Ganho B2C: Jornada Pós-Matrícula (Onboarding) + Contas a Receber + Base &
Indicações. Exatamente as passagens da seção 8 do manual, agora automáticas.

## 4. As automações (seção 8 e 10 do manual, todas ligadas)

| Gatilho | O que acontece |
|---|---|
| Oportunidade criada | responsável comercial atribuído (quem criou, ou o padrão) |
| Etapa "Proposta enviada" | nasce a Proposta (Enviada) + tarefa de follow-up em +3 dias |
| Próximo contato chegou | alerta no Hoje do responsável |
| Ganho B2B / Expert | Contrato + Contas a Receber + Contrato Ativo / Jornada Expert |
| Ganho B2C | Jornada Pós-Matrícula + Contas a Receber + Base & Indicações |
| Contrato assinado | onboarding começa; o cliente vai para Onboarding na esteira |
| Parcela vencida sem pagamento | aparece como **Atrasado** + alerta (sem ninguém mudar à mão) |
| Parcela paga com revenue share | nasce o Repasse (base × %) em "Calculado" |
| Obrigação vence em 7 dias | alerta |
| Contrato vence em ≤ 60 dias | nasce a Renovação ("A avaliar") |
| Renovado | novo período de contrato e parcelas; Não renovado → Base & Indicações |
| Oferta validada no Backlog | vai para a linha certa do Portfólio |
| TAP (F7) assinado | as entregas descem como tarefas para Produção, Comercial, Acompanhamento e Pessoas |
| Decisão registrada em ata | tarefa derivada com responsável e prazo |
| Lição no Act | entra em Melhoria Contínua → SOP |

## 5. Réguas próprias (seção 10, etapa 1) — todas implementadas

Pipelines B2B/Experts e B2C, Propostas, Contas a Receber/Pagar, Repasses,
Contratos, Documentos, Obrigações, Sebraetec/FUNCERN, Portfólio, KPIs,
Contratos Ativos B2B, Jornada Pós-Matrícula, Suporte, Renovações, Relatórios,
Biblioteca de Decisões, Listas de Experts, Processo Seletivo, SOPs e Melhoria
Contínua — cada uma com o "o que entra", a régua, a **evidência de conclusão**
exigida e os campos-chave do manual. Onde o manual exige evidência (ex.:
"Pronta para venda" pede nome, público, promessa, escopo, preço e
responsável; "Assinado" pede o link), a régua não avança sem ela.

## 6. Dashboards (seção 10, etapa 5)

- **Comercial:** oportunidades por etapa, valor no funil, conversão entre
  etapas, ganhas e perdidas no mês, motivos de perda, taxa proposta →
  contrato, ticket médio, ciclo de vendas.
- **Financeiro:** a receber e a pagar em 30 dias, atrasados, repasses
  pendentes, recebido no mês, previsão dos próximos meses.
- **Institucional:** KPIs por status (No alvo / Atenção / Fora do alvo),
  progresso dos OKRs, clientes ativos, receita recorrente.

KPIs que o sistema já sabe calcular (receita do mês, receita recorrente,
conversão por funil, clientes ativos, NPS médio) se atualizam sozinhos; os
outros (CAC, LTV…) são informados no Check mensal.

## 7. Ritmo de governança (seção 8)

Weekly (segunda), One-on-One (quinzenal, por pessoa), Check mensal, Act
trimestral e Ciclo de OKRs (semestral) aparecem no Hoje no dia certo. "Abrir
ata" já traz a pauta montada com os números do momento; cada decisão da ata
vira tarefa com responsável e prazo.

## 8. As doze inconsistências do manual (seção 11), resolvidas no desenho

| Inconsistência | Como ficou |
|---|---|
| "Pipeline B2B" × "Pipeline Experts" | um nome: **Pipeline B2B / Experts** |
| Duas pastas "05" no Comercial | não há numeração de pasta; a navegação é por área |
| Ferramentas em duplicidade | uma versão só, no **Playbook** (Pessoas e Conhecimento) |
| Três listas inexistentes da Agência | a Agência é a Maestro (Ensaio + Cronograma) |
| Gravação com régua reduzida | a Produção é o PDCA da Maestro para tudo |
| Tabela copiada em "Notas, Documentos" | régua própria: Solicitado → Recebido → Validado → Pendente de correção → Arquivado |
| Parágrafo errado no Jurídico | Contratos e Financeiro são registros separados, ligados pelo cliente |
| Financiamentos sem descrição | régua definida: Em análise → Solicitado → Aprovado → Em uso → Quitado / Negado |
| INBOX de projetos sem descrição | toda ideia entra como **Projeto MPGP em Incubadora**, antes do F1 |
| "Diagnóstico" fora de F1–F7 | virou o agrupador de F1–F3 |
| Projeto LGLA com "F1 a F6" | todo projeto usa F1–F7 e a mesma régua |
| Listas chamadas "List" | não existem listas soltas: tudo entra por um tipo de registro |
| Expert sem cabeçalho | o cabeçalho (razão social, CNPJ, autoridade, produto, remuneração, prazos) é obrigatório na Jornada Expert |
| Parcerias, Comunidades, Treinamentos sem régua | Parcerias: Prospecção → Negociação → Ativa → Pausada → Encerrada · Comunidades: Ativa → Morna → Inativa · Treinamentos: Planejado → Realizado → Avaliado |

## 9. Dados, separação e mescla

- **Separado de verdade:** arquivos próprios (`web/gestao/`), link próprio
  (`/gestao`), login próprio (a mesma conta da agência, sessão separada — a da
  plataforma não é tocada).
- **Onde grava:** no mesmo banco, em linhas `__gestao__:<coleção>` com a marca
  que a carga geral da plataforma já ignora (`maestroRedes`, a mesma da aba
  Redes). A plataforma não lê essas linhas; a Gestão não escreve em nenhuma
  outra. Cada gravação é por revisão (a trava da v151) e aplica a OPERAÇÃO ao
  estado mais novo — duas pessoas mexendo ao mesmo tempo não se apagam.
- **Da produção, só lê:** clientes, pauta (fases dos cards), tarefas do
  Ensaio por frente e os Negócios da v253 (que podem ser importados para cá).
- **Modo de exemplo:** sem login, a Gestão abre com uma empresa fictícia,
  no aparelho, para conhecer sem medo.

**A mescla (quando aprovado):** as tarefas geradas passam a nascer no Ensaio
(mesmas frentes, mesmos ids de frente); "Novo cliente" da Gestão passa a
criar o cliente da produção; o CRM Negócios (v253) é substituído pelo
Pipeline daqui (a importação já existe); e as telas entram no menu da
plataforma. Nada do modelo de dados muda na mescla.

---

## 10. Como está construído (25/set)

| Arquivo | O que faz |
|---|---|
| `web/gestao/modelo.js` | o manual virado dado: as cinco frentes (mesmos ids do Ensaio), a esteira, os dois funis, o MPGP (F1–F7, régua PDCA, BMC), a Jornada Expert, rituais e os 30 tipos de registro com régua, evidência e campos |
| `web/gestao/banco.js` | sessão própria, linhas `__gestao__:<coleção>`, gravação por operação com trava de revisão, fila no aparelho quando não há rede, "ao vivo" a cada 4s, e o modo de exemplo |
| `web/gestao/motor.js` | a etapa LIDA de cada cliente, as ações da esteira (cada uma devolve o plano: operações + a lista em português do que vai nascer), a cascata de cada régua, alertas, KPIs automáticos, painéis e rituais |
| `web/gestao/espelho.js` | a produção só lendo: a mesma lista de clientes, a pauta por fase, o Ensaio por frente, a equipe e os Negócios |
| `web/gestao/demo.js` | a empresa de exemplo — gerada pelo PRÓPRIO motor, cliente a cliente, com o relógio voltado para o dia de cada passagem |
| `ui.js`, `telas.js`, `folhas.js`, `app.js`, `gestao.css` | as telas, as janelas e a moldura, com os tokens da Maestro (v249/v254) |

**As telas:** Hoje (o que pede ação, rituais, tarefas, o Ensaio por frente) ·
Esteira (8 etapas; arrastar executa a ação da etapa) · Clientes · a página do
cliente (Comercial, contratos e dinheiro, Acompanhamento, produção na Maestro,
tarefas, dados e a linha do tempo inteira) · as seis áreas com todas as réguas
do manual · Pipeline B2B / Experts e B2C (SQL pede BANT) · Painéis Comercial,
Financeiro e Institucional.

**Como entrar:** a mesma conta da agência. **O demo tem endereço próprio:
`sejamaestro.com.br/gestao/demo`** — abre direto, sem login, com uma empresa
inventada que já usa a gestão há meses: 28 clientes em todas as etapas, o funil
B2B com oportunidade em cada etapa, todas as listas das seis áreas preenchidas,
o projeto MPGP completo (F1 a F7, Canvas, MoSCoW, TAP assinado e as entregas
viradas tarefas) e um roteiro de oito passos no Hoje. O exemplo fica só no
aparelho; "Recomeçar" volta ao começo. Na primeira vez com a conta real a gestão está vazia, e o Hoje
oferece trazer os clientes que já estão na Maestro (entram Em execução, ligados,
com a tarefa de registrar o contrato vigente) e os Negócios do CRM (viram
oportunidades; importar de novo não duplica).

### O que está provado (`web/verificar/gestao-fluxo.mjs`, 66 provas)

- **Separado:** sessão própria; escreve só em `__gestao__:*` com a marca; as
  linhas da plataforma saem byte a byte iguais; a carga geral dela não vê
  nada da gestão; dois aparelhos mexendo no mesmo cliente ao mesmo tempo não se
  apagam; sem rede, a mudança fica no aparelho, sobrevive a recarregar e sobe
  quando a rede volta.
- **O fluxo pela tela:** lead → contato → proposta (follow-up em +3 dias) →
  ganho (contrato, 12 parcelas, jornada, tarefas; proposta aceita e follow-up
  fechado sozinhos) → assinado (sem o link é recusado; parcelas "Nota a
  emitir"; kickoff) → ligar à Maestro (fecha a tarefa) → onboarding → execução
  → renovação pela data → renovado (aditivo + parcelas). Arrastar pulando etapa
  é recusado dizendo o próximo passo; perder pede motivo; SQL pede BANT; parcela
  paga de oferta de Expert gera o repasse de 40%; "Atrasado" vem da data; TAP
  assinado desce as entregas como tarefas; a ata distribui decisões; candidato
  apto vira onboarding; obrigação anual renovada gera a do ano seguinte; a
  ficha salva sozinha e registra "editou" uma vez; texto e link do usuário
  nunca viram HTML.
- **Celular:** nenhuma tela rola para o lado; a janela abre com o botão à vista.

### O que ainda NÃO faz (decisões para a mescla)

- As tarefas geradas vivem na gestão, com a frente certa; **na mescla, nascem no
  Ensaio** (os ids de frente já são os mesmos). Até lá, o Hoje da gestão mostra
  as dela e a contagem do Ensaio por frente.
- "Novo cliente" daqui não cria o cliente na Maestro — cria a tarefa na Produção
  para criar lá e ligar. Na mescla, vira um passo só.
- O CRM Negócios (v253) continua na plataforma; o Pipeline daqui o substitui na
  mescla (a importação já existe).
- Contas a pagar recorrentes (aluguel, ferramentas) são lançadas uma a uma; a
  recorrência automática fica para depois de a equipe usar.
- Permissões por papel (quem vê o financeiro) seguem a regra da agência:
  quem entra com a conta vê tudo. RBAC por área entra na mescla, com o `PERMS`
  da plataforma.
