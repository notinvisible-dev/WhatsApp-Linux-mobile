import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface UIState {
  showEmojiPicker: boolean
  setShowEmojiPicker: (show: boolean) => void
  typingIndicator: Record<string, boolean>
  setTypingIndicator: (chatId: string, typing: boolean) => void
  chatInfoOpen: boolean
  setChatInfoOpen: (open: boolean) => void
  pollResultsFor: string | null
  setPollResultsFor: (messageId: string | null) => void
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    showEmojiPicker: false,
    setShowEmojiPicker: (show) => set({ showEmojiPicker: show }),
    typingIndicator: {},
    setTypingIndicator: (chatId, typing) => set(state => {
      if (typing) state.typingIndicator[chatId] = true
      else delete state.typingIndicator[chatId]
    }),
    chatInfoOpen: false,
    setChatInfoOpen: (open) => set({ chatInfoOpen: open }),
    pollResultsFor: null,
    setPollResultsFor: (id) => set({ pollResultsFor: id }),
  }))
)