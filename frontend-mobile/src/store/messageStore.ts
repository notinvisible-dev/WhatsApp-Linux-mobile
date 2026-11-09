import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface DecodedMessage {
  Info?: {
    ID: string
    IsFromMe: boolean
    Timestamp: string
    PushName: string
    Sender: string
  }
  Content?: any
  tempId?: string
  isPending?: boolean
}

interface MessageState {
  messages: Record<string, DecodedMessage[]>
  setMessages: (chatId: string, messages: DecodedMessage[]) => void
  addPendingMessage: (chatId: string, message: DecodedMessage) => void
  updatePendingMessageToSent: (chatId: string, tempId: string, message: DecodedMessage) => void
  updateMessage: (chatId: string, message: DecodedMessage) => void
  prependMessages: (chatId: string, messages: DecodedMessage[]) => void
}

export const useMessageStore = create<MessageState>()(
  immer((set) => ({
    messages: {},

    setMessages: (chatId, msgs) => set(state => {
      state.messages[chatId] = msgs
    }),

    addPendingMessage: (chatId, message) => set(state => {
      if (!state.messages[chatId]) state.messages[chatId] = []
      state.messages[chatId].push(message)
    }),

    updatePendingMessageToSent: (chatId, tempId, message) => set(state => {
      const list = state.messages[chatId]
      if (!list) return
      const idx = list.findIndex(m => m.tempId === tempId)
      if (idx >= 0) {
        state.messages[chatId][idx] = { ...message, isPending: false, tempId: undefined }
      }
    }),

    updateMessage: (chatId, message) => set(state => {
      if (!state.messages[chatId]) {
        state.messages[chatId] = [message]
        return
      }
      const idx = state.messages[chatId].findIndex(m => m.Info?.ID === message.Info?.ID)
      if (idx >= 0) {
        state.messages[chatId][idx] = message
      } else {
        state.messages[chatId].push(message)
      }
    }),

    prependMessages: (chatId, msgs) => set(state => {
      if (!state.messages[chatId]) state.messages[chatId] = []
      state.messages[chatId] = [...msgs, ...state.messages[chatId]]
    }),
  }))
)