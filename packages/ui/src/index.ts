/**
 * @maestro/ui
 *
 * Componentes extraídos dos protótipos validados. Contrato e regras em
 * `docs/UI/COMPONENTS.md`.
 *
 * Ordem de construção (7 blocos) no fim daquele documento. Os quatro
 * primeiros entregam a jornada do cliente inteira — a metade já testada
 * com gente de verdade.
 */

// Bloco 1 · Fundamentos
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './primitives/Button';
export { StatusPill, type StatusPillProps } from './primitives/StatusPill';

// Bloco 3 · Decisão — o núcleo do produto
export { ApprovalActions, type ApprovalActionsProps } from './approval/ApprovalActions';
