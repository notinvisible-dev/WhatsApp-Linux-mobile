import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

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

interface ChatState {
  chats: ChatItem[]
  chatIds: string[]
  chatsById: Map<string, ChatItem>
  selectedChatId: string | null
  selectedChatName: string
  selectedChatAvatar: string
  searchTerm: string
  filteredChatIds: string[]
  isLoading: boolean

  setChats: (chats: ChatItem[]) => void
  addChat: (chat: ChatItem) => void
  updateChat: (id: string, updates: Partial<ChatItem>) => void
  removeChat: (id: string) => void
  selectChat: (chat: ChatItem | null) => void
  setSearchTerm: (term: string) => void
  incrementUnreadCount: (id: string) => void
  clearUnreadCount: (id: string) => void
  resortChats: () => void
  getChat: (id: string) => ChatItem | undefined
  updateChatLastMessage: (id: string, text: string, timestamp: number, sender?: string) => void
  updateSingleChat: (id: string, updates: Partial<ChatItem>) => void
}

const computeFilteredIds = (chatsById: Map<string, ChatItem>, chatIds: string[], searchTerm: string, showArchived: boolean) => {
  const term = searchTerm.toLowerCase()
  return chatIds.filter(id => {
    const chat = chatsById.get(id)
    if (!chat) return false
    if (chat.archived !== showArchived) return false
    if (term && !chat.name.toLowerCase().includes(term) && !chat.subtitle.toLowerCase().includes(term)) return false
    return true
  })
}

const resortChats = (chatsById: Map<string, ChatItem>, chatIds: string[]) => {
  const pinned = chatIds.filter(id => chatsById.get(id)?.pinned)
  const unpinned = chatIds.filter(id => !chatsById.get(id)?.pinned)
  const sortByTime = (a: string, b: string) => {
    const ca = chatsById.get(a)
    const cb = chatsById.get(b)
    return (cb?.timestamp || 0) - (ca?.timestamp || 0)
  }
  return [...pinned.sort(sortByTime), ...unpinned.sort(sortByTime)]
}

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    chats: [],
    chatIds: [],
    chatsById: new Map(),
    selectedChatId: null,
    selectedChatName: '',
    selectedChatAvatar: '',
    searchTerm: '',
    filteredChatIds: [],
    isLoading: false,

    setChats: (chats) => {
      const chatsById = new Map(chats.map(c => [c.id, c]))
      const chatIds = resortChats(chatsById, chats.map(c => c.id))
      set({
        chats,
        chatsById,
        chatIds,
        filteredChatIds: computeFilteredIds(chatsById, chatIds, get().searchTerm, false),
      })
    },

    addChat: (chat) => set(state => {
      if (state.chatsById.has(chat.id)) return
      const newChatsById = new Map(state.chatsById)
      newChatsById.set(chat.id, chat)
      const newChatIds = resortChats(newChatsById, [chat.id, ...state.chatIds])
      return {
        chats: [chat, ...state.chats],
        chatsById: newChatsById,
        chatIds: newChatIds,
        filteredChatIds: computeFilteredIds(newChatsById, newChatIds, state.searchTerm, false),
      }
    }),

    updateChat: (id, updates) => set(state => {
      const chat = state.chatsById.get(id)
      if (!chat) return
      const updated = { ...chat, ...updates }
      const newChatsById = new Map(state.chatsById)
      newChatsById.set(id, updated)
      const newChatIds = resortChats(newChatsById, state.chatIds)
      return {
        chats: state.chats.map(c => c.id === id ? updated : c),
        chatsById: newChatsById,
        chatIds: newChatIds,
        filteredChatIds: computeFilteredIds(newChatsById, newChatIds, state.searchTerm, false),
        selectedChatName: state.selectedChatId === id ? updated.name : state.selectedChatName,
        selectedChatAvatar: state.selectedChatId === id ? updated.avatar || '' : state.selectedChatAvatar,
      }
    }),

    removeChat: (id) => set(state => {
      const newChatsById = new Map(state.chatsById)
      newChatsById.delete(id)
      const newChatIds = state.chatIds.filter(cid => cid !== id)
      return {
        chats: state.chats.filter(c => c.id !== id),
        chatsById: newChatsById,
        chatIds: newChatIds,
        filteredChatIds: computeFilteredIds(newChatsById, newChatIds, state.searchTerm, false),
      }
    }),

    selectChat: (chat) => set({
      selectedChatId: chat?.id || null,
      selectedChatName: chat?.name || '',
      selectedChatAvatar: chat?.avatar || '',
    }),

    setSearchTerm: (term) => set(state => ({
      searchTerm: term,
      filteredChatIds: computeFilteredIds(state.chatsById, state.chatIds, term, false),
    })),

    incrementUnreadCount: (id) => set(state => {
      const chat = state.chatsById.get(id)
      if (!chat || state.selectedChatId === id) return
      const updated = { ...chat, unreadCount: chat.unreadCount + 1 }
      const newChatsById = new Map(state.chatsById)
      newChatsById.set(id, updated)
      return {
        chats: state.chats.map(c => c.id === id ? updated : c),
        chatsById: newChatsById,
      }
    }),

    clearUnreadCount: (id) => set(state => {
      const chat = state.chatsById.get(id)
      if (!chat || chat.unreadCount === 0) return
      const updated = { ...chat, unreadCount: 0 }
      const newChatsById = new Map(state.chatsById)
      newChatsById.set(id, updated)
      return {
        chats: state.chats.map(c => c.id === id ? updated : c),
        chatsById: newChatsById,
      }
    }),

    resortChats: () => set(state => {
      const newChatIds = resortChats(state.chatsById, state.chatIds)
      return {
        chatIds: newChatIds,
        filteredChatIds: computeFilteredIds(state.chatsById, newChatIds, state.searchTerm, false),
      }
    }),

    getChat: (id) => get().chatsById.get(id),

    updateChatLastMessage: (id, text, timestamp, sender) => set(state => {
      const chat = state.chatsById.get(id)
      if (!chat) return
      const preview = sender ? `${sender}: ${text}` : text
      const updated = { ...chat, subtitle: preview, timestamp }
      const newChatsById = new Map(state.chatsById)
      newChatsById.set(id, updated)
      const newChatIds = resortChats(newChatsById, state.chatIds)
      return {
        chats: state.chats.map(c => c.id === id ? updated : c),
        chatsById: newChatsById,
        chatIds: newChatIds,
        filteredChatIds: computeFilteredIds(newChatsById, newChatIds, state.searchTerm, false),
      }
    }),

    updateSingleChat: (id, updates) => set(state => {
      const chat = state.chatsById.get(id)
      if (!chat) return
      const updated = { ...chat, ...updates }
      const newChatsById = new Map(state.chatsById)
      newChatsById.set(id, updated)
      return {
        chats: state.chats.map(c => c.id === id ? updated : c),
        chatsById: newChatsById,
      }
    }),
  }))
)