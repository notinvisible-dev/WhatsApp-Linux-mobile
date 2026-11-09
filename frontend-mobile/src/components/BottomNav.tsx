import { clsx } from 'clsx'

interface BottomNavProps {
  currentScreen: 'chats' | 'calls' | 'communities' | 'settings' | 'chat-detail' | 'login'
  onNavigate: (screen: 'chats' | 'calls' | 'communities' | 'settings', data?: any) => void
  unreadCount: number
}

const navItems = [
  { id: 'chats', label: 'Chats', icon: '💬' },
  { id: 'calls', label: 'Calls', icon: '📞' },
  { id: 'communities', label: 'Communities', icon: '👥' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const

export function BottomNav({ currentScreen, onNavigate, unreadCount }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around h-16 bg-surface dark:bg-surface-dark border-t border-border dark:border-border-dark z-40"
      style={{ paddingBottom: 'var(--safe-area-bottom)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      {navItems.map(item => {
        const isActive = currentScreen === item.id
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as any)}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[72px] min-h-[48px] transition-colors',
              'rounded-xl',
              isActive
                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                : 'text-text-secondary dark:text-text-secondary-dark active:bg-surface-elevated dark:active:bg-surface-elevated-dark',
            )}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <span className="text-xl" aria-hidden="true">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
            {isActive && item.id === 'chats' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-unread text-on-unread text-xs font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}