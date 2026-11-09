import { clsx } from 'clsx'

interface HeaderProps {
  title: string
  subtitle?: string
  avatar?: string
  onBack?: () => void
  onMenu?: () => void
  showBack?: boolean
  rightAction?: React.ReactNode
}

export function Header({ title, subtitle, avatar, onBack, onMenu, showBack = false, rightAction }: HeaderProps) {
  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-30 flex items-center h-16 bg-surface dark:bg-surface-dark border-b border-border dark:border-border-dark',
        'px-4',
      )}
      style={{ paddingTop: 'var(--safe-area-top)' }}
      role="banner"
    >
      <div className="flex-1 flex items-center gap-3 min-w-0">
        {showBack && onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center text-text dark:text-text-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark active:scale-95 transition-transform"
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        <div className="flex flex-col min-w-0">
          <h1 className={clsx(
            'font-semibold text-lg truncate',
            showBack ? 'text-text dark:text-text-dark' : 'text-text dark:text-text-dark',
          )}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-text-secondary dark:text-text-secondary-dark truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {rightAction}
        {!showBack && onMenu && (
          <button
            onClick={onMenu}
            className="p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center text-text dark:text-text-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark active:scale-95 transition-transform"
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}