import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { GetQRCode, CheckAuth } from '../wailsjs/go/api/Api'
import { EventsOn } from '../wailsjs/runtime/runtime'

interface LoginScreenProps {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paired, setPaired] = useState(false)

  useEffect(() => {
    const loadQR = async () => {
      setLoading(true)
      try {
        const code = await GetQRCode()
        setQrCode(code)
      } catch (err) {
        setError('Failed to load QR code. Please try again.')
        console.error('QR load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadQR()

    const unsub = EventsOn('wa:qr_update', (data: { code: string }) => {
      if (data?.code) setQrCode(data.code)
    })

    const unsubPaired = EventsOn('wa:paired', () => {
      setPaired(true)
      setTimeout(() => { onLogin() }, 500)
    })

    return () => { unsub(); unsubPaired() }
  }, [onLogin])

  useEffect(() => {
    const check = async () => {
      try {
        const authed = await CheckAuth()
        if (authed) onLogin()
      } catch {}
    }
    check()
  }, [onLogin])

  if (paired) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center" style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary mb-6" />
        <h2 className="text-xl font-semibold text-text dark:text-text-dark">Connecting...</h2>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col items-center justify-center px-3 text-center" style={{ 
      paddingTop: 'var(--safe-area-top)',
      paddingBottom: 'var(--safe-area-bottom)'
    }}>
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 shrink-0">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      <h1 className="text-lg font-semibold text-text dark:text-text-dark mb-1 shrink-0">Whats4Linux</h1>
      <p className="text-text-secondary dark:text-text-secondary-dark mb-3 max-w-xs shrink-0 text-sm">
        Scan the QR code with your phone to link this device.
      </p>

      {error && (
        <div className="w-full max-w-md mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs shrink-0">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center min-h-0 w-full shrink-0">
        {loading ? (
          <div className="aspect-square w-full max-w-[240px] rounded-xl bg-surface-elevated dark:bg-surface-elevated-dark flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-primary" />
          </div>
        ) : qrCode ? (
          <div className="aspect-square w-full max-w-[240px] rounded-xl bg-white p-2 shadow-lg">
            <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
          </div>
        ) : (
          <div className="aspect-square w-full max-w-[240px] rounded-xl bg-surface-elevated dark:bg-surface-elevated-dark flex items-center justify-center">
            <span className="text-text-secondary dark:text-text-secondary-dark">Failed to load</span>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-text-secondary dark:text-text-secondary-dark max-w-xs shrink-0">
        <p>Open WhatsApp → Settings → Linked Devices → Link a Device</p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="mt-3 px-5 py-2 bg-primary text-white rounded-full font-medium min-h-[44px] min-w-[44px] shrink-0 text-sm"
      >
        Refresh QR Code
      </button>
    </div>
  )
}