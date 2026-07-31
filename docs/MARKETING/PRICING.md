# PRICING E EMPACOTAMENTO

Version: 1.0 · 2026-07-29 · Status: proposta fechada, números a validar em campo
Fecha **D-057**. Contexto em `COMPETITIVE.md`.

---

## O modelo

**Assentos da agência + projetos ativos.** Nunca por cliente.

```
preço = faixa (assentos + projetos ativos)  +  extras avulsos
```

**Por que não por cliente:**

1. A pergunta *"quanto custa por cliente?"* já contém a comparação com os R$ 19,90 do Aprova.ai — e nela tudo que a Maestro tem a mais parece caro.
2. O valor não escala com número de clientes. Escala com a **complexidade da operação** e com o método guardado na ferramenta.
3. Cobrar por assento coloca a Maestro na prateleira do Frame.io (US$ 15–25/membro), não na do Aprova.ai.

**Contadores que valem:**

| Contador | O que é | Por que este |
|---|---|---|
| **Assento** | pessoa da agência com acesso de escrita | acompanha o tamanho real da operação |
| **Projeto ativo** | projeto com status `ACTIVE` | acompanha a carga de trabalho, não a carteira |

**Aprovador do cliente nunca é assento.** Convidar cliente é ilimitado e gratuito, em todos os planos. Ver D-060.

---

## As faixas

Valores em reais, por mês, cobrados anualmente. Mensal fica ~25% acima.

| | **Ensaio** | **Concerto** | **Orquestra** | **Sob medida** |
|---|---|---|---|---|
| | R$ 149 | **R$ 349** | R$ 749 | falar com a gente |
| Assentos | 3 | 10 | 25 | ilimitado |
| Projetos ativos | 2 | 8 | 25 | ilimitado |
| Metodologias próprias | 1 | ilimitadas | ilimitadas | ilimitadas |
| Aprovadores do cliente | ilimitado | ilimitado | ilimitado | ilimitado |
| Approval Assistant | ✓ | ✓ | ✓ | ✓ |
| Selo e termo | ✓ | ✓ | ✓ | ✓ |
| Agendamento (Meta) | ✓ | ✓ | ✓ | ✓ |
| Demais redes | — | ✓ | ✓ | ✓ |
| Canva e Google Drive | ✓ | ✓ | ✓ | ✓ |
| Relatório de tempo de aprovação | — | ✓ | ✓ | ✓ |
| Marca da agência no lote | — | ✓ | ✓ | ✓ |
| SSO · auditoria exportável | — | — | ✓ | ✓ |
| Suporte | e-mail | e-mail prioritário | canal dedicado | dedicado |

**Extras:** assento adicional **R$ 29/mês** · projeto ativo adicional **R$ 25/mês**.

**Nomes dos planos são proposta.** Ensaio → Concerto → Orquestra é uma progressão real e cabe na marca. Alternativa neutra: Essencial · Profissional · Agência.

---

## A conta que o cliente vai fazer

Agência com 10 clientes, 6 pessoas:

| | Custo/mês | O que leva |
|---|---|---|
| Aprova.ai | R$ 199 | aprovação, calendário, agendamento |
| AprovaPost (faixa 10) | R$ 85 | aprovação, agendamento, grid |
| **Maestro Concerto** | **R$ 349** | tudo isso **+ metodologia, cronograma, dias de agenda, selo, termo, IA, roteiro de vídeo** |

**A Maestro custa 1,8× o Aprova.ai e 4× o AprovaPost.** É a conta que vai aparecer na reunião, e ela precisa ser respondida com uma frase, não com uma lista:

> Eles organizam seus posts. A Maestro roda o seu método — e o seu cliente sabe quantos dias da agenda dele o projeto custa.

Se essa frase não convencer, o problema é de posicionamento, não de preço.

---

## Teste e entrada

- **14 dias, sem cartão.** Os três concorrentes dão 7 — 14 é o mínimo para diferenciar, e o ciclo da Maestro (dois lotes) precisa de mais de uma semana para ser vivido.
- **Sem plano gratuito.** Plano grátis nesta categoria atrai quem não vai pagar e consome o suporte que ainda não temos. Revisar quando houver time de suporte.
- **Onboarding assistido no Concerto para cima**, nos primeiros 90 dias. A metodologia é o diferencial; agência que não configura a dela não percebe valor e cancela.

**O risco do modelo:** agência pequena com 3 clientes e 5 pessoas estoura os assentos do Ensaio e acha o Concerto caro. É o buraco entre as faixas. Mitigação: assento adicional a R$ 29 resolve até 7 pessoas por R$ 265 — abaixo do Concerto.

---

## O que nunca é limitado (D-060)

Três coisas não entram em plano nenhum, em nenhuma faixa:

**1 · Nada do lado do cliente.**
Aprovador ilimitado, sem custo, com todos os recursos. Comentário por ponto, tela cheia com zoom, edição de copy, selo, termo — tudo, em todos os planos.

*Por quê:* a experiência do cliente **é** a proposta de valor. Cobrar por ela, ou degradá-la em plano barato, é destruir o produto para vender o produto. O cliente da agência nunca vê uma tela de upgrade.

**2 · Histórico e auditoria.**
Nenhum plano tem retenção reduzida. A **Regra #6** diz que nada pode ser perdido — e retenção por faixa transforma uma regra do produto em item de tabela de preço.

*Por quê:* o valor do selo e do termo vem de serem permanentes. Um termo que expira em 90 dias não vale nada num conflito.

**3 · Segurança.**
Criptografia, isolamento multi tenant, assinatura temporária de arquivo e registro de acesso valem igual em todas as faixas. SSO é conveniência corporativa e pode ser de plano superior; segurança de base, não.

---

## O que isso exige do produto

| Necessidade | Onde entra |
|---|---|
| Contador de assentos e projetos ativos | `Organization` ganha `plan`, `seatLimit`, `projectLimit` |
| Bloqueio ao estourar limite | recusa criar projeto/assento, com upgrade em 1 clique — nunca degradar o que já existe |
| Trial de 14 dias sem cartão | `Organization.trialEndsAt` |
| Feature flags por faixa | `plan` + tabela de capacidades, checada no backend (nunca só na UI) |
| Faturamento | Stripe, Sprint 10 |

**Regra dura:** estourar o limite **nunca** desliga o que já está rodando. Projeto ativo continua ativo, lote enviado continua aprovável, cliente continua entrando. O bloqueio é sempre na **criação do próximo**, nunca no funcionamento do existente.

Uma agência que não consegue mais aprovar porque venceu o plano vira uma agência que perde o cliente dela — e depois nos culpa, com razão.

---

## O que validar antes de publicar

- [ ] Mostrar a tabela para **5 donos de agência** e ouvir a primeira reação ao número
- [ ] Confirmar a distribuição real: quantas pessoas e quantos projetos ativos as agências-alvo têm
- [ ] Testar a frase de resposta ao "por que 1,8× mais caro?"
- [ ] Definir se o nome dos planos é musical ou neutro
- [ ] Modelagem de custo: IA por lote é o único custo variável relevante — medir antes de fechar margem

**Os números desta tabela são hipótese fundamentada, não preço final.** O modelo (assento + projeto) é a decisão; os valores se ajustam com campo.
