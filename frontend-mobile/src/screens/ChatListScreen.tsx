import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { clsx } from 'clsx'
import { useChatStore } from '../store/chatStore'
import { useUIStore } from '../store/uiStore'
import { Avatar } from '../components/Avatar'
import { formatChatTimestamp, getAvatarColor, AVATAR_ICON_COLOR } from '../lib/utils'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { GetChatList, GetSelfAvatar, ToggleChatPin, ToggleChatArchive } from '../wailsjs/go/api/Api'
import { EventsOn } from '../wailsjs/runtime/runtime'

interface ChatItem {
  id: string
  name: string
  subtitle: string
  type: 'contact' | 'group'
  timestamp: number
  avatar?: string
  unreadCount: number
  pinned: boolean
  archived: boolean
}

interface ChatListScreenProps {
  onOpenChat: (screen: 'chat-detail', data: { id: string; name: string; avatar: string }) => void
  onOpenSettings: () => void
  onLogout: () => void
}

const PinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" className={clsx('fill-current', className)}>
    <path d="M16 3a1 1 0 0 1 .95 1.31l-.9 2.72 3.42 3.42a1 1 0 0 1-.21 1.57l-3.62 2.07-1.9 4.75a1 1 0 0 1-1.64.33L9 16.07l-4.29 4.3-1.42-1.42 4.3-4.29-3.1-3.1a1 1 0 0 1 .33-1.64l4.75-1.9 2.07-3.62A1 1 0 0 1 12.5 4z" />
  </svg>
)

const MutedIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#8696a0" aria-hidden="true">
    <path d="M12 4c-3.31 0-6 2.69-6 6v12c0 3.31 2.69 6 6 6s6-2.69 6-6V10c0-3.31-2.69-6-6-6zm0 14c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-10c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
  </svg>
)

const ArchiveIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#00a884" aria-hidden="true">
    <path d="M20.54 5.23 19.15 3.55A1.5 1.5 0 0 0 18 3H6a1.5 1.5 0 0 0-1.16.55L3.46 5.23A2 2 0 0 0 3 6.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.46-1.27ZM6.24 5h11.52l.81.97H5.44ZM5 19V8h14v11Zm8-5.5V11h-2v2.5H8.5L12 17l3.5-3.5Z" />
  </svg>
)

const PeopleIcon = ({ size = 24, color = AVATAR_ICON_COLOR }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} aria-hidden="true">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
)

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
  <div className="flex flex-col items-center justify-center h-full px-8 text-center">
    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
      <span className="text-4xl">💬</span>
    </div>
    <h2 className="text-xl font-semibold text-text dark:text-text-dark mb-2">No chats yet</h2>
    <p className="text-text-secondary dark:text-text-secondary-dark mb-6 max-w-xs">
      Start a conversation by tapping the new chat button above.
    </p>
    <button
      onClick={onRefresh}
      className="px-6 py-3 bg-primary text-white rounded-full font-medium min-h-[48px] min-w-[48px]"
    >
      Refresh
    </button>
  </div>
)

