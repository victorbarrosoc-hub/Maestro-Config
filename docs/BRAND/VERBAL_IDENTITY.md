# VERBAL IDENTITY — Maestro

Version: 1.0 · 2026-07-29
Parte 2 de 5 do Brand Book.

---

## 1. A voz

A Maestro fala como **o profissional mais tranquilo da sala**.

Não é o software falando. É um colega experiente que já viu esse problema cem vezes, sabe exatamente o que fazer e não precisa levantar a voz para provar nada.

### Quatro atributos

**1. Precisa** — dizemos exatamente o que aconteceu e o que fazer. Sem "algo deu errado". Sem "ops!".
**2. Calma** — nada é urgente demais. Nenhuma exclamação de pânico. Nenhum caps lock.
**3. Humana** — escrevemos como se falássemos. Contração, frase curta, segunda pessoa.
**4. Econômica** — se a frase funciona com metade das palavras, ela tinha o dobro do necessário.

### Teste da marca

> Leia em voz alta imaginando um maestro respeitado no ensaio.
> Calmo, exato, sem gritar, sem bajular, sem ironia.
>
> Se soar estranho na boca dele, está fora da marca.

---

## 2. Tom por contexto

O tom muda; a voz nunca.

| Contexto | Tom | Exemplo |
|---|---|---|
| Onboarding | Acolhedor, guiado | "Vamos começar pelo seu primeiro cliente." |
| Uso diário | Neutro, invisível | "3 conteúdos aguardando você." |
| Aprovação (cliente) | Claro, sem pressão | "Tudo certo com essa peça?" |
| Sucesso | Discreto, factual | "Aprovado. A agência foi avisada." |
| Erro do usuário | Solucionador, nunca culpado | "Esse formato não é aceito. Use JPG, PNG ou MP4." |
| Erro do sistema | Honesto, responsável | "Não conseguimos salvar. Seu texto está guardado — tente de novo em instantes." |
| Ação destrutiva | Sério, específico | "Excluir a campanha 'Verão 26' e seus 24 conteúdos? Isso não pode ser desfeito." |
| IA | Sugestiva, nunca imperativa | "Notei três comentários pedindo a mesma mudança. Quer que eu resuma?" |
| Marketing | Confiante, provocativo | "Aprovação não deveria ser a parte difícil." |
| Cobrança / billing | Direto, sem constrangimento | "Seu plano vence em 3 dias. Renovar agora leva 30 segundos." |

---

## 3. Regras de escrita

**1. Segunda pessoa.** "Você aprovou" — não "o usuário aprovou".
**2. Voz ativa.** "A agência recebeu sua aprovação" — não "sua aprovação foi recebida pela agência".
**3. Presente.** "3 peças esperam por você" — não "3 peças estarão aguardando".
**4. Verbo no começo do botão.** "Aprovar", "Solicitar alterações", "Agendar".
**5. Frase curta.** Máximo ~20 palavras em interface.
**6. Números em algarismo.** "3 conteúdos", nunca "três conteúdos".
**7. Sem ponto final em rótulo, botão, tag ou título.** Com ponto final em frase de corpo.
**8. Sem exclamação**, exceto uma única vez: a conclusão do onboarding.
**9. Sem emoji na interface.** Permitido em e-mail de marketing, com parcimônia.
**10. Sem jargão de software.** Não existe "instância", "entidade", "payload", "sincronizar" ou "processar" na interface.

---

## 4. Léxico

### Dizemos

| Termo | Não dizemos |
|---|---|
| Campanha | Projeto, board |
| Conteúdo / Peça | Card, item, ticket, task |
| Copy | Texto publicitário, legenda |
| Aprovar | Validar, homologar, dar OK |
| Solicitar alterações | Reprovar, recusar, rejeitar |
| Comentário | Feedback, observação |
| Versão | Revisão, iteração |
| Agendar | Programar, schedular |
| Publicar | Postar, subir |
| Cliente | Contratante, tomador |
| Equipe | Colaboradores, recursos |

### Nunca dizemos

**"Reprovar".** O cliente não reprova a agência — ele pede ajuste. A palavra é **Solicitar alterações**. Essa escolha define a relação inteira que o produto quer criar entre agência e cliente.

**"Aprovação pendente"** dita ao cliente. Para a agência: "Aguardando aprovação". Para o cliente: "Esperando você". Mesma informação, dono diferente.

**"Ops", "Uh-oh", "Eita", "Algo deu errado".** Se algo deu errado, dizemos o quê.

**"Simplesmente", "apenas", "é só".** Minimizam o esforço de quem está com dificuldade.

**"Por favor" em botão.** "Por favor, aprove" é súplica. É "Aprovar".

---

## 5. UX Writing — padrões

### Botões

| Ação | Rótulo | Nunca |
|---|---|---|
| Aprovar conteúdo | **Aprovar** | Aprovar conteúdo · OK · Confirmar |
| Pedir ajuste | **Solicitar alterações** | Reprovar · Recusar |
| Enviar ao cliente | **Enviar para aprovação** | Submeter · Compartilhar |
| Salvar rascunho | **Salvar** | Salvar alterações |
| Cancelar | **Cancelar** | Voltar · Fechar |
| Excluir | **Excluir** | Remover · Deletar |

