import { memo, useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { formatMessageTime } from '../lib/utils'
import { Avatar } from './Avatar'

interface MessageBubbleProps {
  message: any
  onReply: (message: any) => void
  isOwn: boolean
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export const MessageBubble = memo(function MessageBubble({ message, onReply, isOwn }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setShowReactions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const content = message.Content || {}
  const timestamp = message.Info?.Timestamp ? new Date(message.Info.Timestamp).getTime() / 1000 : Date.now() / 1000
  const isPending = message.isPending
  const isStarred = false // TODO: implement

  const renderContent = () => {
    if (content.conversation) {
      return <span className="whitespace-pre-wrap break-words">{content.conversation}</span>
    }
    if (content.extendedTextMessage?.text) {
      return <span className="whitespace-pre-wrap break-words">{content.extendedTextMessage.text}</span>
    }
    if (content.imageMessage) {
      const imgSrc = content.imageMessage._tempImage || content.imageMessage.url || ''
      return (
        <div className="relative max-w-[240px]">
          {imgSrc && <img src={imgSrc} alt="" className="rounded-xl max-w-full h-auto" />}
          {content.imageMessage.caption && (
            <p className="mt-2 text-sm whitespace-pre-wrap break-words">{content.imageMessage.caption}</p>
          )}
        </div>
      )
    }
    if (content.videoMessage) {
      const vidSrc = content.videoMessage._tempFile ? URL.createObjectURL(content.videoMessage._tempFile) : content.videoMessage.url || ''
      return (
        <div className="relative max-w-[240px]">
          {vidSrc && <video src={vidSrc} controls className="rounded-xl max-w-full h-auto" />}
          {content.videoMessage.caption && <p className="mt-2 text-sm">{content.videoMessage.caption}</p>}
        </div>
      )
    }
    if (content.audioMessage) {
      const audSrc = content.audioMessage._tempFile ? URL.createObjectURL(content.audioMessage._tempFile) : content.audioMessage.url || ''
      return (
        <div className="flex items-center gap-3 bg-surface-elevated/50 dark:bg-surface-elevated-dark/50 rounded-xl p-2 max-w-[240px]">
          {audSrc && <audio src={audSrc} controls className="w-full" />}
        </div>
      )
    }
    if (content.documentMessage) {
      return (
        <div className="flex items-center gap-3 bg-surface-elevated/50 dark:bg-surface-elevated-dark/50 rounded-xl p-3 max-w-[240px] min-w-[180px]">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{content.documentMessage.fileName || 'Document'}</p>
            <p className="text-xs text-text-secondary dark:text-text-secondary-dark">{formatFileSize(content.documentMessage.fileLength)}</p>
          </div>
        </div>
      )
    }
    if (content.stickerMessage) {
      const stickerSrc = content.stickerMessage._tempFile ? URL.createObjectURL(content.stickerMessage._tempFile) : content.stickerMessage.url || ''
      return stickerSrc ? <img src={stickerSrc} alt="Sticker" className="max-w-[200px] max-h-[200px]" /> : null
    }
    if (content.locationMessage) {
      return (
        <div className="rounded-xl overflow-hidden border border-border/50 dark:border-border-dark/50 max-w-[240px]">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-text-secondary dark:text-text-secondary-dark">📍 Location</span>
          </div>
        </div>
      )
    }
    if (content.contactsArrayMessage?.length) {
      return (
        <div className="space-y-2 max-w-[240px]">
          {content.contactsArrayMessage.map((c: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-surface-elevated/50 dark:bg-surface-elevated-dark/50 rounded-xl">
              <Avatar name={c.displayName || 'Contact'} size="md" />
              <div>
                <p className="font-medium">{c.displayName}</p>
                {c.phones?.[0] && <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{c.phones[0]}</p>}
              </div>
            </div>
          ))}
        </div>
      )
    }
    if (content.pollCreationMessageV2 || content.pollCreationMessage) {
      const poll = content.pollCreationMessageV2 || content.pollCreationMessage
      return (
        <div className="rounded-xl border border-border/50 dark:border-border-dark/50 p-3 max-w-[240px]">
          <p className="font-medium mb-2">{poll.name || 'Poll'}</p>
          <div className="space-y-1">
            {poll.options?.map((opt: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-primary/30" />
                <span>{opt.optionName || opt}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return <span className="text-text-secondary dark:text-text-secondary-dark italic">Unsupported message type</span>
  }

  const renderQuoted = () => {
    if (!content.extendedTextMessage?.contextInfo?.quotedMessage) return null
    const quoted = content.extendedTextMessage.contextInfo.quotedMessage
    return (
      <div className="mb-2 pl-2 border-l-2 border-primary/50 bg-surface-elevated/30 dark:bg-surface-elevated-dark/30 rounded-r-lg">
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark mb-1">Replying to</p>
        <p className="text-sm font-medium">{quoted.conversation || quoted.extendedTextMessage?.text || 'Message'}</p>
      </div>
    )
  }

  const timeStr = formatMessageTime(timestamp)
  const statusIcon = isOwn ? (isPending ? '⏳' : message.Info?.IsFromMe ? '✓✓' : '✓') : ''

  return (
    <div
      ref={bubbleRef}
      className={clsx(
        'flex gap-2 px-4 py-2 max-w-[95%]',
        isOwn ? 'self-end flex-row-reverse' : 'self-start',
        'touch-manipulation',
      )}
      style={{ touchAction: 'manipulation' }}
      onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
      onClick={() => setShowReactions(!showReactions)}
    >
      {!isOwn && (
        <Avatar name={message.Info?.PushName || 'Contact'} jid={message.Info?.Sender} size="sm" />
      )}

      <div className={clsx('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {renderQuoted()}
        <div
          className={clsx(
            'relative rounded-2xl px-4 py-2 min-w-[48px]',
            isOwn
              ? 'bg-primary text-white rounded-tr-md'
              : 'bg-surface dark:bg-surface-dark text-text dark:text-text-dark rounded-tl-md',
          )}
          style={{ maxWidth: '100%' }}
        >
          {renderContent()}
        </div>

        <div className={clsx('flex items-end gap-1 mt-0.5 text-[10px]', isOwn ? 'text-white/70' : 'text-text-secondary dark:text-text-secondary-dark')}>
          <span>{timeStr}</span>
          {isOwn && <span>{statusIcon}</span>}
          {isStarred && <span className="text-yellow-400">★</span>}
        </div>

        {showReactions && (
          <div className={clsx('flex gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
            <div className="flex gap-1 bg-surface-elevated dark:bg-surface-elevated-dark rounded-full px-2 py-1 shadow-lg">
              {REACTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => { /* TODO: send reaction */ setShowReactions(false) }}
                  className="p-1 text-lg hover:scale-110 transition-transform min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-surface dark:bg-surface-dark rounded-xl shadow-xl border border-border/50 dark:border-border-dark/50 py-1 min-w-[160px]"
          style={{
            top: `${(bubbleRef.current?.getBoundingClientRect().top || 0) - 120}px`,
            left: isOwn ? 'auto' : '60px',
            right: isOwn ? '60px' : 'auto',
          }}
        >
          <button onClick={() => { onReply(message); setShowMenu(false) }} className="w-full px-4 py-2 text-left text-sm hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark">Reply</button>
          <button onClick={() => { /* TODO: forward */ setShowMenu(false) }} className="w-full px-4 py-2 text-left text-sm hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark">Forward</button>
          <button onClick={() => { /* TODO: star */ setShowMenu(false) }} className="w-full px-4 py-2 text-left text-sm hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark">{isStarred ? 'Unstar' : 'Star'}</button>
          <button onClick={() => { /* TODO: delete */ setShowMenu(false) }} className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark">Delete</button>
        </div>
      )}
    </div>
  )
})

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}