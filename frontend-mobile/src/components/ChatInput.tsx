import { useRef, useEffect, useState, useCallback } from 'react'
import { clsx } from 'clsx'

interface ChatInputProps {
  chatId: string
  inputText: string
  pastedImage: string | null
  selectedFile: File | null
  selectedFileType: string
  showEmojiPicker: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement>
  fileInputRef: React.RefObject<HTMLInputElement>
  replyingTo: any
  mentionableContacts: any[]
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onPaste: (e: React.ClipboardEvent) => void
  onSendMessage: () => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: () => void
  onFileTypeChange: (type: string) => void
  onEmojiClick: (emoji: string) => void
  onToggleEmojiPicker: () => void
  onCancelReply: () => void
  onMentionAdd: (contact: any) => void
  selectedMentions: any[]
}

export function ChatInput({
  chatId,
  inputText,
  pastedImage,
  selectedFile,
  selectedFileType,
  showEmojiPicker,
  textareaRef,
  fileInputRef,
  replyingTo,
  mentionableContacts,
  onInputChange,
  onKeyDown,
  onPaste,
  onSendMessage,
  onFileSelect,
  onRemoveFile,
  onFileTypeChange,
  onEmojiClick,
  onToggleEmojiPicker,
  onCancelReply,
  onMentionAdd,
  selectedMentions,
}: ChatInputProps) {
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const mentionQuery = useRef('')
  const mentionsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionsContainerRef.current && !mentionsContainerRef.current.contains(e.target as Node)) {
        setShowMentions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    onKeyDown(e)
    if (e.key === '@' && mentionableContacts.length > 0) {
      setShowMentions(true)
      mentionQuery.current = ''
    } else if (showMentions && e.key === 'Escape') {
      setShowMentions(false)
    } else if (showMentions && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
    } else if (showMentions && e.key === 'Enter') {
      e.preventDefault()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e)
    const value = e.target.value
    const lastAt = value.lastIndexOf('@')
    if (lastAt >= 0 && value.length > lastAt + 1) {
      const query = value.slice(lastAt + 1).split(' ')[0]
      mentionQuery.current = query
      if (query.length > 0) {
        setShowMentions(true)
      }
    } else {
      setShowMentions(false)
    }
  }

  const filteredMentions = mentionableContacts.filter(c => {
    const name = c.full_name || c.push_name ? `~ ${c.push_name}` : c.short || c.phno || ''
    return name.toLowerCase().includes(mentionQuery.current.toLowerCase())
  })

  const handleMentionSelect = (contact: any) => {
    onMentionAdd(contact)
    setShowMentions(false)
    mentionQuery.current = ''
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface dark:bg-surface-dark border-t border-border/50 dark:border-border-dark/50" style={{ paddingBottom: 'var(--safe-area-bottom) + 16px' }}>
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 dark:bg-primary/20 rounded-xl border border-primary/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary shrink-0">
            <path d="M3 10h10a8 8 0 0 1 8 8v2M3 14h6M15 10h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h4" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium">Replying to</p>
            <p className="text-sm truncate">{replyingTo.Content?.conversation || replyingTo.Content?.extendedTextMessage?.text || 'Message'}</p>
          </div>
          <button onClick={onCancelReply} className="p-1 rounded-full hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark text-primary">
            ✕
          </button>
        </div>
      )}

      {pastedImage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated dark:bg-surface-elevated-dark rounded-xl border border-border/50">
          <img src={pastedImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
          <div className="flex-1 text-sm text-text-secondary dark:text-text-secondary-dark">Image attached</div>
          <button onClick={onRemoveFile} className="p-2 rounded-full hover:bg-surface dark:hover:bg-surface-dark text-text-secondary">
            ✕
          </button>
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated dark:bg-surface-elevated-dark rounded-xl border border-border/50">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-text-secondary dark:text-text-secondary-dark">{formatFileSize(selectedFile.size)}</p>
          </div>
          <select
            value={selectedFileType}
            onChange={e => onFileTypeChange(e.target.value)}
            className="px-2 py-1 text-xs border border-border/50 rounded-lg bg-surface dark:bg-surface-dark text-text dark:text-text-dark"
          >
            <option value="document">Document</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="sticker">Sticker</option>
          </select>
          <button onClick={onRemoveFile} className="p-1 rounded-full hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark text-text-secondary">
            ✕
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => { setShowAttachMenu(!showAttachMenu); setShowMentions(false) }}
          className="p-2.5 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary dark:text-text-secondary-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark active:scale-95 transition-transform shrink-0"
          aria-label="Attach"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05a9 9 0 0 0-12.88 0" />
            <polyline points="15 7 21 15 15 23" />
          </svg>
        </button>

        {showAttachMenu && (
          <div className="absolute bottom-full left-4 mb-2 bg-surface dark:bg-surface-dark rounded-xl shadow-xl border border-border/50 p-2 flex gap-1 min-w-[200px]" style={{ zIndex: 100 }}>
            {[
              { id: 'document', icon: '📄', label: 'Document' },
              { id: 'image', icon: '📷', label: 'Photo' },
              { id: 'video', icon: '🎥', label: 'Video' },
              { id: 'audio', icon: '🎙️', label: 'Audio' },
            ].map(item => (
              <label key={item.id} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark cursor-pointer min-h-[48px]">
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept={item.id === 'image' ? 'image/*' : item.id === 'video' ? 'video/*' : item.id === 'audio' ? 'audio/*' : '*/*'}
                  onChange={onFileSelect}
                  className="hidden"
                  onClick={() => {}}
                />
              </label>
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {showMentions && filteredMentions.length > 0 && (
            <div ref={mentionsContainerRef} className="absolute bottom-full left-4 right-4 mb-2 bg-surface dark:bg-surface-dark rounded-xl shadow-xl border border-border/50 max-h-48 overflow-y-auto z-20">
              {filteredMentions.slice(0, 10).map(contact => {
                const name = contact.full_name || contact.push_name ? `~ ${contact.push_name}` : contact.short || contact.phno || ''
                return (
                  <button
                    key={contact.jid}
                    onClick={() => handleMentionSelect(contact)}
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark"
                  >
                    <Avatar name={name} jid={contact.jid} size="sm" />
                    <span className="font-medium">@{name}</span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={onPaste}
                placeholder="Message"
                className="w-full px-4 py-3 bg-surface-elevated dark:bg-surface-elevated-dark border border-border/50 dark:border-border-dark/50 rounded-2xl text-text dark:text-text-dark placeholder-text-secondary dark:placeholder-text-secondary-dark resize-none min-h-[48px] max-h-[150px] pr-12"
                rows={1}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
              {selectedMentions.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-1 flex flex-wrap gap-1 px-1">
                  {selectedMentions.map((m, i) => {
                    const name = m.full_name || m.push_name ? `~ ${m.push_name}` : m.short || m.phno || ''
                    return (
                      <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full flex items-center gap-1">
                        @{name}
                        <button onClick={() => { selectedMentions.splice(i, 1); }} className="ml-1 hover:opacity-70">✕</button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              onClick={onToggleEmojiPicker}
              className="p-2.5 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary dark:text-text-secondary-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark active:scale-95 transition-transform shrink-0"
              aria-label="Emoji"
            >
              😊
            </button>

            <button
              onClick={onSendMessage}
              disabled={!inputText.trim() && !pastedImage && !selectedFile}
              className="p-2.5 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary text-white hover:bg-primary-dark active:scale-95 transition-transform shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showEmojiPicker && (
        <EmojiPicker onClose={onToggleEmojiPicker} onSelect={onEmojiClick} />
      )}
    </div>
  )
}

function EmojiPicker({ onClose, onSelect }: { onClose: () => void; onSelect: (emoji: string) => void }) {
  const emojis = ['😀','😂','😍','🤔','😢','😡','👍','👎','🙏','🎉','🔥','💯','❤️','💔','😴','🤷','🤞','✨','🌟','⭐','💪','🙌','👏','🤝','🍕','🍔','🍟','🌮','🍣','🍰','☕','🍺','🍷','🎂','🎁','🎈','🏠','🚗','✈️','🌍','🌙','☀️','⭐','🌈','⚡','❄️','🌊','🔥','💧','🌸','🌻','🌳','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊']

  return (
    <div className="bg-surface dark:bg-surface-dark border-t border-border/50 p-3" style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">Emoji</span>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark">✕</button>
      </div>
      <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
        {emojis.map(emoji => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="text-2xl p-2 rounded-lg hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Avatar({ name, jid, size = 'sm' }: { name: string; jid?: string; size?: 'sm' | 'md' }) {
  const colors = ['#e8f5e9', '#e3f2fd', '#fce4ec', '#fff3e0', '#f3e5f5', '#e0f2f1', '#e8eaf6', '#f1f8e9']
  let hash = 0
  const seed = jid || name
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  const bg = colors[Math.abs(hash) % colors.length]
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' }
  return (
    <div className={`${sizeMap[size]} rounded-full flex items-center justify-center overflow-hidden shrink-0`} style={{ backgroundColor: bg }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#8696a0" aria-hidden="true">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  )
}