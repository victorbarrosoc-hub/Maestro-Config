# CHANGELOG.md — Maestro

Version: 0.2

Registro oficial da evolução da Maestro. Versionamento semântico (MAJOR.MINOR.PATCH).
Nunca apagar versões anteriores.

---

## 0.2.0 — 2026-07-29

**Status:** Concluída
**Objetivo:** Fundação de marca e materialização da documentação.

### Adicionado
- Estrutura oficial de documentação em `/docs`
- `docs/BRAND/BRAND_STRATEGY.md` — naming, manifesto, missão, visão, valores, personalidade, arquitetura de marca
- `docs/BRAND/VERBAL_IDENTITY.md` — tom de voz, léxico, UX writing
- `docs/BRAND/VISUAL_IDENTITY.md` — símbolo, wordmark, lockups, cor, tipografia, grid, iconografia, motion
- `docs/BRAND/SOUND_IDENTITY.md` — identidade sonora (nota da marca Lá 440 Hz, logo sonoro, SFX de aprovação)
- `docs/BRAND/BRAND_BOOK.md` — manual consolidado
- `docs/BRAND/assets/` — SVGs do símbolo, wordmark, lockups, app icon e padrão gráfico
- `docs/BRAND/tokens/` — design tokens em JSON e CSS
- `docs/PRODUCT_BIBLE/PRODUCT_BRIEF.md` — brief do fluxo de aprovação (origem da ideia)

### Decisões
D-016 a D-024 (ver `DECISIONS.md`)

### Riscos registrados
- Colisão de marca "Maestro" (Mastercard/Maestro, Maestro by mobile.dev, Maestro/Netflix). Ver seção *Risco de Naming* em `BRAND_STRATEGY.md`.

### Próximo
Master Sitemap · User Flow Master · Design System

---

## 0.1.0

**Status:** Concluída
**Objetivo:** Início da Product Discovery.

Incluído: Nome Maestro · Posicionamento · Product Vision · Product Bible · Arquitetura macro · Filosofia UX · Filosofia AI · Filosofia técnica.

---

## Planejado

| Versão | Objetivo | Inclui |
|---|---|---|
| 0.3.0 | Arquitetura da Informação | Master Sitemap, User Flow, Navigation, Permissions |
| 0.4.0 | UX Bible | Wireflows, jornadas, microinterações, estados, UX writing |
| 0.5.0 | Design System | Tokens, grid, componentes, dark mode, motion, biblioteca |
| 0.6.0 | PRD | Todos os módulos, regras, critérios de aceite, user stories |
| 0.7.0 | Arquitetura técnica | Banco, APIs, eventos, infraestrutura |
| 0.8.0 | AI Handbook | Agentes, prompts, ferramentas, orquestrador |
| 0.9.0 | Protótipo navegável | — |
| 1.0.0 | MVP | Produto funcional, frontend, backend, IA, integrações, onboarding, deploy, documentação |

---

## Como registrar novas versões

```
## X.Y.Z — AAAA-MM-DD
Status: Planejada | Em Desenvolvimento | Concluída
Objetivo:
### Adicionado
### Melhorado
### Corrigido
### Impacto
### Documentação atualizada
### Responsável
```

**Convenções:** PATCH = correções · MINOR = novas funcionalidades compatíveis · MAJOR = mudanças estruturais.
