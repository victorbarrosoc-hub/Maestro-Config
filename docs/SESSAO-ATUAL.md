# Sessão atual — passagem de bastão

> Arquivo vivo. É atualizado a cada entrega, para que uma conversa nova
> continue daqui sem perder nada. Complementa o `CLAUDE.md` (estado do
> produto) e o `docs/HANDOFF.md` (mapa do código).

Última atualização: 29 set 2026

## Como começar uma conversa nova (copie e cole)

```
Leia CLAUDE.md, docs/SESSAO-ATUAL.md e docs/HANDOFF.md, nessa ordem.
Branch de trabalho: feat/banco-real-r855f0. Continue do "Em andamento"
do SESSAO-ATUAL.md. Regras de publicação: as do CLAUDE.md ("Como
publicar — sempre levar até o fim"), incluindo republicar o artifact
https://claude.ai/artifact/S3eaRNr6K7kjHdhM72hizz com web/index.html.
Quando a janela de contexto chegar perto do fim, me avise, atualize este
arquivo, suba no GitHub e me dê o prompt para a próxima conversa.
```

## No ar

v291 (28 set) — ficha com Formato múltiplo, Pilar e Referências; criar pelo
Hoje, Mandala e Estúdio usa o campo do Quadro; o cliente vê o essencial.

## Pronto na branch, ainda NÃO no ar (v292)

- **Estúdio**: menu de entrada (novo design por tamanho, abrir, apagar,
  Ideias) e editor estilo Figma em `web/design/design.js` (ferramentas
  V F R O L T H, camadas, alinhar, desfazer, guias, imagem, exportar PNG,
  "Mandar para um card"). 29 provas: `web/verificar/v292-o-estudio.mjs`.
- **Ficha em abas** Conteúdo · Peça · Detalhes, sem "Editor completo",
  "Salvando…/Tudo salvo", textos que crescem. Nada trava o preenchimento.
- **Arrastar no computador** mostra a faixa das 8 colunas (como no celular).
- **Cronograma de conteúdos** saiu da ficha do cliente e virou a segunda
  vista do Calendário (mensal, semana a semana, cliente no seletor).
  Provas 6.1–6.5 em `web/verificar/v291-criar-e-ficha.mjs` (32 verdes).

## Em andamento

**Minha lista vira lista pessoal do dia.** Pedido do founder: "eu criei ela
mais pra ser algo individual de lembrar a pessoa o que tem que fazer no dia
dela no trabalho. Não necessariamente precisa virar uma tarefa do Quadro."
Desenho:
- o campo de cima cria **lembrete pessoal** (não card), guardado por pessoa;
- lembretes não feitos de dias anteriores sobem para hoje;
- os cards do Quadro da pessoa (prazo hoje/atrasados, Para revisar) ficam
  numa seção à parte; "Meus cards" mostra a lista completa;
- cada lembrete pode virar card por um botão, se a pessoa quiser.

Depois: subir versão (VERSAO_PROTOTIPO e os `?v=` dos carregadores),
CLAUDE.md, CHANGELOG, regressão (v277 precisa de Postgres:
`pg_ctlcluster 16 main start`), merge na main, build, conferir no ar,
republicar o artifact.

## Pendências antigas que seguem abertas

- D-024 INPI (busca de anterioridade).
- SMTP do Resend no Supabase Auth (e-mails de autenticação em inglês).
- `docs/ENGINEERING/seguranca-1-fechar-o-banco.sql` (presença, push, bucket).
- Teste do founder com dois aparelhos na Etapa 1 (dados em tempo real).