const ChatListItem = memo(function ChatListItem({
  chat,
  onPress,
  onLongPress,
}: {
  chat: ChatItem
  onPress: () => void
  onLongPress: () => void
}) {
  const dark = false // TODO: get from theme
  const isGroup = chat.type === 'group'

  return (
    <button
      onClick={onPress}
      onContextMenu={(e) => { e.preventDefault(); onLongPress(); }}
      className={clsx(
        'flex items-center gap-4 px-4 py-3 w-full min-h-[72px]',
        'hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark',
        'active:bg-surface-elevated dark:active:bg-surface-elevated-dark',
        'border-b border-border/50 dark:border-border-dark/50',
        'touch-manipulation',
      )}
      style={{ touchAction: 'manipulation' }}
    >
      <div className="relative shrink-0">
        <Avatar
          src={chat.avatar}
          name={chat.name}
          jid={chat.id}
          size="lg"
          type={isGroup ? 'group' : 'contact'}
          dark={dark}
        />
        {chat.unreadCount > 0 && (
          <span className="absolute -bottom-1 -right-1 min-w-5 h-5 bg-unread text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-medium text-text dark:text-text-dark truncate">{chat.name}</h3>
          <span className="text-xs text-text-secondary dark:text-text-secondary-dark shrink-0">
            {formatChatTimestamp(chat.timestamp)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-text-secondary dark:text-text-secondary-dark truncate flex-1">
            {chat.subtitle}
          </span>
          {chat.pinned && <PinIcon className="shrink-0 text-primary" />}
        </div>
      </div>
    </button>
  )
})

ChatListItem.displayName = 'ChatListItem'

const ArchivedBanner = ({ count, onPress }: { count: number; onPress: () => void }) => (
  <button
    onClick={onPress}
    className="flex items-center gap-3 px-4 py-3 w-full min-h-[72px] border-b border-border/50 dark:border-border-dark/50"
  >
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <ArchiveIcon />
    </div>
    <div className="flex-1">
      <span className="font-medium text-text dark:text-text-dark">Archived</span>
      <span className="text-sm text-text-secondary dark:text-text-secondary-dark block mt-0.5">{count} chats</span>
    </div>
  </button>
)

export function ChatListScreen({ onOpenChat, onOpenSettings, onLogout }: ChatListScreenProps) {
  const {
    chats,
    chatIds,
    chatsById,
    searchTerm,
    setChats,
    setSearchTerm,
    selectChat,
    clearUnreadCount,
    filteredChatIds,
    isLoading,
  } = useChatStore()

  const [showArchived, setShowArchived] = useState(false)
  const [selfAvatar, setSelfAvatar] = useState<string | undefined>()
  const [mounted, setMounted] = useState(false)
  const refreshRef = useRef(false)

  const loadChats = useCallback(async () => {
    if (refreshRef.current) return
    refreshRef.current = true

    try {
      const chatElements = await GetChatList()
      if (!chatElements || !Array.isArray(chatElements)) {
        setChats([])
        return
      }

      const items: ChatItem[] = await Promise.all(chatElements.map(async (c: any) => {
        const isGroup = c.jid?.endsWith('@g.us') || false
        return {
          id: c.jid || '',
          name: c.full_name || c.push_name || c.short || c.phno || 'Unknown',
          subtitle: c.latest_message || '',
          type: isGroup ? 'group' : 'contact',
          timestamp: c.LatestTS,
          avatar: c.avatar_url || '',
          unreadCount: 0,
          pinned: c.pinned || false,
          archived: c.archived || false,
        }
      }))

      setChats(items)

      // Load avatars
      for (const chat of items) {
        if (!chat.avatar) {
          try {
            const { GetCachedAvatar } = await import('../wailsjs/go/api/Api')
            const avatarURL = await GetCachedAvatar(chat.id, false)
            if (avatarURL) {
              useChatStore.getState().updateSingleChat(chat.id, { avatar: avatarURL })
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err)
      setChats([])
    } finally {
      refreshRef.current = false
    }
  }, [setChats])

  const loadSelfAvatar = useCallback(async () => {
    try {
      const { GetSelfAvatar } = await import('../wailsjs/go/api/Api')
      const avatarURL = await GetSelfAvatar(false)
      setSelfAvatar(avatarURL)
    } catch {}
  }, [])

  useEffect(() => {
    setMounted(true)
    loadChats()
    loadSelfAvatar()

    const unsubNewMessage = EventsOn('wa:new_message', (data: any) => {
      if (data?.chatId && data.message?.Info?.ID) {
        const existing = useChatStore.getState().getChat(data.chatId)
        if (existing) {
          useChatStore.getState().incrementUnreadCount(data.chatId)
        } else {
          loadChats()
        }
      }
    })

    const unsubRefresh = EventsOn('wa:chat_list_refresh', () => loadChats())

    return () => {
      unsubNewMessage()
      unsubRefresh()
    }
  }, [loadChats, loadSelfAvatar])

  const archivedCount = chatIds.filter(id => chatsById.get(id)?.archived).length

  const handleChatPress = (chat: ChatItem) => {
    selectChat(chat)
    clearUnreadCount(chat.id)
    onOpenChat('chat-detail', { id: chat.id, name: chat.name, avatar: chat.avatar || '' })
  }

  const handleChatLongPress = (chat: ChatItem) => {
    // TODO: Show context menu
    console.log('Long press:', chat)
  }

  const handleTogglePin = async (chat: ChatItem) => {
    const store = useChatStore.getState()
    store.updateSingleChat(chat.id, { pinned: !chat.pinned })
    store.resortChats()
    try {
      await ToggleChatPin(chat.id, !chat.pinned)
    } catch {
      store.updateSingleChat(chat.id, { pinned: chat.pinned })
      store.resortChats()
    }
  }

  const handleToggleArchive = async (chat: ChatItem) => {
    const store = useChatStore.getState()
    store.updateSingleChat(chat.id, { archived: !chat.archived })
    try {
      await ToggleChatArchive(chat.id, !chat.archived)
    } catch {
      store.updateSingleChat(chat.id, { archived: chat.archived })
    }
  }

  if (!mounted) {
    return <div className="h-full flex items-center justify-center" style={{ paddingTop: 'var(--safe-area-top)' }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  }

  const displayChats = showArchived
    ? chatIds.filter(id => chatsById.get(id)?.archived).map(id => chatsById.get(id)!)
    : filteredChatIds.map(id => chatsById.get(id)!).filter(Boolean)

  return (
    <div className="h-full flex flex-col w-full px-4" style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}>
      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search or start new chat" />

      {!showArchived && archivedCount > 0 && (
        <ArchivedBanner count={archivedCount} onPress={() => setShowArchived(true)} />
      )}

      {showArchived && (
        <button
          onClick={() => setShowArchived(false)}
          className="flex items-center gap-3 px-4 py-3 w-full min-h-[72px] border-b border-border/50 dark:border-border-dark/50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-text-secondary dark:text-text-secondary-dark">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="font-medium text-text dark:text-text-dark">Back to chats</span>
        </button>
      )}

      <div className="flex-1 overflow-y-auto">
        {displayChats.length === 0 ? (
          <EmptyState onRefresh={loadChats} />
        ) : (
          displayChats.map(chat => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              onPress={() => handleChatPress(chat)}
              onLongPress={() => handleChatLongPress(chat)}
            />
          ))
        )}
      </div>
    </div>
  )
}