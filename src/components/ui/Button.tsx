'use client'

import { clsx } from 'clsx'
import { forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  tooltip?: string
}

const CandleSpinner = () => (
  <svg
    aria-hidden="true"
    className="inline-block w-4 h-4 mr-2 animate-spin"
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      d="M8 2 C8 2 9.5 4 9.5 6 C9.5 7.93 8.83 9 8 9 C7.17 9 6.5 7.93 6.5 6 C6.5 4 8 2 8 2Z"
      fill="var(--candle)"
    />
    <rect x="7" y="9" width="2" height="5" rx="1" fill="var(--parchment-dark)" />
  </svg>
)

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      loading = false,
      disabled = false,
      tooltip,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    const base =
      'inline-flex items-center justify-center font-inter text-sm font-medium ' +
      'transition-colors duration-150 cursor-pointer ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-obsidian ' +
      'disabled:opacity-50 disabled:cursor-not-allowed ' +
      'rounded'

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-burgundy text-parchment border border-gold px-6 py-2.5 ' +
        'hover:bg-burgundy hover:border-parchment-light hover:brightness-125 ' +
        'active:scale-[0.98] ' +
        'shadow-[inset_0_0_0_1px_var(--burgundy),inset_0_0_0_2px_var(--burgundy)]',
      secondary:
        'bg-transparent text-parchment border border-gold px-5 py-2 ' +
        'hover:bg-burgundy hover:border-parchment-light ' +
        'active:scale-[0.98]',
      ghost:
        'bg-transparent text-parchment-dark px-4 py-2 ' +
        'hover:text-parchment hover:underline ' +
        'active:opacity-70',
    }

    const button = (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={clsx(base, variants[variant], className)}
        {...props}
      >
        {loading && <CandleSpinner />}
        {children}
      </button>
    )

    if (tooltip && isDisabled) {
      return (
        <span title={tooltip} className="inline-flex">
          {button}
        </span>
      )
    }

    return button
  }
)

Button.displayName = 'Button'

export { Button }
