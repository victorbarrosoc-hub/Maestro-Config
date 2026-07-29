# ESTADOS GLOBAIS

Version: 1.0 · 2026-07-29 · Sprint 1

Toda tela da Maestro precisa existir em **oito estados**. Nenhuma tela vai para desenvolvimento com só o estado feliz desenhado.

---

## Os oito estados

| # | Estado | Quando | Regra |
|---|---|---|---|
| 1 | **Carregando** | busca em andamento | Skeleton com a forma do conteúdo real. Nunca spinner de tela cheia. |
| 2 | **Vazio** | não há dados ainda | Fórmula: o que é + o que fazer + ação. |
| 3 | **Preenchido** | o caminho feliz | — |
| 4 | **Parcial** | dados incompletos | Mostrar o que existe, indicar o que falta. Nunca esconder tudo por causa de um pedaço. |
| 5 | **Erro** | falha na operação | O que aconteceu + o que fazer. Nunca "algo deu errado". |
| 6 | **Sem permissão** | papel não autoriza | Explicar quem pode. Nunca sumir sem explicação. |
| 7 | **Offline** | sem conexão | Faixa discreta. Edições viram rascunho local. |
| 8 | **Desatualizado** | outra pessoa alterou | Oferecer atualização. **Nunca recarregar sozinho.** |

---

## 1 · Carregando

Skeleton com a geometria do conteúdo que vem — três linhas de lista viram três blocos de altura 44px, não um retângulo cinza genérico.

- Abaixo de **300ms**, não mostrar nada. Piscar skeleton é pior que esperar.
- Acima de **5s**, trocar por: "Está demorando mais que o normal." + botão "Tentar de novo".
- Nunca bloquear a tela inteira por um pedaço dela. Cada bloco carrega o seu.

**Loader da marca:** o símbolo com a curva desenhando em loop (`stroke-dasharray`, 1,2s) — só na entrada do app, nunca dentro de telas.

---

## 2 · Vazio

**Fórmula: o que é + o que fazer + ação.**

Ilustração: o Compasso a 8% de opacidade. **Nunca mascote.**

| Tela | Texto |
|---|---|
| Campanhas (agência) | **Nenhuma campanha ainda** · Campanhas organizam estratégia, calendário e conteúdos de um cliente. `[Criar campanha]` |
| Conteúdos | **Sem conteúdos** · Adicione a primeira peça ou gere a partir do calendário. `[Novo conteúdo]` |
| Aprovações | **Nada aguardando o cliente** · Quando você enviar peças, elas aparecem aqui. |
| Comentários | **Sem comentários** · Selecione um ponto na arte para comentar. |
| Início (cliente) | **Nada esperando por você** · Quando a agência enviar algo, a gente avisa por e-mail e WhatsApp. |
| Calendário | **Mês sem publicações** · Crie os slots a partir da estratégia. `[Montar calendário]` |
| Busca | **Nada encontrado para "verão"** · Tente outro termo ou verifique o cliente selecionado. |

**Vazio por filtro é diferente de vazio de verdade.** Se há filtro ativo, o texto muda e oferece limpar: "Nenhuma peça com esse filtro. `[Limpar filtros]`" — nunca sugerir criar conteúdo quando o problema é o filtro.

---

## 3 · Parcial

Casos reais que não podem quebrar a tela:

| Situação | Comportamento |
|---|---|
| Peça com copy e sem arte | Mostrar a copy, placeholder na arte: "Arte em produção" |
| Campanha sem estratégia | Banner: "Esta campanha ainda não tem objetivo definido. `[Definir]`" |
| Slot sem peça vinculada | Estado `⚠ sem peça vinculada`, visível no calendário e no dashboard |
| Métricas ainda não coletadas | "Os resultados aparecem 24h após a publicação." |

---

## 4 · Erro

**Estrutura:** o que aconteceu + o que fazer. Sempre uma ação possível.

| Tipo | Tratamento |
|---|---|
| Erro de campo | Inline, abaixo do campo, vermelho, específico |
| Erro de operação | Toast com "Tentar de novo" |
| Erro de tela | Bloco no lugar do conteúdo, resto da tela funciona |
| Erro de app | Tela cheia com código de referência + "Recarregar" |

