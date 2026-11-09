import { useState, useEffect, useCallback } from 'react'
import { ChatListScreen } from './screens/ChatListScreen'
import { ChatDetailScreen } from './screens/ChatDetailScreen'
import { CallsScreen } from './screens/CallsScreen'
import { CommunitiesScreen } from './screens/CommunitiesScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { LoginScreen } from './screens/LoginScreen'
import { useChatStore } from './store/chatStore'
import { useUIStore } from './store/uiStore'
import { BottomNav } from './components/BottomNav'
import { Header } from './components/Header'
import { GestureHandler } from './components/GestureHandler'

type Screen = 'chats' | 'calls' | 'communities' | 'settings' | 'login' | 'chat-detail'

interface AppState {
  screen: Screen
  selectedChatId: string | null
  selectedChatName: string
  selectedChatAvatar: string
  isLoggedIn: boolean
  history: Screen[]
}

export function App() {
  const [state, setState] = useState<AppState>({
    screen: 'login',
    selectedChatId: null,
    selectedChatName: '',
    selectedChatAvatar: '',
    isLoggedIn: false,
    history: ['login'],
  })

  const setChats = useChatStore(s => s.setChats)
  const selectChat = useChatStore(s => s.selectChat)
  const clearUnreadCount = useChatStore(s => s.clearUnreadCount)
  const setSearchTerm = useChatStore(s => s.setSearchTerm)
  const setShowEmojiPicker = useUIStore(s => s.setShowEmojiPicker)
  const showEmojiPicker = useUIStore(s => s.showEmojiPicker)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { CheckAuth } = await import('./wailsjs/go/api/Api')
        const authed = await CheckAuth()
        setState(prev => ({
          ...prev,
          isLoggedIn: authed,
          screen: authed ? 'chats' : 'login',
        }))
      } catch {
        setState(prev => ({ ...prev, isLoggedIn: false, screen: 'login' }))
      }
    }
    checkAuth()
  }, [])

  const navigate = useCallback((screen: Screen, chatData?: { id: string; name: string; avatar: string }) => {
    setState(prev => {
      const newHistory = [...prev.history, screen]
      return {
        ...prev,
        screen,
        selectedChatId: chatData?.id ?? prev.selectedChatId,
        selectedChatName: chatData?.name ?? prev.selectedChatName,
        selectedChatAvatar: chatData?.avatar ?? prev.selectedChatAvatar,
        history: newHistory,
      }
    })

    if (screen === 'chat-detail' && chatData) {
      selectChat({ id: chatData.id, name: chatData.name, avatar: chatData.avatar } as any)
      clearUnreadCount(chatData.id)
    }
  }, [selectChat, clearUnreadCount])

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.history.length <= 1) return prev
      const newHistory = [...prev.history]
      newHistory.pop()
      const previousScreen = newHistory[newHistory.length - 1]
      return {
        ...prev,
        screen: previousScreen,
        history: newHistory,
        selectedChatId: previousScreen === 'chat-detail' ? prev.selectedChatId : null,
      }
    })
    setShowEmojiPicker(false)
  }, [setShowEmojiPicker])

  const handleLogout = useCallback(async () => {
    try {
      const { Logout } = await import('./wailsjs/go/api/Api')
      await Logout()
      setState({
        screen: 'login',
        selectedChatId: null,
        selectedChatName: '',
        selectedChatAvatar: '',
        isLoggedIn: false,
        history: ['login'],
      })
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }, [])

  const renderScreen = () => {
    switch (state.screen) {
      case 'login':
        return <LoginScreen onLogin={() => navigate('chats')} />
      case 'chats':
        return (
          <GestureHandler onSwipeRight={goBack}>
            <ChatListScreen
              onOpenChat={navigate}
              onOpenSettings={() => navigate('settings')}
              onLogout={handleLogout}
            />
          </GestureHandler>
        )
      case 'chat-detail':
        return (
          <GestureHandler onSwipeRight={goBack}>
            <ChatDetailScreen
              chatId={state.selectedChatId!}
              chatName={state.selectedChatName}
              chatAvatar={state.selectedChatAvatar}
              onBack={goBack}
            />
          </GestureHandler>
        )
      case 'calls':
        return <CallsScreen onBack={goBack} />
      case 'communities':
        return <CommunitiesScreen onBack={goBack} />
      case 'settings':
        return <SettingsScreen onBack={goBack} onLogout={handleLogout} />
      default:
        return null
    }
  }

  const showBottomNav = state.screen !== 'login' && state.screen !== 'chat-detail'

  const showChatInfo = useUIStore(s => s.chatInfoOpen)
  const setChatInfoOpen = useUIStore(s => s.setChatInfoOpen)

  return (
    <div className="h-screen w-full flex flex-col bg-bg dark:bg-bg-dark overflow-hidden">
      {state.screen !== 'login' && (
        <Header
          title={
            state.screen === 'chats' ? 'Chats' :
            state.screen === 'calls' ? 'Calls' :
            state.screen === 'communities' ? 'Communities' :
            state.screen === 'settings' ? 'Settings' :
            state.selectedChatName
          }
          subtitle={state.screen === 'chat-detail' ? undefined : undefined}
          avatar={state.screen === 'chat-detail' ? state.selectedChatAvatar : undefined}
          onBack={state.screen !== 'chats' && state.screen !== 'calls' && state.screen !== 'communities' && state.screen !== 'settings' ? goBack : undefined}
          onMenu={state.screen === 'chats' ? () => navigate('settings') : state.screen === 'chat-detail' ? () => setChatInfoOpen(true) : undefined}
          showBack={state.screen !== 'chats' && state.screen !== 'calls' && state.screen !== 'communities' && state.screen !== 'settings'}
        />
      )}
      <div className="flex-1 overflow-hidden">
        {renderScreen()}
      </div>
      {showBottomNav && (
        <BottomNav
          currentScreen={state.screen}
          onNavigate={navigate}
          unreadCount={0}
        />
      )}
      {showEmojiPicker && (
        <div className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
          <EmojiPicker onClose={() => setShowEmojiPicker(false)} onSelect={(emoji) => {}} />
        </div>
      )}
    </div>
  )
}

function EmojiPicker({ onClose, onSelect }: { onClose: () => void; onSelect: (emoji: string) => void }) {
  return (
    <div className="bg-surface dark:bg-surface-dark border-t border-border dark:border-border-dark p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">Emoji</span>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
        {['😀','😂','😍','🤔','😢','😡','👍','👎','🙏','🎉','🔥','💯','❤️','💔','😴','🤷','🤞','✨','🌟','⭐','💪','🙌','👏','🤝','🍕','🍔','🍟','🌮','🍣','🍰','☕','🍺','🍷','🎂','🎁','🎈','🏠','🚗','✈️','🌍','🌙','☀️','⭐','🌈','⚡','❄️','🌊','🔥','💧','🌸','🌻','🌳','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊'].map(emoji => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="text-2xl p-2 rounded-lg hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark active:scale-95 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}