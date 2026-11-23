import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import {
  Bookmark, Check, Copy, FileText, MoreHorizontal, RotateCw,
  Share2, ThumbsDown, ThumbsUp, Trash2, Volume2,
} from 'lucide-react'
import { showToast } from '../lib/toast.js'

const ICON_BTN = 'icon-btn grid h-7 w-7 place-items-center rounded-lg text-white/35 hover:bg-white/[0.07] hover:text-white/90'

export default function Message({ message, streaming, onToggleStar, onFeedback, onRegenerate, onDeleteMessage }) {
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreBtnRef = useRef(null)
  const moreMenuRef = useRef(null)
  const isUser = message.role === 'user'

  useEffect(() => {
    if (!moreOpen) return
    const close = (event) => {
      if (!moreMenuRef.current?.contains(event.target) && !moreBtnRef.current?.contains(event.target)) setMoreOpen(false)
    }
    const escape = (event) => { if (event.key === 'Escape') setMoreOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [moreOpen])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      showToast('Copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast('Copy failed', 'error')
    }
  }

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CortexAI reply', text: message.content })
      } else {
        await navigator.clipboard.writeText(message.content)
        showToast('Reply copied for sharing', 'success')
      }
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('Share failed', 'error')
    }
  }

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Read aloud is not supported in this browser', 'error')
      return
    }
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(message.content.replace(/[#*`$]/g, '').slice(0, 2000))
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  if (isUser) {
    return (
      <div className="message-in flex justify-end">
        <div className="max-w-[min(760px,85%)] rounded-3xl bg-[#1e3a6b] px-4 py-2.5 text-[15px] leading-relaxed text-white/95 ring-1 ring-white/[0.05] shadow-[0_6px_20px_-12px_rgba(30,58,107,0.95)]">
          {message.attachments?.length > 0 && (
            <div className="mb-2 flex flex-wrap justify-end gap-2">
              {message.attachments.map((attachment, index) =>
                attachment.kind === 'image' ? (
                  <img key={index} src={attachment.dataUrl} alt={attachment.name} className="max-h-48 rounded-xl object-cover" />
                ) : (
                  <a
                    key={index}
                    href={attachment.dataUrl}
                    download={attachment.name}
                    className="flex max-w-52 items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11.5px] text-white/70 hover:text-white"
                    title={`Download ${attachment.name}`}
                  >
                    <FileText size={13} className="shrink-0" />
                    <span className="truncate">{attachment.name}</span>
                  </a>
                ),
              )}
            </div>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="message-in flex">
      <div className="group min-w-0 flex-1">
        {message.content ? (
          <div className="prose-ai text-[15px] leading-[1.75] text-white/85">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {message.content}
            </ReactMarkdown>
            {streaming && <span className="stream-cursor ml-0.5 inline-block h-4 w-0.5 bg-white/70 align-middle" />}
          </div>
        ) : (
          <span className="thinking-text inline-block py-1 text-[13px] tracking-wide text-white/50">
            CortexAI is thinking...
          </span>
        )}

        {message.content && !streaming && (
          <div className="relative mt-2 flex items-center gap-0.5">
            <button type="button" onClick={copy} className={ICON_BTN} title="Copy" aria-label="Copy">
              {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
            </button>
            <button
              type="button"
              onClick={() => onFeedback?.(message.id, 'up')}
              className={`${ICON_BTN} ${message.feedback === 'up' ? 'text-emerald-300' : ''}`}
              title="Good response"
              aria-label="Good response"
            >
              <ThumbsUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => onFeedback?.(message.id, 'down')}
              className={`${ICON_BTN} ${message.feedback === 'down' ? 'text-red-300' : ''}`}
              title="Bad response"
              aria-label="Bad response"
            >
              <ThumbsDown size={14} />
            </button>
            <button type="button" onClick={share} className={ICON_BTN} title="Share" aria-label="Share">
              <Share2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onRegenerate?.(message.id)}
              className={ICON_BTN}
              title="Regenerate"
              aria-label="Regenerate"
            >
              <RotateCw size={14} />
            </button>
            <button
              type="button"
              onClick={toggleSpeak}
              className={`${ICON_BTN} ${speaking ? 'text-cyan-300' : ''}`}
              title={speaking ? 'Stop reading' : 'Read aloud'}
              aria-label="Read aloud"
            >
              <Volume2 size={14} />
            </button>
            <button
              ref={moreBtnRef}
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              className={ICON_BTN}
              title="More"
              aria-label="More"
            >
              <MoreHorizontal size={15} />
            </button>
            {moreOpen && (
              <div ref={moreMenuRef} className="absolute left-0 top-8 z-30 w-52 rounded-xl border border-white/10 bg-[#1e1e20] p-1.5 shadow-2xl">
                <button
                  type="button"
                  onClick={() => { onToggleStar?.(message.id); setMoreOpen(false) }}
                  className="icon-btn flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-white/70 hover:bg-white/[0.08] hover:text-white"
                >
                  <Bookmark size={14} fill={message.starred ? 'currentColor' : 'none'} />
                  {message.starred ? 'Remove from library' : 'Save to library'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(message.content)
                      showToast('Markdown copied', 'success')
                    } catch {
                      showToast('Copy failed', 'error')
                    }
                    setMoreOpen(false)
                  }}
                  className="icon-btn flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-white/70 hover:bg-white/[0.08] hover:text-white"
                >
                  <Copy size={14} /> Copy as markdown
                </button>
                <button
                  type="button"
                  onClick={() => { onDeleteMessage?.(message.id); setMoreOpen(false) }}
                  className="icon-btn flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-red-300/80 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 size={14} /> Delete message
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
