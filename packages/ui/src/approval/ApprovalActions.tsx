import * as React from 'react';
import { Button } from '../primitives/Button';

export interface ApprovalActionsProps {
  /**
   * Quantas marcas o cliente deixou nesta peça: notas em pontos da arte
   * + edição da legenda + edições de blocos de roteiro.
   */
  marks: number;
  onApprove: () => void;
  onRequestChanges: () => void;
  /** Chamado depois da confirmação de descarte. */
  onDiscardAndApprove: () => void;
  /** Abre o `ConfirmDialog`. Recebe a contagem para compor a mensagem. */
  onConfirmDiscard: (marks: number, confirmed: () => void) => void;
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * O par de decisão — o componente mais importante do produto.
 *
 * ## A regra (D-025)
 *
 * Editar a legenda e clicar em "Aprovar" é ambíguo: aprovou a versão de quem?
 * Qualquer marca do cliente move a peça para o caminho de alteração, e a ação
 * primária troca. Um caminho por intenção, nenhuma ação silenciosa.
 *
 * | marks | primário                  | secundário               |
 * |-------|---------------------------|--------------------------|
 * | 0     | Aprovar                   | Solicitar alterações     |
 * | > 0   | Enviar alterações (n)     | Descartar e aprovar      |
 *
 * ## Peso igual, sempre
 *
 * Os dois botões têm a mesma altura, a mesma área de toque e um clique cada.
 * Se pedir alteração custar mais caro que aprovar, o cliente aprova coisa ruim
 * para evitar atrito — e o produto falhou.
 *
 * ## Cuidado de implementação
 *
 * Reabilite as ações a cada troca de peça. Na rodada 1 de teste, o estado
 * `disabled` sobrevivia à re-renderização e matava os botões da segunda peça
 * em diante — o bug que mais custou no teste com clientes reais.
 */
export function ApprovalActions({
  marks,
  onApprove,
  onRequestChanges,
  onDiscardAndApprove,
  onConfirmDiscard,
  disabled,
  disabledReason,
}: ApprovalActionsProps) {
  const hasMarks = marks > 0;

  const handleSecondary = () => {
    if (!hasMarks) return onRequestChanges();
    // Nunca descartar em silêncio: o cliente precisa saber o que perde.
    onConfirmDiscard(marks, onDiscardAndApprove);
  };

  return (
    <div>
      <div className="flex gap-2.5">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={disabled}
          disabledReason={disabledReason}
          onClick={hasMarks ? onRequestChanges : onApprove}
        >
          {hasMarks ? `Enviar alterações (${marks})` : 'Aprovar'}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          disabled={disabled}
          disabledReason={disabledReason}
          onClick={handleSecondary}
        >
          {hasMarks ? 'Descartar e aprovar' : 'Solicitar alterações'}
        </Button>
      </div>

      {/* A consequência é dita sempre, antes de a pessoa clicar. */}
      <p className="mt-2.5 text-center text-[11.5px] leading-[1.45] text-[var(--text-subtle)]">
        {hasMarks
          ? 'A agência recebe suas notas e volta com uma nova versão.'
          : 'Ao aprovar, esta publicação entra na fila para ir ao ar.'}
      </p>
    </div>
  );
}
