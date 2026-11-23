const EVENT = 'cortexai:toast'

export const showToast = (message, type = 'info') => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, type } }))
}

export const subscribeToToasts = (callback) => {
  const handler = (event) => callback(event.detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
