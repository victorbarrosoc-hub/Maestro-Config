# PROJECT_RULES.md — Maestro

Versão: 1.0

Regras obrigatórias para qualquer pessoa ou IA que participe do desenvolvimento da Maestro.

---

## Filosofia

A Maestro não é um software de tarefas.
A Maestro é um Operating System para Agências e Equipes Criativas.
Toda decisão deve reforçar essa visão.

---

## Regras

**#1 — Experiência do usuário vence complexidade técnica.**
Nunca criar uma interface porque ela é mais fácil de desenvolver. Sempre escolher a experiência mais intuitiva.

**#2 — Um problema, uma solução.**
Nunca criar dois caminhos para executar a mesma ação. A plataforma deve ser previsível.

**#3 — Uma informação, uma fonte de verdade.**
Nunca duplicar dados. Nunca criar estados inconsistentes.

**#4 — Todo conteúdo é contextual.**
Comentários, aprovação e histórico pertencem ao conteúdo. Nunca criar módulos separados para isso.

**#5 — Nenhuma funcionalidade depende de WhatsApp.**
WhatsApp é apenas canal de notificação. Toda conversa relevante acontece dentro da Maestro.

**#6 — Toda alteração gera histórico.**
Registrar usuário, data, hora, versão, IP e motivo. Nada pode ser perdido.

**#7 — Desktop primeiro.**
Depois tablet, depois mobile. Nunca o contrário.

**#8 — A IA nunca substitui o usuário.**
Ela auxilia, resume, sugere, analisa e explica. Nunca decide sozinha sem confirmação.

**#9 — Toda ação importante tem feedback.**
Loading, sucesso, erro, confirmação, undo, toast, som (quando habilitado).

**#10 — A interface deve parecer viva.**
Referências: Apple, Linear, Notion, Figma, Raycast, Arc. Nunca parecer um ERP.

---

## UX

Sempre reduzir cliques. Sempre preservar contexto. Nunca abrir páginas desnecessárias.
Preferir side panels, modais e inline editing.

## UI

Espaçamento consistente. Animações discretas. Tipografia limpa. Ícones minimalistas.
Dark mode desde o MVP.
Tokens oficiais em `docs/BRAND/tokens/`. Nunca usar valor hardcoded de cor, espaçamento, raio ou duração.

## Performance

Lazy loading · Code splitting · Virtualização · Cache · Pré-carregamento inteligente.
Objetivo: tempo de carregamento percebido inferior a 2 segundos.

## Engenharia

Arquitetura modular · Componentes reutilizáveis · Código limpo · Documentação obrigatória ·
Testes automatizados · Logs estruturados · Feature flags · RBAC · Auditoria · LGPD.

## Banco de Dados

Nunca duplicar informações. Soft delete quando fizer sentido. Versionamento. Auditoria. Eventos.

## APIs

REST como padrão, arquitetura preparada para GraphQL. Versionamento. OpenAPI.
JWT + refresh token. RBAC. Rate limit.

## Código

TypeScript · ESLint · Prettier · Conventional Commits · Husky · Lint Staged.
Testes antes do merge.

## Git

`main` · `develop` · `feature/*` · `fix/*` · `hotfix/*` · `release/*`
Nunca desenvolver diretamente na `main`.

## Commits

`feat:` `fix:` `docs:` `style:` `refactor:` `perf:` `test:` `build:` `ci:`

## Pull Requests

Todo PR deve conter objetivo, checklist, screenshots (quando houver UI) e critérios de aceite.

---

## Objetivo Final

Construir o melhor software de colaboração entre agências e clientes do mercado.
