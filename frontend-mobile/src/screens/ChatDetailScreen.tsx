import { useState, useEffect, useRef, useCallback } from 'react'
import { useMessageStore } from '../store/messageStore'
import { useUIStore } from '../store/uiStore'
import { useChatStore } from '../store/chatStore'
import { formatMessageTime } from '../lib/utils'
import { SendMessage, FetchMessagesPaged, MarkRead, GetGroupInfo, GetProfile, SendChatPresence } from '../wailsjs/go/api/Api'
import { EventsOn } from '../wailsjs/runtime/runtime'
import { Header } from '../components/Header'
import { MessageList, type MessageListHandle } from '../components/MessageList'
import { ChatInput } from '../components/ChatInput'
import { ChatInfoPanel } from '../components/ChatInfoPanel'

const PAGE_SIZE = 30
const START_INDEX = 1_000_000

interface ChatDetailScreenProps {
  chatId: string
  chatName: string
  chatAvatar: string
  onBack: () => void
}

export function ChatDetailScreen({ chatId, chatName, chatAvatar, onBack }: ChatDetailScreenProps) {
  const {
    messages,
    setMessages,
    prependMessages,
    addPendingMessage,
    updatePendingMessageToSent,
    updateMessage,
  } = useMessageStore()

  const { showEmojiPicker, setShowEmojiPicker, chatInfoOpen, setChatInfoOpen } = useUIStore()
  const { chatsById } = useChatStore()

  const chatMessages = messages[chatId] || []
  const [inputText, setInputText] = useState('')
  const [pastedImage, setPastedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileType, setSelectedFileType] = useState('')
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [mentionableContacts, setMentionableContacts] = useState<any[]>([])
  const [selectedMentions, setSelectedMentions] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX)
  const [chatSubtitle, setChatSubtitle] = useState('')

  const messageListRef = useRef<MessageListHandle>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isComposingRef = useRef(false)
  const requestGenerationRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)
  const loadMorePromiseRef = useRef<Promise<any[]> | null>(null)
  const initialLoadPromiseRef = useRef<Promise<void> | null>(null)
  const mountedRef = useRef(true)

  const currentChat = chatsById.get(chatId)
  const chatType = currentChat?.type || 'contact'

  const scrollToBottom = useCallback((instant = false) => {
    requestAnimationFrame(() => {
      messageListRef.current?.scrollToBottom(instant ? 'auto' : 'smooth')
    })
  }, [])

  const handleAtBottomChange = useCallback((atBottom: boolean) => {
    setIsAtBottom(atBottom)
  }, [])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [chatId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (chatInfoOpen) { setChatInfoOpen(false); return }
      if (showEmojiPicker) { setShowEmojiPicker(false); return }
      if (replyingTo) { setReplyingTo(null); return }
      onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [chatInfoOpen, showEmojiPicker, replyingTo, onBack, setChatInfoOpen, setShowEmojiPicker])

  useEffect(() => {
    setChatSubtitle('')
    if (chatType === 'group') {
      GetGroupInfo(chatId).then(groupInfo => {
        const participantLabel = (c: any) =>
          c.full_name || (c.push_name ? `~ ${c.push_name}` : '') || c.short || c.phno || ''
        GetProfile('').then(self => {
          const others = groupInfo.group_participants
            .map((p: any) => p.contact)
            .filter((c: any) => c && c.phno !== self.phno && c.jid !== self.jid)
          setChatSubtitle(['You', ...others.map(participantLabel).filter(Boolean)].join(', '))
          setMentionableContacts(others)
        }).catch(() => {
          const contacts = groupInfo.group_participants.map((p: any) => p.contact)
          setChatSubtitle(contacts.map(participantLabel).filter(Boolean).join(', '))
          setMentionableContacts(contacts)
        })
      }).catch(() => setMentionableContacts([]))
    } else {
      setMentionableContacts([])
    }
  }, [chatId, chatType])

  useEffect(() => {
    if (isAtBottom) {
      const messageIds = chatMessages.map((m: any) => m?.Info?.ID).filter(Boolean)
      if (messageIds.length > 0) {
        MarkRead(chatId, messageIds, 'read-msg').catch(console.error)
      }
    }
  }, [isAtBottom, chatId, chatMessages])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInputText(newValue)

    if (selectedMentions.length > 0) {
      setSelectedMentions(prev => prev.filter(mention => {
        let name = mention.full_name
        if (!name) name = mention.push_name ? `~ ${mention.push_name}` : mention.short || mention.phno
        return newValue.includes(`@${name}`)
      }))
    }

    if (!isComposingRef.current) {
      isComposingRef.current = true
      SendChatPresence(chatId, 'composing', '').catch(() => {})
    }

    if (typingTimeout) clearTimeout(typingTimeout)
    const timeout = setTimeout(() => {
      isComposingRef.current = false
      SendChatPresence(chatId, 'paused', '').catch(() => {})
    }, 1500)
    setTypingTimeout(timeout)
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() && !pastedImage && !selectedFile) return

    const textToSend = inputText
    const imageToSend = pastedImage
    const fileToSend = selectedFile
    const fileTypeToSend = selectedFileType
    const quotedMessageId = replyingTo?.Info?.ID

    const tempId = `temp-${Date.now()}-${Math.random()}`

    const pendingMessage: any = {
      tempId,
      isPending: true,
      Info: {
        ID: tempId,
        IsFromMe: true,
        Timestamp: new Date().toISOString(),
        PushName: 'You',
        Sender: '',
      },
      Content: {},
    }

    if (imageToSend) {
      pendingMessage.Content = {
        imageMessage: { caption: textToSend || '', mimetype: 'image/png', _tempImage: imageToSend },
      }
    } else if (fileToSend) {
      if (fileTypeToSend === 'sticker') {
        pendingMessage.Content = { stickerMessage: { mimetype: fileToSend.type, _tempFile: fileToSend } }
      } else if (fileTypeToSend === 'image') {
        pendingMessage.Content = { imageMessage: { caption: textToSend || '', mimetype: fileToSend.type, _tempFile: fileToSend } }
      } else if (fileTypeToSend === 'video') {
        pendingMessage.Content = { videoMessage: { caption: textToSend || '', mimetype: fileToSend.type, _tempFile: fileToSend } }
      } else if (fileTypeToSend === 'audio') {
        pendingMessage.Content = { audioMessage: { mimetype: fileToSend.type, _tempFile: fileToSend } }
      } else {
        pendingMessage.Content = { documentMessage: { caption: textToSend || '', fileName: fileToSend.name, mimetype: fileToSend.type } }
      }
    } else {
      pendingMessage.Content = { conversation: textToSend }
    }

    if (quotedMessageId && replyingTo) {
      const contextInfo = {
        quotedMessage: replyingTo.Content,
        participant: replyingTo.Info.Sender,
        stanzaId: replyingTo.Info.ID,
      }
      if (pendingMessage.Content.conversation) {
        pendingMessage.Content = { extendedTextMessage: { text: pendingMessage.Content.conversation, contextInfo } }
      } else if (pendingMessage.Content.imageMessage) {
        pendingMessage.Content.imageMessage.contextInfo = contextInfo
      } else if (pendingMessage.Content.videoMessage) {
        pendingMessage.Content.videoMessage.contextInfo = contextInfo
      } else if (pendingMessage.Content.audioMessage) {
        pendingMessage.Content.audioMessage.contextInfo = contextInfo
      } else if (pendingMessage.Content.documentMessage) {
        pendingMessage.Content.documentMessage.contextInfo = contextInfo
      } else if (pendingMessage.Content.stickerMessage) {
        pendingMessage.Content.stickerMessage.contextInfo = contextInfo
      }
    }

    addPendingMessage(chatId, pendingMessage)
    setInputText('')
    setPastedImage(null)
    setSelectedFile(null)
    setReplyingTo(null)
    setSelectedMentions([])

    if (!isAtBottom) scrollToBottom(false)

    let processedText = textToSend
    const mentionsToSend: string[] = []
    if (selectedMentions.length > 0) {
      const sortedMentions = [...selectedMentions].sort((a, b) => {
        let nameA = a.full_name || a.push_name ? `~ ${a.push_name}` : a.short || a.phno
        let nameB = b.full_name || b.push_name ? `~ ${b.push_name}` : b.short || b.phno
        return nameB.length - nameA.length
      })
      for (const mention of sortedMentions) {
        let name = mention.full_name || mention.push_name ? `~ ${mention.push_name}` : mention.short || mention.phno
        const mentionText = `@${name}`
        if (processedText.includes(mentionText)) {
          const userPart = mention.jid.split('@')[0]
          processedText = processedText.replaceAll(mentionText, `@${userPart}`)
          mentionsToSend.push(mention.jid)
        }
      }
    }

    try {
      if (imageToSend) {
        const base64 = imageToSend.split(',')[1]
        const mimetype = imageToSend.match(/^data:([^;,]+)/)?.[1] || 'image/png'
        await SendMessage(chatId, { type: 'image', clientTempId: tempId, base64Data: base64, mimetype, text: processedText, quotedMessageId, mentions: mentionsToSend })
      } else if (fileToSend) {
        const base64 = await blobToDataURL(fileToSend).then(r => r.split(',')[1])
        await SendMessage(chatId, { type: fileTypeToSend, clientTempId: tempId, base64Data: base64, mimetype: fileToSend.type || 'application/octet-stream', fileName: fileToSend.name, text: processedText, quotedMessageId, mentions: mentionsToSend })
      } else {
        await SendMessage(chatId, { type: 'text', clientTempId: tempId, text: processedText, quotedMessageId, mentions: mentionsToSend })
      }
    } catch (err) {
      console.error('Failed to send:', err)
    }
  }

  const blobToDataURL = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })

  const loadInitialMessages = useCallback(async (generation: number) => {
    setInitialLoad(true)
    setIsReady(false)
    const beforeRequest = new Map((useMessageStore.getState().messages[chatId] || []).map(m => [m.Info?.ID, m]))
    try {
      const msgs = await FetchMessagesPaged(chatId, PAGE_SIZE, 0, '')
      if (requestGenerationRef.current !== generation) return
      const loadedMsgs = msgs || []

      const current = useMessageStore.getState().messages[chatId] || []
      const currentByID = new Map(current.map(m => [m.Info?.ID, m]))
      const loadedIDs = new Set(loadedMsgs.map(m => m.Info?.ID))
      const merged = loadedMsgs.map(m => {
        const currentMessage = currentByID.get(m.Info?.ID)
        return currentMessage && currentMessage !== beforeRequest.get(m.Info?.ID) ? currentMessage : m
      })
      for (const m of current) {
        const id = m.Info?.ID
        if (id && !loadedIDs.has(id) && (!beforeRequest.has(id) || m.isPending)) merged.push(m)
      }
      setMessages(chatId, merged)
      hasMoreRef.current = loadedMsgs.length >= PAGE_SIZE
      setHasMore(hasMoreRef.current)

      requestAnimationFrame(() => {
        if (requestGenerationRef.current !== generation) return
        setIsReady(true)
        setInitialLoad(false)
      })
    } catch (err) {
      if (requestGenerationRef.current !== generation) return
      console.error('Initial load failed:', err)
      setInitialLoad(false)
    }
  }, [chatId, setMessages])

  const loadMoreMessages = useCallback((): Promise<any[]> => {
    if (loadMorePromiseRef.current) return loadMorePromiseRef.current
    if (!hasMoreRef.current || loadingMoreRef.current) return Promise.resolve([])

    const currentMessages = useMessageStore.getState().messages[chatId] || []
    if (currentMessages.length === 0) return Promise.resolve([])

    const generation = requestGenerationRef.current
    const oldestMessage = currentMessages[0]
    const beforeTimestamp = Math.floor(new Date(oldestMessage.Info.Timestamp).getTime() / 1000)
    loadingMoreRef.current = true
    setIsLoadingMore(true)

    const request = (async () => {
      try {
        const msgs = (await FetchMessagesPaged(chatId, PAGE_SIZE, beforeTimestamp, oldestMessage.Info.ID)) || []
        if (requestGenerationRef.current !== generation) return []

        if (msgs.length > 0) {
          setFirstItemIndex(prev => prev - msgs.length)
          prependMessages(chatId, msgs)
        }
        hasMoreRef.current = msgs.length >= PAGE_SIZE
        setHasMore(hasMoreRef.current)
        return msgs
      } catch (err) {
        if (requestGenerationRef.current === generation) console.error('Load more failed:', err)
        return []
      }
    })()

    loadMorePromiseRef.current = request
    void request.finally(() => {
      if (loadMorePromiseRef.current === request) loadMorePromiseRef.current = null
      if (requestGenerationRef.current === generation) {
        loadingMoreRef.current = false
        setIsLoadingMore(false)
      }
    })
    return request
  }, [chatId, prependMessages])

  useEffect(() => {
    const generation = ++requestGenerationRef.current
    loadingMoreRef.current = false
    loadMorePromiseRef.current = null
    hasMoreRef.current = true
    setFirstItemIndex(START_INDEX)
    setHasMore(true)
    setIsLoadingMore(false)
    setIsAtBottom(true)
    const initialRequest = loadInitialMessages(generation)
    initialLoadPromiseRef.current = initialRequest
    void initialRequest.finally(() => {
      if (initialLoadPromiseRef.current === initialRequest) initialLoadPromiseRef.current = null
    })
    return () => {
      if (requestGenerationRef.current === generation) requestGenerationRef.current++
      loadingMoreRef.current = false
      loadMorePromiseRef.current = null
      initialLoadPromiseRef.current = null
    }
  }, [chatId, loadInitialMessages])

  useEffect(() => {
    const unsub = EventsOn('wa:new_message', (data: { chatId: string; message: any; clientTempId?: string }) => {
      if (data?.chatId === chatId && data.message?.Info?.ID) {
        const currentMessages = useMessageStore.getState().messages[chatId] || []
        const hasPendingMessage = currentMessages.some((m: any) => m.isPending)

        if (hasPendingMessage && data.message.Info?.IsFromMe && data.clientTempId) {
          const pendingMessages = currentMessages.filter((m: any) => m.isPending)
          const pending = pendingMessages.find((m: any) => m.tempId === data.clientTempId)
          if (pending) {
            for (const body of ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage']) {
              const transient = pending.Content?.[body]?._tempImage || pending.Content?.[body]?._tempFile
              if (transient && data.message.Content?.[body]) {
                data.message.Content[body][transient instanceof File ? '_tempFile' : '_tempImage'] = transient
              }
            }
            updatePendingMessageToSent(data.chatId, pending.tempId, data.message)
          } else {
            updateMessage(data.chatId, data.message)
          }
        } else {
          updateMessage(data.chatId, data.message)
        }
      }
    })
    return () => unsub()
  }, [chatId, updateMessage, updatePendingMessageToSent])

  return (
    <div className="h-full flex flex-col w-full px-4" style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}>
      <div className="flex-1 relative min-h-0 w-full">
        <MessageList
          ref={messageListRef}
          messages={chatMessages}
          firstItemIndex={firstItemIndex}
          onReply={setReplyingTo}
          onLoadMore={() => void loadMoreMessages()}
          onAtBottomChange={handleAtBottomChange}
          isLoading={isLoadingMore}
          hasMore={isReady && hasMore}
        />

        {(initialLoad || !isReady) && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg dark:bg-bg-dark z-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
      </div>

      <ChatInput
        chatId={chatId}
        inputText={inputText}
        pastedImage={pastedImage}
        selectedFile={selectedFile}
        selectedFileType={selectedFileType}
        showEmojiPicker={showEmojiPicker}
        textareaRef={textareaRef}
        fileInputRef={fileInputRef}
        replyingTo={replyingTo}
        mentionableContacts={mentionableContacts}
        onInputChange={handleInputChange}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
        onPaste={async (e) => {
          const items = e.clipboardData?.items
          for (const item of items || []) {
            if (item.type.indexOf('image') !== -1) {
              const file = item.getAsFile()
              if (file) { e.preventDefault(); setPastedImage(await blobToDataURL(file)); return }
            }
          }
          if (!navigator.clipboard?.read) return
          try {
            const clipboardItems = await navigator.clipboard.read()
            for (const clipboardItem of clipboardItems) {
              const imageType = clipboardItem.types.find(t => t.startsWith('image/'))
              if (imageType) {
                const blob = await clipboardItem.getType(imageType)
                setPastedImage(await blobToDataURL(blob))
                return
              }
            }
          } catch {}
        }}
        onSendMessage={handleSendMessage}
        onFileSelect={e => {
          const file = e.target.files?.[0]
          if (file) {
            setSelectedFile(file)
            const generalType = file.type.split('/')[0]
            setSelectedFileType(
              generalType === 'image' || generalType === 'video' || generalType === 'audio'
                ? generalType
                : 'document'
            )
          }
        }}
        onRemoveFile={() => { setSelectedFile(null); setPastedImage(null) }}
        onFileTypeChange={setSelectedFileType}
        onEmojiClick={emoji => { setInputText(prev => prev + emoji); setShowEmojiPicker(false) }}
        onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
        onCancelReply={() => setReplyingTo(null)}
        onMentionAdd={contact => setSelectedMentions(prev => [...prev, contact])}
        selectedMentions={selectedMentions}
      />

      <ChatInfoPanel
        chatId={chatId}
        chatName={chatName}
        chatType={chatType}
        chatAvatar={chatAvatar}
        isOpen={chatInfoOpen}
        onClose={() => setChatInfoOpen(false)}
      />
    </div>
  )
}