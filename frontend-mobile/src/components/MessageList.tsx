import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react'
import { Virtuoso, VirtuosoHandle, Components } from 'react-virtuoso'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  messages: any[]
  firstItemIndex: number
  onReply: (message: any) => void
  onLoadMore: () => void
  onAtBottomChange: (atBottom: boolean) => void
  isLoading: boolean
  hasMore: boolean
}

export interface MessageListHandle {
  scrollToBottom: (behavior: 'auto' | 'smooth') => void
  scrollToMessage: (id: string) => boolean
}

const LoadingFooter = () => (
  <div className="flex items-center justify-center py-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
  </div>
)

const EndFooter = () => (
  <div className="py-4 text-center text-text-secondary dark:text-text-secondary-dark text-xs">
    End of messages
  </div>
)

const components: Components<any> = {
  Footer: () => null, // Will be overridden dynamically
}

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(
  ({ messages, firstItemIndex, onReply, onLoadMore, onAtBottomChange, isLoading, hasMore }, ref) => {
    const virtuosoRef = useRef<VirtuosoHandle>(null)
    const [isAtBottom, setIsAtBottom] = useState(true)

    useImperativeHandle(ref, () => ({
      scrollToBottom: (behavior) => {
        virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end', behavior })
      },
      scrollToMessage: (id) => {
        const idx = messages.findIndex(m => m.Info?.ID === id)
        if (idx >= 0) {
          virtuosoRef.current?.scrollToIndex({ index: idx, align: 'center', behavior: 'smooth' })
          return true
        }
        return false
      },
    }))

    const itemContent = useCallback((index: number, item: any) => {
      if (index === 0 && hasMore) {
        return <div style={{ height: 20 }} />
      }
      return <MessageBubble key={item.Info?.ID} message={item} onReply={onReply} isOwn={item.Info?.IsFromMe} />
    }, [hasMore, onReply])

    // Dynamic components based on state
    const dynamicComponents = {
      Footer: isLoading
        ? LoadingFooter
        : (!hasMore && messages.length > 0 ? EndFooter : null),
    }

    return (
      <Virtuoso
        ref={virtuosoRef}
        style={{ height: '100%', width: '100%' }}
        data={messages}
        initialTopMostItemIndex={firstItemIndex}
        overscan={10}
        itemContent={itemContent}
        components={dynamicComponents}
      />
    )
  }
)

MessageList.displayName = 'MessageList'