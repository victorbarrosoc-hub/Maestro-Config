# APPROVAL ASSISTANT

Version: 1.0 · 2026-07-29
O primeiro agente da Maestro a entrar no MVP. Vive dentro do momento de aprovação.

---

## Princípio

> **A IA fala sem ser chamada sobre fatos. Sobre gosto, só quando convidada.** (D-043)

Toda a especificação abaixo é consequência dessa frase.

Ela existe porque o cliente que para de editar mata o produto. A participação dele é a proposta de valor inteira — se a máquina o corrige quando ele escreve, ele escreve menos. E menos participação é exatamente o estado anterior à Maestro.

---

## Os três níveis

### Nível 1 · Fatos — sempre, inline, sem pedir

Coisas verificáveis, em que estar errado não é opinião.

| Verificação | Como aparece |
|---|---|
| Ortografia e gramática | sublinhado no texto, correção sugerida ao tocar |
| Limite de caracteres da plataforma | contador que fica âmbar antes de estourar |
| Hashtag inválida ou banida | marcada no texto |
| Link quebrado | ícone ao lado do link |
| Número que contradiz a estratégia | selo no rodapé da peça |
| Promessa sem prova ("o melhor do Brasil") | selo no rodapé da peça |
| Menção a data que não bate com o agendamento | selo no rodapé da peça |

**Tom:** factual e curto. Nunca "você errou".

> A estratégia fala em **30% de desconto**. Esta copy diz **50%**.
> A publicação está marcada para **quinta**, mas o texto diz **"amanhã, sexta"**.

### Nível 2 · Coerência — sempre, discreto, um selo por peça

Análise do conjunto. Discreta porque é interpretação, ainda que bem fundamentada.

| Verificação | Exemplo |
|---|---|
| Atende ao objetivo da fase? | "Esta peça fala com quem já é cliente. O objetivo de agosto é alcançar quem ainda não conhece." |
| Contradiz outra peça do lote? | "A peça 2 diz 'últimas unidades'. A peça 4 diz 'estoque completo'." |
| Repete tema ou formato? | "3 das 4 peças são bastidores." |

Aparece como **um selo por peça**, fechado. Toca e abre a explicação. Nunca um painel aberto gritando.

### Nível 3 · Opinião — só quando pedida

Atrás de um botão explícito. Nunca aparece sozinho.

**Perguntas que o cliente pode fazer:**

| Botão | O que a IA responde |
|---|---|
| *O que você acha da minha versão?* | comparação entre a dele e a da agência, com o porquê |
| *Isso tem potencial?* | leitura de gancho, clareza e CTA — com ressalva de que é estimativa |
| *Como eu diria isso melhor?* | 2 alternativas, nunca 1 (uma opção é imposição) |

**Perguntas que a agência pode fazer:**

| Botão | O que a IA responde |
|---|---|
| *Resume o que o cliente pediu* | consolida notas de todas as peças do lote |
| *Tem pedido contraditório?* | aponta conflitos entre aprovadores |
| *A versão do cliente perde alguma coisa?* | o que saiu do texto e por que importava |

### A comparação entre versões

O caso mais delicado, e o que o fundador pediu explicitamente.

**Formato obrigatório da resposta — sempre nesta ordem:**

1. **O que a sua versão ganhou** (sempre existe algo, e vem primeiro)
2. **O que ela perdeu**, se perdeu
3. **A recomendação**, com o motivo
4. **Uma terceira via**, quando existir

> **Sua versão está mais direta** — cortou 40 caracteres e o começo ficou mais forte.
>
> **O que saiu:** a menção ao tingimento natural. Ela era o único ponto do texto que
> sustentava "feito à mão", que é o pilar da estratégia de agosto.
>
> **Sugestão:** manter o seu começo e recuperar o tingimento no final.
>
> *"O verão não precisa de pressa. Linho lavado e algodão cru, com tingimento natural,
> feitos em pequenas quantidades."*

**Nunca:** "a versão anterior era melhor". Mesmo quando for verdade. A resposta útil é *o que se perdeu e como recuperar*, não um veredito.

---

## Regras duras

**R1 — A IA nunca bloqueia aprovação.** Nem no nível 1. Sinaliza; a pessoa decide. (Regra #8, D-011)

**R2 — Toda afirmação mostra a origem.** "A estratégia diz 30%" com link para a estratégia. Sem fonte, não fala.

**R3 — A IA nunca fala primeiro sobre gosto.** Níveis 1 e 2 são automáticos. Nível 3 exige toque.

**R4 — A IA nunca escreve na peça.** Ela sugere; a sugestão vira `Suggestion` como qualquer outra, e alguém aceita. (Regra #3)

**R5 — Nunca elogia.** "Ótima copy!" é ruído e queima a credibilidade dos avisos que importam.

**R6 — Silêncio é resposta válida.** Peça sem problema não recebe selo. Selo em tudo vira decoração.

**R7 — Máximo 3 sinalizações por peça.** Acima disso, agrupa: "5 pontos a revisar". Doze avisos numa tela é a mesma coisa que zero.

**R8 — A IA nunca vê comentário interno da equipe.** `Comment.isInternal = true` fica fora do contexto do agente. (PERMISSIONS)

**R9 — O cliente pode desligar.** Conta → Preferências → *Sugestões da IA*. Ligado por padrão nos níveis 1 e 2.

---

## Contexto do agente

O que entra no prompt, e nada além disso:

```
projeto      objetivo, público, anti-público, pilares, tom de voz
fase         nome, pergunta-guia, objetivo do mês
lote         todas as peças, para análise de conjunto
peça         copy atual, versão da agência, versão do cliente, formato, plataforma, data
histórico    o que o cliente pediu nos últimos 3 lotes
marca        limites da plataforma, hashtags proibidas
```

**Fora do contexto:** comentários internos · dados de outros clientes · dados de outras organizações · faturamento · qualquer informação de agência que o cliente não veria.

**Isolamento multi tenant vale para a IA igual ao banco.** Nenhum contexto atravessa `organizationId`.

---

## Falha e degradação

| Situação | Comportamento |
|---|---|
| Provedor fora do ar | a aprovação funciona normalmente, sem selos. Nunca bloquear. |
| Resposta demorando > 3s | some. O cliente não espera IA para aprovar. |
| Resposta sem fonte verificável | descartada, não exibida |
| Cliente desligou | nível 1 e 2 somem; o botão do nível 3 continua |

**A tela de aprovação funciona 100% sem IA.** Ela é camada, nunca dependência.

---

## Métricas

| Métrica | O que diz | Meta |
|---|---|---|
| % de sinalizações nível 1 aceitas | a IA está certa? | > 70% |
| % de clientes que pedem o nível 3 | a opinião é desejada? | > 30% |
| % de clientes que desligam | estamos incomodando? | < 10% |
| Edições do cliente por lote, antes × depois | **a IA está calando o cliente?** | não pode cair |

A última é a métrica de segurança do agente. **Se o cliente passa a editar menos depois que a IA entrou, o agente está prejudicando o produto** — e sai, por mais certo que esteja.

---

## Fora do MVP

Geração de copy do zero · análise de imagem · previsão de engajamento com número · aprendizado do tom de voz por histórico · agente conversacional.

O Approval Assistant do MVP faz uma coisa: **ajuda a decidir melhor sobre o que já existe.**
