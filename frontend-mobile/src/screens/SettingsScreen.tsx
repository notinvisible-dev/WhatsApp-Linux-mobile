import { useState } from 'react'
import { clsx } from 'clsx'
import { Logout } from '../wailsjs/go/api/Api'

interface SettingsScreenProps {
  onBack: () => void
  onLogout: () => void
}

const settingsSections = [
  {
    title: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: '👤', action: () => {} },
      { id: 'privacy', label: 'Privacy', icon: '🔒', action: () => {} },
      { id: 'security', label: 'Security', icon: '🛡️', action: () => {} },
      { id: 'two_factor', label: 'Two-step verification', icon: '🔐', action: () => {} },
    ],
  },
  {
    title: 'Chats',
    items: [
      { id: 'theme', label: 'Theme', icon: '🎨', action: () => {} },
      { id: 'wallpaper', label: 'Wallpaper', icon: '🖼️', action: () => {} },
      { id: 'chat_backup', label: 'Chat backup', icon: '☁️', action: () => {} },
      { id: 'disappearing', label: 'Default message timer', icon: '⏱️', action: () => {} },
    ],
  },
  {
    title: 'Notifications',
    items: [
      { id: 'notifications', label: 'Notifications', icon: '🔔', action: () => {} },
      { id: 'sounds', label: 'Sounds', icon: '🔊', action: () => {} },
    ],
  },
  {
    title: 'Storage and Data',
    items: [
      { id: 'storage', label: 'Storage usage', icon: '💾', action: () => {} },
      { id: 'data', label: 'Network usage', icon: '📊', action: () => {} },
      { id: 'auto_download', label: 'Media auto-download', icon: '⬇️', action: () => {} },
    ],
  },
  {
    title: 'Help',
    items: [
      { id: 'help', label: 'Help center', icon: '❓', action: () => {} },
      { id: 'contact', label: 'Contact us', icon: '📧', action: () => {} },
      { id: 'about', label: 'About Whats4Linux', icon: 'ℹ️', action: () => {} },
    ],
  },
]

export function SettingsScreen({ onBack, onLogout }: SettingsScreenProps) {
  return (
    <div className="h-full flex flex-col" style={{ paddingTop: 'var(--safe-area-top) + 64px', paddingBottom: 'var(--safe-area-bottom) + 80px' }}>
      <div className="flex-1 overflow-y-auto">
        {settingsSections.map(section => (
          <div key={section.title} className="space-y-0">
            <div className="px-4 py-2 text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider bg-surface dark:bg-surface-dark sticky top-[64px] z-10">
              {section.title}
            </div>
            <div className="bg-surface dark:bg-surface-dark divide-y divide-border/50 dark:divide-border-dark/50">
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3 min-h-[56px] hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark active:bg-surface-elevated dark:active:bg-surface-elevated-dark text-left"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-text dark:text-text-dark">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="px-4 py-6">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 min-h-[56px] rounded-xl bg-red-500/10 text-red-500 font-medium"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>

        <div className="px-4 pb-8 text-center text-xs text-text-secondary dark:text-text-secondary-dark">
          <p>Whats4Linux v1.0.0</p>
          <p className="mt-1">An unofficial WhatsApp client for Linux</p>
        </div>
      </div>
    </div>
  )
}