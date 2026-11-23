import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { subscribeToToasts } from '../lib/toast.js'

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }

export default function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => subscribeToToasts((toast) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 3200)
  }), [])

  const dismiss = (id) => setToasts((prev) => prev.filter((item) => item.id !== id))

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[100] flex w-[min(340px,calc(100vw-2rem))] flex-col gap-2 sm:bottom-5">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info
        return (
          <div key={toast.id} className="toast-in glass pointer-events-auto flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] shadow-xl">
            <Icon size={15} className={`mt-0.5 shrink-0 ${toast.type === 'error' ? 'text-red-300' : 'text-cyan-300'}`} />
            <span className="min-w-0 flex-1 break-words">{toast.message}</span>
            <button type="button" onClick={() => dismiss(toast.id)} className="text-white/30 transition-colors hover:text-white/70" aria-label="Dismiss">
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