### Estados vazios

Fórmula: **o que é + o que fazer + ação**.

> **Nenhuma campanha ainda**
> Campanhas organizam estratégia, calendário e conteúdos de um cliente.
> `[Criar campanha]`

> **Nada esperando por você**
> Quando a agência enviar algo para aprovação, aparece aqui.

> **Sem comentários**
> Selecione um ponto na arte para comentar.

### Confirmações destrutivas

Fórmula: **o que será perdido + irreversibilidade + verbo específico no botão**.

> **Excluir "Campanha Verão 26"?**
> 24 conteúdos, 118 comentários e todo o histórico serão excluídos. Isso não pode ser desfeito.
> `[Cancelar]` `[Excluir campanha]`

### Erros

Fórmula: **o que aconteceu + o que fazer**. Nunca código sem tradução.

| Situação | Texto |
|---|---|
| Arquivo grande demais | "Esse arquivo tem 240 MB. O limite é 100 MB." |
| Formato inválido | "Esse formato não é aceito. Use JPG, PNG, MP4 ou MOV." |
| Sem permissão | "Você não tem permissão para aprovar. Peça ao administrador da sua conta." |
| Falha de rede | "Sem conexão. Seu texto está salvo — vamos tentar de novo sozinhos." |
| Conflito de versão | "Alguém editou essa copy enquanto você escrevia. Ver as duas versões." |
| Integração caiu | "O Instagram desconectou. Reconecte para retomar os agendamentos." |

### Notificações

Estrutura: **quem + o quê + onde**. Máximo 12 palavras.

- "Marina aprovou 3 peças em Verão 26."
- "Ricardo comentou na arte do Carrossel Lançamento."
- "2 peças agendadas para amanhã ainda não estão prontas."

**E-mail para a agência (aprovação):**
> **Assunto:** Marina aprovou 3 peças de Verão 26
> Marina Costa aprovou 3 conteúdos há 4 minutos. Nenhuma alteração solicitada.
> `[Ver na Maestro]`

**WhatsApp para a agência (aprovação):**
> Maestro · *Verão 26*
> Marina aprovou 3 peças. Sem alterações.
> Ver: maestro.app/c/x7f2

O WhatsApp é notificação, nunca conteúdo. Ele sempre leva de volta para a plataforma. (Regra #5, D-021)

### Voz da IA

A IA sempre:
- se identifica como sugestão, nunca como fato consumado;
- mostra a origem da conclusão;
- oferece uma ação, nunca a executa sozinha.

> "Três comentários pedem a mesma mudança no CTA. Quer que eu junte em uma nota única?"
> "Essa copy promete '50% de desconto', mas a estratégia da campanha fala em 30%. Confere?"
> "Duas peças agendadas para sexta ainda estão em produção. Isso costuma virar atraso."

Nunca: "Corrigi o CTA para você." · "Aprovei as peças pendentes."

---

## 6. Escrita para o cliente da agência

O cliente é o usuário menos frequente e o mais importante. Ele entra na Maestro talvez duas vezes por semana, muitas vezes pelo celular, quase sempre com pressa.

**Regras específicas:**

1. **Zero jargão de agência.** Nada de "peça", "KV", "master", "BV". Para o cliente é "publicação", "arte", "vídeo", "texto".
2. **Sempre diga o que acontece depois.** "Ao aprovar, a agência é avisada na hora e a peça entra na fila de publicação."
3. **Nunca faça o cliente se sentir devedor.** Nada de "pendente há 5 dias" em vermelho. Use "Esperando você desde segunda" — factual, sem cobrança.
4. **Ofereça sempre a saída fácil.** Ao lado de "Aprovar" existe sempre "Solicitar alterações", com o mesmo peso visual e nenhuma fricção a mais.
5. **Confirme com clareza.** "Aprovado. A agência foi avisada." — o cliente precisa saber que o recado chegou.

---

## 7. Copy de marketing

**Fórmula:** dor concreta → alívio concreto → prova.

> **A criação é sua. A regência é nossa.**
> Briefing, estratégia, calendário, aprovação e publicação no mesmo lugar.
> Seu cliente aprova dentro da plataforma. A peça aprovada vira publicação agendada.

**Headlines aprovadas:**
- Sua operação, no tempo certo.
- Aprovação não deveria ser a parte difícil.
- Da ideia ao ar, sem ruído.
- O fim do "final_v3_APROVADO_agora_vai.pdf".
- Todo mundo tocando a mesma música.

**Proibido:** "revolucionário", "disruptivo", "game changer", "solução completa", "potencialize", "alavanque", "sinergia", "sinfonia de resultados", "harmonize", "afine sua agência".

---

## 8. Idiomas

Português do Brasil é o idioma principal. O produto nasce preparado para inglês (i18n desde o MVP).

- Nunca traduzir literalmente. "Solicitar alterações" → **"Request changes"**, não "Request alterations".
- Manter os termos de plataforma em inglês quando é assim que o mercado fala: *Reels*, *Stories*, *Carrossel* (esse já é português), *Feed*.
- Datas em pt-BR: "12 de março", "seg, 12 mar".
