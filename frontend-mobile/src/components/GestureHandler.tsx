import { useRef, useEffect, useCallback } from 'react'

interface GestureHandlerProps {
  children: React.ReactNode
  onSwipeRight?: () => void
  threshold?: number
}

export function GestureHandler({ children, onSwipeRight, threshold = 100 }: GestureHandlerProps) {
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const elementRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!onSwipeRight) return
    startX.current = e.touches[0].clientX
    currentX.current = startX.current
    isDragging.current = true
  }, [onSwipeRight])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !onSwipeRight) return
    currentX.current = e.touches[0].clientX
    const delta = currentX.current - startX.current
    if (delta > 0 && elementRef.current) {
      elementRef.current.style.transform = `translateX(${Math.min(delta, 200)}px)`
      elementRef.current.style.transition = 'none'
    }
  }, [onSwipeRight])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !onSwipeRight) return
    const delta = currentX.current - startX.current
    if (elementRef.current) {
      elementRef.current.style.transition = 'transform 0.2s ease-out'
      elementRef.current.style.transform = 'translateX(0)'
    }
    if (delta > threshold) {
      onSwipeRight()
    }
    isDragging.current = false
  }, [onSwipeRight, threshold])

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart as any, { passive: true })
    el.addEventListener('touchmove', handleTouchMove as any, { passive: true })
    el.addEventListener('touchend', handleTouchEnd)
    el.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      el.removeEventListener('touchstart', handleTouchStart as any)
      el.removeEventListener('touchmove', handleTouchMove as any)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div ref={elementRef} className="h-full w-full touch-none" style={{ touchAction: 'pan-y' }}>
      {children}
    </div>
  )
}