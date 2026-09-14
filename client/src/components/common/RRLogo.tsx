type RRLogoProps = { size?: 'small' | 'medium' | 'large'; className?: string; ariaLabel?: string }

const sizes = {
  small: 'px-2 py-1 text-xs font-bold tracking-widest',
  medium: 'px-3 py-1.5 text-sm font-bold tracking-widest',
  large: 'px-4 py-2 text-lg font-bold tracking-widest',
}

export function RRLogo({ size = 'medium', className = '', ariaLabel = 'RRVMS' }: RRLogoProps) {
  const sizeClasses = sizes[size]
  return (
    <span
      className={`inline-flex items-center justify-center rounded bg-[var(--rr-primary)] text-white font-mono uppercase shadow-sm ${sizeClasses} ${className}`}
      aria-label={ariaLabel}
    >
      RRVMS
    </span>
  )
}
