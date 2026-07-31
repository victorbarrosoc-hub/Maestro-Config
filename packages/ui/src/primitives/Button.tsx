import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /**
   * Por que o botão está desabilitado. **Obrigatório quando `disabled`.**
   *
   * Botão inerte sem explicação na tela é bug, não decisão de design (D-052).
   * O texto é exposto como `title` e `aria-describedby` da razão renderizada
   * pelo container — nunca deixamos o usuário adivinhar.
   */
  disabledReason?: string;
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-[42px] px-5 text-[14px]',
  lg: 'h-[46px] px-6 text-[14.5px]',
};

/**
 * `primary` é preenchimento Brass com rótulo Ink.
 * Texto branco sobre Brass é proibido — contraste 2,7:1 (VISUAL_IDENTITY R5).
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent hover:brightness-95',
  secondary:
    'bg-transparent text-[var(--text)] border-[var(--border)] hover:border-[var(--text-subtle)]',
  ghost: 'bg-transparent text-[var(--text-muted)] border-transparent hover:text-[var(--text)]',
  danger: 'bg-[var(--danger-500)] text-white border-transparent hover:brightness-95',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    fullWidth,
    disabled,
    disabledReason,
    className = '',
    type = 'button',
    ...rest
  },
  ref,
) {
  if (process.env.NODE_ENV !== 'production' && disabled && !disabledReason) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Button] disabled sem disabledReason. Um botão inerte precisa dizer por quê (D-052).',
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border',
        'font-semibold tracking-[-0.01em] cursor-pointer select-none',
        'transition-[transform,background-color,border-color,opacity]',
        'duration-[var(--duration-staccato)] ease-[var(--ease-baton)]',
        'active:scale-[0.985]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        'disabled:opacity-45 disabled:cursor-default disabled:active:scale-100',
        SIZE[size],
        VARIANT[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    />
  );
});
