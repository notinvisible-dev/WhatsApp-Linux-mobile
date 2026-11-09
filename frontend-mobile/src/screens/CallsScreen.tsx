import { clsx } from 'clsx'

interface CallsScreenProps {
  onBack: () => void
}

export function CallsScreen({ onBack }: CallsScreenProps) {
  return (
    <div className="h-full flex flex-col" style={{ paddingTop: 'var(--safe-area-top) + 64px', paddingBottom: 'var(--safe-area-bottom) + 80px' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-500">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-text dark:text-text-dark mb-2">Calls</h2>
        <p className="text-text-secondary dark:text-text-secondary-dark mb-6 max-w-xs">
          Your call history will appear here. Start a call from a chat or the calls tab.
        </p>
        <div className="flex gap-3">
          <button className="flex-1 px-6 py-3 bg-primary text-white rounded-full font-medium min-h-[48px]">
            New Call
          </button>
          <button className="flex-1 px-6 py-3 border border-border/50 dark:border-border-dark/50 text-text dark:text-text-dark rounded-full font-medium min-h-[48px]">
            Add Contact
          </button>
        </div>
      </div>
    </div>
  )
}