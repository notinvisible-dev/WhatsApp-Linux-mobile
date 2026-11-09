import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { Avatar } from './Avatar'
import { GetGroupInfo, GetProfile } from '../wailsjs/go/api/Api'

interface ChatInfoPanelProps {
  chatId: string
  chatName: string
  chatType: 'contact' | 'group'
  chatAvatar: string
  isOpen: boolean
  onClose: () => void
}

export function ChatInfoPanel({ chatId, chatName, chatType, chatAvatar, isOpen, onClose }: ChatInfoPanelProps) {
  const [groupInfo, setGroupInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && chatType === 'group') {
      loadGroupInfo()
    }
  }, [isOpen, chatId, chatType])

  const loadGroupInfo = async () => {
    setLoading(true)
    try {
      const info = await GetGroupInfo(chatId)
      setGroupInfo(info)
    } catch (err) {
      console.error('Failed to load group info:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="chat-info-title">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-surface dark:bg-surface-dark shadow-xl flex flex-col animate-slideIn">

        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 dark:border-border-dark/50 sticky top-0 bg-surface dark:bg-surface-dark z-10">
          <h2 id="chat-info-title" className="font-semibold text-text dark:text-text-dark">Chat info</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark min-w-[44px] min-h-[44px]">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 border-b border-border/50 dark:border-border-dark/50">
            <div className="flex items-center gap-3">
              <Avatar src={chatAvatar} name={chatName} jid={chatId} size="xl" type={chatType} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text dark:text-text-dark truncate">{chatName}</h3>
                {chatType === 'group' && groupInfo && (
                  <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                    {groupInfo.group_participants?.length || 0} participants
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1 px-3">
            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark text-left min-h-[56px]">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-text dark:text-text-dark">View contact</p>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">View profile and info</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark text-left min-h-[56px]">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-text dark:text-text-dark">Media, links, and docs</p>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Shared in this chat</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark text-left min-h-[56px]">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-text dark:text-text-dark">Search</p>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Search messages in this chat</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark text-left min-h-[56px]">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                  <path d="M12 22c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3S9 2.34 9 4v15c0 1.66 1.34 3 3 3zm-1-12c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-text dark:text-text-dark">Encryption</p>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Messages and calls are end-to-end encrypted</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark text-left min-h-[56px]">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                  <path d="M12 19c-3.31 0-6-2.69-6-6V7c0-3.31 2.69-6 6-6s6 2.69 6 6v6c0 3.31-2.69 6-6 6zm0-12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-text dark:text-text-dark">Disappearing messages</p>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Off</p>
              </div>
            </button>
          </div>

          {chatType === 'group' && groupInfo && (
            <div className="mt-4 px-3 pb-4">
              <h4 className="font-medium text-text-secondary dark:text-text-secondary-dark uppercase text-xs tracking-wider mb-3">Participants</h4>
              <div className="space-y-1">
                {groupInfo.group_participants?.slice(0, 20).map((p: any, i: number) => {
                  const contact = p.contact
                  const isAdmin = p.is_admin || p.is_super_admin
                  const name = contact.full_name || contact.push_name || contact.short || contact.phno || 'Unknown'
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark min-h-[56px]">
                      <Avatar name={name} jid={contact.jid} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text dark:text-text-dark truncate flex items-center gap-1">
                          {name}
                          {isAdmin && <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Admin</span>}
                        </p>
                        {contact.phno && <p className="text-sm text-text-secondary dark:text-text-secondary-dark">+{contact.phno}</p>}
                      </div>
                    </div>
                  )
                })}
                {(groupInfo.group_participants?.length || 0) > 20 && (
                  <button className="w-full px-3 py-2 text-center text-primary font-medium rounded-xl hover:bg-primary/10">
                    View all {(groupInfo.group_participants?.length || 0)} participants
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/50 dark:border-border-dark/50 p-3 space-y-2">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 font-medium min-h-[56px]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            {chatType === 'group' ? 'Exit group' : 'Delete chat'}
          </button>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 font-medium min-h-[56px]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M8 6v14M16 6v14" />
            </svg>
            {chatType === 'group' ? 'Report group' : 'Report contact'}
          </button>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 font-medium min-h-[56px]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            Block
          </button>
        </div>
      </div>
    </div>
  )
}