**Nunca:** código HTTP cru, stack trace, "erro inesperado", "ops", ilustração engraçadinha.

**Sempre:** preservar o que a pessoa escreveu. Perder um comentário longo por falha de rede é imperdoável — rascunho local antes de qualquer requisição.

Exemplos em `docs/BRAND/VERBAL_IDENTITY.md` §5.

---

## 5 · Sem permissão

> **Você não tem permissão para aprovar**
> Quem aprova nesta campanha é Marina Costa.

> **Você acompanha esta campanha**
> Para aprovar publicações, peça à Ana Prado para mudar seu acesso.

**Regra:** dizer **quem pode**, não só que você não pode. Um beco sem saída é falha de design.

Ação não permitida nunca aparece desabilitada e sem explicação — ou some, ou explica.

---

## 6 · Offline

Faixa fixa no topo, discreta, cor Ink (não vermelha):

> Sem conexão. Suas alterações estão salvas neste dispositivo.

- Edição de copy e comentários continuam funcionando localmente.
- Aprovar fica indisponível — decisão precisa de confirmação do servidor, sem exceção.
- Ao voltar: "Conectado. Suas alterações foram enviadas." e sincroniza sozinho.

---

## 7 · Desatualizado

O caso mais delicado do produto: **duas pessoas na mesma peça**.

> Esta peça foi atualizada por Ana Prado há 1 minuto. `[Ver a nova versão]`

**Nunca recarregar sozinho.** O cliente pode estar no meio de um comentário — recarregar apaga o que ele escreveu e destrói a confiança na ferramenta.

Se ele tentar aprovar uma versão desatualizada, o servidor recusa (a aprovação é vinculada ao `versionId`) e a tela mostra o que mudou entre as versões antes de pedir a decisão de novo.

---

## Feedback de ação — a escada

Toda ação importante tem feedback proporcional ao seu peso. (Regra #9, D-009)

| Peso | Exemplo | Feedback |
|---|---|---|
| Trivial | Marcar checkbox | Mudança de estado visual |
| Leve | Salvar rascunho | "Salvo" discreto, sem toast |
| Média | Enviar comentário | Aparece na lista + animação de entrada |
| Alta | Enviar para aprovação | Toast + contador atualizado |
| **Crítica** | **Aprovar · Publicar** | **Animação + som + toast + undo** |
| Destrutiva | Excluir campanha | Confirmação com nome digitado + undo de 10s |

**Undo é obrigatório** em tudo que for reversível. Confirmação prévia só quando não houver como desfazer.

---

## Notificações in-app

| Tipo | Comportamento |
|---|---|
| Toast | 5s, canto inferior, empilha até 3, o mais antigo sai |
| Toast com undo | 8s |
| Banner | Fixo até resolver — usado em offline e versão desatualizada |
| Badge | Contador na navegação, nunca com número acima de 99 ("99+") |
| Modal | Só para decisão destrutiva ou bloqueante. Nunca para informar. |

**Nunca** interromper com modal algo que um toast resolve.

---

## Acessibilidade — mínimo obrigatório

- Todo estado é anunciado por leitor de tela (`role="status"`, `aria-live="polite"`).
- Todo controle interativo tem foco visível — outline Brass, offset 2px.
- Nenhuma informação depende só de cor. (Visual Identity R6)
- Toda ação de mouse tem equivalente de teclado. Comentário por ponto na arte precisa de caminho alternativo: `Tab` até a arte, `Enter` abre lista de pontos existentes + "adicionar ponto" com coordenadas por setas.
- Contraste mínimo 4,5:1 texto, 3:1 interface.
- `prefers-reduced-motion` corta animação e som.

---

## Checklist antes de mandar uma tela para desenvolvimento

- [ ] Os 8 estados estão desenhados?
- [ ] O vazio distingue "não existe" de "filtro não achou"?
- [ ] O erro diz o que fazer?
- [ ] O sem-permissão diz quem pode?
- [ ] O que a pessoa escreveu sobrevive a uma falha de rede?
- [ ] A ação crítica tem undo?
- [ ] Funciona no teclado?
- [ ] Funciona a 320px de largura?
