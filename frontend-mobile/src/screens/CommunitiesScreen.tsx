import { clsx } from 'clsx'

interface CommunitiesScreenProps {
  onBack: () => void
}

export function CommunitiesScreen({ onBack }: CommunitiesScreenProps) {
  return (
    <div className="h-full flex flex-col" style={{ paddingTop: 'var(--safe-area-top) + 64px', paddingBottom: 'var(--safe-area-bottom) + 80px' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-500">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-text dark:text-text-dark mb-2">Communities</h2>
        <p className="text-text-secondary dark:text-text-secondary-dark mb-6 max-w-xs">
          Communities bring related groups together. Create a community to organize your groups.
        </p>
        <button className="px-6 py-3 bg-primary text-white rounded-full font-medium min-h-[48px] min-w-[48px]">
          New Community
        </button>
      </div>
    </div>
  )
}