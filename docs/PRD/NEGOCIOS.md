# Negócios — o CRM da agência, dentro da operação

Versão: v253 · 24/09/2026 · protótipo (`docs/UX/camadas/v253.js`)

## O pedido

> "Uma nova área de CRM dentro do Maestro: prospecção, leads, contatos,
> oportunidades, follow-ups, atividades, pipeline, conversão de oportunidade
> ganha em cliente e integração com a operação — sempre com a ideia de próxima
> ação e follow-up visível. Do status de prospect até o projeto em produção e
> publicação." — o founder

## O que olhamos, e o que tiramos de cada um

| CRM | O que ele acerta | O que NÃO trouxemos, e por quê |
|---|---|---|
| **Pipedrive** | Venda guiada por atividade: todo negócio tem uma próxima atividade; negócio "apodrecendo" fica marcado | Os dez campos por atividade. Agência registra em uma frase |
| **HubSpot** | Linha do tempo única por negócio | Lead, contato, empresa e oportunidade como quatro objetos: resolve milhares de registros, e agência tem dezenas |
| **RD Station CRM / Agendor** | Funil simples em português, tarefas no dia | Relatórios de funil por vendedor. A agência pequena tem um ou dois vendedores |
| **Kommo** | WhatsApp no centro da conversa | Chat dentro do CRM. A Maestro não vive dentro do WhatsApp (Princípio 8); o link abre a conversa, e o registro fica aqui |

## As decisões

1. **Uma entidade só: o Negócio.** O prospect é um negócio na primeira etapa,
   com os contatos dentro dele. Não existe tela de "leads" separada da tela de
   "oportunidades". Motivo: toda informação tem um lugar só (Princípio 1).
2. **Cinco etapas abertas, nomeadas como a agência fala:** Prospect, Primeiro
   contato, Reunião (diagnóstico), Proposta e Negociação. Ganho e Perdido são
   desfechos, não colunas: coluna de desfecho só acumula e empurra o funil
   para fora da tela.
3. **Todo negócio aberto tem uma próxima ação com data.**
   - Negócio sem próximo passo aparece em vermelho.
   - Registrar uma conversa **exige** o próximo passo no mesmo gesto.
   - "Feito" numa ação abre a ficha já pronta para o próximo passo.
   - O funil é um compromisso com o próximo contato, não um retrato parado.
4. **O follow-up da proposta é automático.** Mover para Proposta sem um passo
   marcado cria "Follow-up da proposta" em 3 dias. É onde agência mais perde:
   no silêncio depois de mandar a proposta.
5. **"Esfriando".** Sete dias sem nenhuma atividade marcam o negócio. Isso não
   é o mesmo que atraso: um negócio pode ter ação marcada para daqui a um mês e
   estar esfriando.
6. **Valor em fee mensal + setup.** É assim que agência vende. O funil soma o
   "em jogo por mês". Valor só aparece para quem tem **Valores e financeiro**
   na Equipe, a mesma chave que já existia.
7. **Perdeu tem motivo, e volta.** O motivo é obrigatório e ensina o funil.
   "Reabordar em 1, 3 ou 6 meses" vira uma próxima ação futura. Reabrir leva o
   negócio de volta para Primeiro contato.
8. **Ganhou vira cliente pelo cadastro de sempre.** "Ganhou" abre o mesmo
   "Novo cliente", já preenchido com nome, segmento, contexto, serviços e
   contato. Não existe um segundo jeito de criar cliente. O negócio passa a
   apontar para o cliente novo.
9. **O kickoff nasce no Ensaio**, no Inbox, na frente de Acompanhamento, com o
   contexto comercial e **sem o valor** (a tarefa é vista por quem não tem
   financeiro).
10. **A jornada até o post no ar** é lida da operação, e ninguém atualiza à
    mão. As etapas: Ganho → Cliente → Kickoff (tarefa concluída no Ensaio) →
    Pauta (cards do cliente) → 1ª aprovação (texto ou peça aprovados) → No ar
    (postado). É o "do prospect até a publicação" do pedido.
11. **O Hoje ganha a linha comercial.** As ações atrasadas e as de hoje de
    quem está logado aparecem no Hoje, e o menu mostra a contagem de atrasadas.
12. **Expansão de cliente atual.** Um negócio pode ser de um cliente que já
    existe (upsell). Aí "Ganhou" não cadastra nada: registra e cria o kickoff.

## Onde mora o dado

Em `S.crm.negocios`, no pacote de estado da agência (`__estado__`), que já tem
revisão, mescla de três lados e carimbo de agência (v151/v220). Duas regras
que vêm de lições pagas:

- **Toda lista tem `id`**: negócios, contatos, atividades e próxima ação. Lista
  sem `id` a mescla não une item a item; ela escolhe um lado inteiro (v226).
- **Excluir é lápide** (`fora: true`), não sumiço (v196).

O cliente (link) não enxerga nada disso: o `__estado__` não passa pela porta
do link.

## Telas

- **Próximas ações** (padrão no celular): Atrasadas, Hoje, Próximos 7 dias,
  Depois, Sem próximo passo.
- **Funil** (padrão no computador): cinco colunas; arrastar o cartão muda a
  etapa.
- **Ganhos**: a trilha de cada cliente até o primeiro post no ar.
- **Perdidos**: com motivo, data de reabordar e "Reabrir".
- **Ficha**: etapas, próxima ação, "Registrar" com o próximo passo, contatos
  (WhatsApp, e-mail e Instagram viram links), notas e histórico.

## Provas

43 provas em `web/verificar/v253-negocios.mjs`, pelo toque, do prospect ao post
no ar.

## Próximos passos possíveis

- Importar uma lista de prospects de planilha (CSV).
- Metas do mês ("fechar R$ 10 mil em fee novo") e conversão por etapa.
- Modelos de proposta com os serviços e o fee, gerando o link da proposta.
- A IA (Customer Success / CEO Assistant) sugerindo o texto do follow-up a
  partir do histórico. Só sugestão; quem manda é a pessoa.
