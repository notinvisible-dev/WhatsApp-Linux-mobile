import { clsx } from 'clsx'

interface AvatarProps {
  src?: string
  name: string
  jid?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  type?: 'contact' | 'group'
  dark?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export function Avatar({ src, name, jid, size = 'md', type = 'contact', dark = false, className }: AvatarProps) {
  const bgColor = getAvatarColor(jid || name, dark)
  const iconColor = dark ? '#ffffff' : '#8696a0'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={clsx('rounded-full flex items-center justify-center overflow-hidden', sizeClasses[size], className)}
      style={{ backgroundColor: bgColor }}
      aria-label={name}
    >
      {type === 'group' ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={iconColor} aria-hidden="true">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={iconColor} aria-hidden="true">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )}
    </div>
  )
}

function getAvatarColor(seed: string, dark: boolean): string {
  const colors = dark
    ? ['#1f2c34', '#2a3942', '#344955', '#2d3a4a', '#253a42', '#313c4a', '#2f3e46', '#2d4247']
    : ['#e8f5e9', '#e3f2fd', '#fce4ec', '#fff3e0', '#f3e5f5', '#e0f2f1', '#e8eaf6', '#f1f8e9']
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}