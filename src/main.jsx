import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
  const blockPinch = (event) => {
    if (event.touches && event.touches.length > 1) event.preventDefault()
  }
  const blockGesture = (event) => event.preventDefault()
  document.addEventListener('touchmove', blockPinch, { passive: false })
  document.addEventListener('gesturestart', blockGesture)
  document.addEventListener('gesturechange', blockGesture)
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
