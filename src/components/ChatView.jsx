import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown, ArrowUp, Check, ChevronDown, FileText, Globe2,
  Image as ImageIcon, Menu, Mic, Paperclip, Plus,
  Square, X,
} from 'lucide-react'
import Message from './Message.jsx'
import { MODELS } from '../lib/storage.js'
import { showToast } from '../lib/toast.js'

const SUGGESTIONS = [
  'Explain this simply',
  'Help me learn the basics',
  'Break this into steps',
]

function Composer({ value, onChange, onSend, onStop, streaming, think, onToggleThink, features, attachments, onAttachmentsChange, model, onModelChange }) {
  const textareaRef = useRef(null)
  const fileRef = useRef(null)
  const recognitionRef = useRef(null)
  const attachBtnRef = useRef(null)
  const attachMenuRef = useRef(null)
  const [attachOpen, setAttachOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const modelBtnRef = useRef(null)
  const modelMenuRef = useRef(null)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [value])

  useEffect(() => () => recognitionRef.current?.stop(), [])

  useEffect(() => {
    if (!attachOpen) return
    const close = (event) => {
      if (!attachMenuRef.current?.contains(event.target) && !attachBtnRef.current?.contains(event.target)) setAttachOpen(false)
    }
    const escape = (event) => { if (event.key === 'Escape') setAttachOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [attachOpen])

  useEffect(() => {
    if (!modelOpen) return
    const close = (event) => {
      if (!modelMenuRef.current?.contains(event.target) && !modelBtnRef.current?.contains(event.target)) setModelOpen(false)
    }
    const escape = (event) => { if (event.key === 'Escape') setModelOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [modelOpen])

  const pick = (accept) => {
    if (fileRef.current) {
      fileRef.current.accept = accept
      fileRef.current.value = ''
      fileRef.current.click()
    }
    setAttachOpen(false)
  }

  const submit = (event) => {
    event.preventDefault()
    const text = value.trim()
    if ((!text && !attachments.length) || streaming) return
    onSend(text, attachments)
    onChange('')
    onAttachmentsChange([])
  }

  const readImageDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const maxSide = 1024
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      image.onerror = reject
      image.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const readDataUrl = () => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    try {
      if (file.type.startsWith('image/')) {
        onAttachmentsChange([...attachments, { name: file.name, dataUrl: await readImageDataUrl(file), kind: 'image' }])
        showToast(`${file.name} attached`, 'success')
      } else if (/\.(txt|md|csv|json|js|jsx|ts|tsx|py|html|css|xml|log)$/i.test(file.name) || file.type === 'text/plain') {
        const text = await file.text()
        onChange(`${value}${value ? '\n' : ''}${text.slice(0, 20000)}`)
        showToast(`${file.name} added to message`, 'success')
      } else {
        onAttachmentsChange([...attachments, { name: file.name, dataUrl: await readDataUrl(), kind: 'file' }])
        showToast(`${file.name} attached`, 'success')
      }
    } catch {
      showToast('Could not attach that file', 'error')
    }
  }

  const toggleVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      showToast('Voice input is not supported in this browser', 'error')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onChange(`${value}${value ? ' ' : ''}${transcript}`)
    }
    recognition.onerror = () => {
      setListening(false)
      showToast('Voice input failed', 'error')
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const showFiles = features?.files !== false
  const showThink = features?.think !== false
  const showVoice = features?.voice !== false
  const shortModel = String(model || '').split('/').pop()
  const isMobileView = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

  return (
    <form onSubmit={submit} className="composer w-full">
      {attachments.length > 0 && (
        <div className="composer-attachments flex flex-wrap gap-2 px-4 pt-3">
          {attachments.map((attachment, index) => (
            <div key={index} className="group relative overflow-hidden rounded-lg border border-white/10">
              {attachment.kind === 'image' ? (
                <img src={attachment.dataUrl} alt={attachment.name} className="h-16 w-auto max-w-[140px] bg-black/30 object-contain" />
              ) : (
                <div className="flex h-14 max-w-44 items-center gap-1.5 bg-black/30 px-2.5 text-[10.5px] text-white/60">
                  <FileText size={14} className="shrink-0" />
                  <span className="truncate">{attachment.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onAttachmentsChange(attachments.filter((_, i) => i !== index))}
                className="absolute right-0 top-0 grid h-4 w-4 place-items-center rounded-bl bg-black/70 text-white/80 hover:text-white"
                aria-label="Remove attachment"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            submit(event)
          }
        }}
        placeholder={isMobileView ? 'Reply to CortexAI' : 'Write anything'}
        className="composer-input max-h-44 min-h-[44px] w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-[15px] leading-relaxed text-white/90 outline-none placeholder:text-white/35"
      />
      <div className="composer-controls flex items-center justify-between gap-2 px-3 pb-3 pt-1">
        <div className="composer-left relative flex items-center gap-1">
          {showFiles && (
            <>
              <button
                ref={attachBtnRef}
                type="button"
                onClick={() => setAttachOpen((open) => !open)}
                className="icon-btn grid h-8 w-8 place-items-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"
                title="Add photo or file"
                aria-label="Add photo or file"
              >
                <Plus size={19} strokeWidth={1.8} />
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
              {attachOpen && (
                <div ref={attachMenuRef} className="absolute bottom-11 left-0 z-30 w-56 rounded-xl border border-white/10 bg-[#1e1e20] p-1.5 shadow-2xl">
                  <p className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white/35">Add to message</p>
                  <button
                    type="button"
                    onClick={() => pick('image/*')}
                    className="icon-btn flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-white/75 hover:bg-white/[0.08] hover:text-white"
                  >
                    <ImageIcon size={15} strokeWidth={1.8} /> Photos &amp; images
                  </button>
                  <button
                    type="button"
                    onClick={() => pick('.pdf,.doc,.docx,.txt,.md,.csv,.json')}
                    className="icon-btn flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-white/75 hover:bg-white/[0.08] hover:text-white"
                  >
                    <FileText size={15} strokeWidth={1.8} /> Documents
                  </button>
                  <button
                    type="button"
                    onClick={() => pick('')}
                    className="icon-btn flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-white/75 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Paperclip size={15} strokeWidth={1.8} /> Any file
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="composer-right relative flex items-center gap-1">
          <button
            ref={modelBtnRef}
            type="button"
            onClick={() => setModelOpen((open) => !open)}
            className="composer-model icon-btn flex max-w-[110px] items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] text-white/55 hover:text-white/90"
            title="Change model"
          >
            <span className="truncate">{shortModel}</span>
            <ChevronDown size={12} className="shrink-0" />
          </button>
          {modelOpen && (
            <div ref={modelMenuRef} className="absolute bottom-9 left-0 z-30 w-56 rounded-xl border border-white/10 bg-[#1e1e20] p-1.5 shadow-2xl">
              <p className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white/35">Model</p>
              {MODELS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { onModelChange(item); setModelOpen(false) }}
                  className="icon-btn flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] text-white/70 hover:bg-white/[0.08] hover:text-white"
                >
                  <Check size={13} className={`shrink-0 ${item === model ? 'text-white' : 'opacity-0'}`} />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}
          {showThink && (
            <button
              type="button"
              onClick={onToggleThink}
              className={`composer-think icon-btn flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] ${
                think ? 'bg-white/[0.12] text-white' : 'text-white/50 hover:bg-white/[0.07] hover:text-white/85'
              }`}
              title="Think step by step"
            >
              <Globe2 size={15} strokeWidth={1.8} /> Think
            </button>
          )}
          {showVoice && (
            <button
              type="button"
              onClick={toggleVoice}
              className={`icon-btn grid h-8 w-8 place-items-center rounded-full ${
                listening ? 'bg-red-500/20 text-red-300' : 'text-white/55 hover:bg-white/[0.08] hover:text-white'
              }`}
              title={listening ? 'Stop listening' : 'Voice input'}
              aria-label="Voice input"
            >
              <Mic size={16} strokeWidth={1.8} />
            </button>
          )}
          {streaming ? (
            <button
              type="button"
              onClick={onStop}
              className="grid h-8 w-8 place-items-center rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30"
              aria-label="Stop"
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!value.trim()}
              className="send-btn grid h-8 w-8 place-items-center rounded-full text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
            >
              <ArrowUp size={17} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>
    </form>
  )
}

export default function ChatView({ messages, streaming, onSend, onStop, settings, sidebarCollapsed, onOpenSidebar, onToggleStar, onFeedback, onRegenerate, onDeleteMessage, onModelChange }) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState([])
  const [think, setThink] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [brandMounted, setBrandMounted] = useState(messages.length === 0)
  const [brandActive, setBrandActive] = useState(messages.length === 0)
  const scrollRef = useRef(null)
  const atBottomRef = useRef(true)

  useEffect(() => {
    if (messages.length > 0) {
      setBrandActive(false)
      const timer = setTimeout(() => setBrandMounted(false), 700)
      return () => clearTimeout(timer)
    }
    setBrandMounted(true)
    setBrandActive(true)
  }, [messages.length])

  useEffect(() => {
    if (!atBottomRef.current || !scrollRef.current) return
    const el = scrollRef.current
    el.scrollTo({ top: el.scrollHeight, behavior: streaming ? 'auto' : 'smooth' })
  }, [messages])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    atBottomRef.current = atBottom
    setShowScrollButton(!atBottom)
  }

  const scrollToBottom = () => {
    atBottomRef.current = true
    setShowScrollButton(false)
    const el = scrollRef.current
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  const handleSend = (text, files = []) => {
    atBottomRef.current = true
    setShowScrollButton(false)
    onSend(text, settings?.features?.think !== false && think, files)
  }

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const sync = () => {
      const el = scrollRef.current
      if (el && atBottomRef.current) el.scrollTop = el.scrollHeight
    }
    viewport.addEventListener('resize', sync)
    return () => viewport.removeEventListener('resize', sync)
  }, [])

  const composerProps = {
    value: input,
    onChange: setInput,
    onSend: handleSend,
    onStop,
    streaming,
    think,
    onToggleThink: () => setThink((value) => !value),
    features: settings?.features,
    attachments,
    onAttachmentsChange: setAttachments,
    model: settings.model,
    onModelChange,
  }

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#08080a]">
      {sidebarCollapsed && (
        <button
          type="button"
          onClick={onOpenSidebar}
          className="icon-btn absolute left-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-lg text-white/55 hover:bg-white/[0.07] hover:text-white"
          aria-label="Open menu"
        >
          <Menu size={19} />
        </button>
      )}

      <div className="relative min-h-0 flex-1">
        {brandMounted && (
          <div className={`pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center pt-12 transition-opacity duration-700 ease-out md:hidden ${brandActive ? 'opacity-100' : 'opacity-0'}`}>
            <span className="brand-glow text-[clamp(46px,16vw,76px)] font-semibold tracking-tight">CortexAI</span>
          </div>
        )}
        <div ref={scrollRef} onScroll={handleScroll} className="relative z-10 h-full overflow-y-auto overscroll-contain px-4 sm:px-8">
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center pb-8 pt-16">
              <h1 className="mb-8 hidden text-center text-[25px] font-medium tracking-tight text-white/90 sm:block sm:text-[28px]">
                What’s on your mind today?
              </h1>
              <div className="w-full max-w-[960px] welcome-composer">
                <Composer {...composerProps} />
                {showSuggestions && settings?.features?.suggestions !== false && (
                  <div className="fade-in mt-7 px-1">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[13px] text-white/55">Search the web</span>
                      <button
                        type="button"
                        onClick={() => setShowSuggestions(false)}
                        className="icon-btn grid h-6 w-6 place-items-center rounded-md text-white/35 hover:bg-white/[0.06] hover:text-white"
                        aria-label="Hide suggestions"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {SUGGESTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleSend(item)}
                          className="icon-btn flex items-center gap-3 rounded-lg px-2 py-2 text-left text-[13.5px] text-white/60 hover:bg-white/[0.05] hover:text-white"
                        >
                          <Globe2 size={15} strokeWidth={1.8} className="shrink-0 text-white/35" />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 py-14">
              {messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  streaming={streaming && index === messages.length - 1 && message.role === 'assistant'}
                  onToggleStar={onToggleStar}
                  onFeedback={onFeedback}
                  onRegenerate={onRegenerate}
                  onDeleteMessage={onDeleteMessage}
                />
              ))}
            </div>
          )}
        </div>
        {showScrollButton && messages.length > 0 && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="scroll-bottom-btn glass absolute bottom-3 left-1/2 z-10 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full text-white/60 hover:bg-white/[0.12] hover:text-white"
            aria-label="Scroll to bottom"
          >
            <ArrowDown size={15} />
          </button>
        )}
      </div>

      {messages.length > 0 && (
        <div className="shrink-0 px-4 pb-6 pt-1 sm:px-8 sm:pb-3">
          <div className="mx-auto w-full max-w-[960px]">
            <Composer {...composerProps} />
            <p className="mt-2 hidden text-center text-[11px] text-white/30 sm:block">
              CortexAI by Shivam Kumar · can make mistakes, verify important information.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
