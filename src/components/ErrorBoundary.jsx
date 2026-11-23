import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('App crash:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#08080a] p-6 text-center text-white/90">
          <div className="text-lg font-semibold">Something went wrong</div>
          <div className="max-w-md break-words rounded-lg bg-white/[0.06] p-3 text-left text-[12px] text-white/60">
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.caches) caches.keys().then((keys) => keys.forEach((key) => caches.delete(key))).catch(() => {})
              if (navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {})
              window.location.reload()
            }}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-[13px] font-medium text-black"
          >
            Clear cache & reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
