export function formatChatTimestamp(ts: number): string {
  const date = new Date(ts * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  } else {
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
  }
}

export function formatMessageTime(ts: number): string {
  const date = new Date(ts * 1000)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function getAvatarColor(seed: string, dark = false): string {
  const colors = dark
    ? ['#1f2c34', '#2a3942', '#344955', '#2d3a4a', '#253a42', '#313c4a', '#2f3e46', '#2d4247']
    : ['#e8f5e9', '#e3f2fd', '#fce4ec', '#fff3e0', '#f3e5f5', '#e0f2f1', '#e8eaf6', '#f1f8e9']
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export const AVATAR_ICON_COLOR = '#8696a0'
export const AVATAR_ICON_ON_DARK = '#ffffff'