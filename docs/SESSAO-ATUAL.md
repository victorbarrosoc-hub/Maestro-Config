# Sessão atual — passagem de bastão

> Arquivo vivo. É atualizado a cada entrega, para que uma conversa nova
> continue daqui sem perder nada. Complementa o `CLAUDE.md` (estado do
> produto) e o `docs/HANDOFF.md` (mapa do código).

Última atualização: 29 set 2026 (v292 no ar)

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

v293 (29 set) — Calendário com Mês · Semana (do jeito do Quadro), quadro de
ideias do Estúdio no jeito do FigJam (colar/arrastar imagem, link, forma,
seção, caneta, carimbo) e colar da área de transferência no editor de
design. Antes dela, a v292: Estúdio com menu e editor, ficha em abas, faixa
de colunas ao arrastar, Minha lista como o dia da pessoa.

**Como falar com o founder:** sempre em português, simples, sem código
(regra no CLAUDE.md).

## Em andamento

Nada aberto desta leva. Próximo passo: o que o founder pedir depois de
testar a v292 no celular.

## Como rodar as provas num container novo

- `npm install` (com `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`).
- Postgres: `pg_ctlcluster 16 main start`, depois
  `su postgres -c "psql -qc 'create role root superuser login'"`.
- Rodar uma suíte: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node web/verificar/<suite>.mjs`.

## Pendências antigas que seguem abertas

- D-024 INPI (busca de anterioridade).
- SMTP do Resend no Supabase Auth (e-mails de autenticação em inglês).
- `docs/ENGINEERING/seguranca-1-fechar-o-banco.sql` (presença, push, bucket).
- Teste do founder com dois aparelhos na Etapa 1 (dados em tempo real).
