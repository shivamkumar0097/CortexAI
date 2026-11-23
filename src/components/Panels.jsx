import { useEffect, useState } from 'react'
import { ArrowLeft, Bookmark, Clock, Compass, Images, Plug, Plus, Trash2 } from 'lucide-react'
import { showToast } from '../lib/toast.js'
import { loadScheduled, saveScheduled, uid } from '../lib/storage.js'

function Shell({ title, subtitle, onBack, children }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <button
          type="button"
          onClick={onBack}
          className="icon-btn mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] text-white/50 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft size={15} /> Back to chat
        </button>
        <h1 className="text-[24px] font-semibold tracking-tight text-white/90">{title}</h1>
        <p className="mt-1 text-[13px] text-white/40">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  )
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="glass flex flex-col items-center rounded-2xl px-4 py-12 text-center">
      <Icon size={24} strokeWidth={1.5} className="mb-3 text-white/30" />
      <p className="max-w-sm text-[13px] text-white/40">{text}</p>
    </div>
  )
}

export function ImagesPanel({ conversations, onOpenChat, onBack }) {
  const items = conversations.flatMap((conversation) =>
    conversation.messages
      .filter((message) => message.attachments?.some((attachment) => attachment.kind !== 'file'))
      .map((message) => ({ id: message.id, convId: conversation.id, title: conversation.title || 'New conversation', attachments: message.attachments.filter((attachment) => attachment.kind !== 'file') })),
  )

  return (
    <Shell title="Images" subtitle="Images you attach in chat show up here." onBack={onBack}>
      {items.length === 0 ? (
        <Empty icon={Images} text="No images yet. Attach an image with the + button in chat and it will show up here." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.flatMap((item) => item.attachments.map((attachment, index) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              onClick={() => onOpenChat(item.convId)}
              className="group overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] text-left transition-colors hover:border-white/20"
            >
              <img src={attachment.dataUrl} alt={attachment.name} className="h-40 w-full object-cover" />
              <p className="truncate px-2.5 py-2 text-[11.5px] text-white/45 group-hover:text-white/75">{attachment.name || item.title}</p>
            </button>
          )))}
        </div>
      )}
    </Shell>
  )
}

export function LibraryPanel({ conversations, onOpenChat, onBack }) {
  const items = conversations.flatMap((conversation) =>
    conversation.messages
      .filter((message) => message.role === 'assistant' && message.starred)
      .map((message) => ({ id: message.id, convId: conversation.id, title: conversation.title || 'New conversation', content: message.content })),
  )

  return (
    <Shell title="Library" subtitle="Bookmarked AI replies — saved here permanently." onBack={onBack}>
      {items.length === 0 ? (
        <Empty icon={Bookmark} text="No saved replies yet. Tap the bookmark button under an AI reply and it will appear here." />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="glass flex items-start gap-3 rounded-xl px-4 py-3">
              <Bookmark size={14} className="mt-0.5 shrink-0 fill-amber-300 text-amber-300" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-white/70">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-[12.5px] text-white/45">{item.content.replace(/[#*`]/g, '').slice(0, 220)}</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChat(item.convId)}
                className="icon-btn shrink-0 rounded-lg px-2 py-1 text-[11.5px] text-white/45 hover:bg-white/[0.07] hover:text-white"
              >
                Open
              </button>
            </div>
          ))}
        </div>
      )}
    </Shell>
  )
}

export function ScheduledPanel({ onBack }) {
  const [items, setItems] = useState(loadScheduled)
  const [text, setText] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => saveScheduled(items), [items])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      const due = items.filter((item) => !item.done && item.time <= now)
      if (!due.length) return
      due.forEach((item) => showToast(`Reminder: ${item.text}`, 'info'))
      setItems((prev) => prev.map((item) => due.some((entry) => entry.id === item.id) ? { ...item, done: true } : item))
    }, 5000)
    return () => clearInterval(timer)
  }, [items])

  const add = (event) => {
    event.preventDefault()
    if (!text.trim() || !time) return
    setItems((prev) => [{ id: uid(), text: text.trim(), time: new Date(time).getTime(), done: false }, ...prev])
    setText('')
    setTime('')
    showToast('Reminder set', 'success')
  }

  return (
    <Shell title="Scheduled" subtitle="Local reminders — you will get a notification at the set time while the app is open." onBack={onBack}>
      <form onSubmit={add} className="glass flex flex-col gap-2 rounded-2xl p-4 sm:flex-row">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Reminder text..."
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[12.5px] outline-none placeholder:text-white/30 focus:border-white/25"
        />
        <input
          type="datetime-local"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[12.5px] outline-none focus:border-white/25"
        />
        <button type="submit" disabled={!text.trim() || !time} className="send-btn flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[12.5px] font-medium text-white disabled:opacity-40">
          <Plus size={15} /> Add
        </button>
      </form>
      <div className="mt-5 flex flex-col gap-2">
        {items.length === 0 && <Empty icon={Clock} text="No reminders yet. Add one above." />}
        {items.map((item) => (
          <div key={item.id} className="glass flex items-center gap-3 rounded-xl px-4 py-3">
            <Clock size={14} className={item.done ? 'text-white/25' : 'text-cyan-300/80'} />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[12.5px] ${item.done ? 'text-white/35 line-through' : 'text-white/80'}`}>{item.text}</p>
              <p className="text-[11px] text-white/35">{new Date(item.time).toLocaleString()}</p>
            </div>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}
              className="icon-btn grid h-7 w-7 place-items-center rounded-lg text-white/35 hover:bg-white/[0.07] hover:text-red-400"
              aria-label="Delete reminder"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </Shell>
  )
}

export function PluginsPanel({ settings, onToggleFeature, onBack }) {
  const list = [
    { key: 'think', label: 'Think mode', desc: 'Deep, step-by-step answers (adjusts temperature and tokens)' },
    { key: 'voice', label: 'Voice input', desc: 'Shows a mic button in the composer' },
    { key: 'files', label: 'File attachments', desc: '+ button to attach text files and images' },
    { key: 'suggestions', label: 'Web search suggestions', desc: 'Starter prompts on the welcome screen' },
  ]

  return (
    <Shell title="Plugins" subtitle="Built-in features — toggle them here, changes apply instantly." onBack={onBack}>
      <div className="flex flex-col gap-2">
        {list.map((item) => {
          const enabled = settings.features?.[item.key] !== false
          return (
            <div key={item.key} className="glass flex items-center gap-4 rounded-xl px-4 py-3.5">
              <Plug size={16} className="shrink-0 text-white/40" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white/85">{item.label}</p>
                <p className="mt-0.5 text-[11.5px] text-white/40">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => onToggleFeature(item.key, !enabled)}
                className={`relative h-6 w-11 shrink-0 rounded-full p-0 transition-colors ${enabled ? 'bg-cyan-500' : 'bg-white/15'}`}
                aria-label={`Toggle ${item.label}`}
              >
                <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

const EXPLORE = [
  { group: 'Learn', prompts: ['Explain quantum computing like I am 10', 'Trigonometry formulas with examples', 'Teach me SQL joins simply', 'What is compound interest?'] },
  { group: 'Build', prompts: ['Write a Python quicksort with comments', 'Create a React todo app structure', 'Design a REST API for a library', 'Give me a Git cheat sheet'] },
  { group: 'Plan', prompts: ['Plan a 3-day Goa trip', 'Make a 7-day gym routine', 'Draft a portfolio website outline', 'Create a study timetable'] },
]

export function ExplorePanel({ onPrompt, onBack }) {
  return (
    <Shell title="Explore" subtitle="Click any card to open it directly in chat." onBack={onBack}>
      <div className="flex flex-col gap-7">
        {EXPLORE.map((section) => (
          <div key={section.group}>
            <h2 className="mb-3 flex items-center gap-2 text-[13px] font-medium text-white/60"><Compass size={14} /> {section.group}</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {section.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onPrompt(prompt)}
                  className="starter-card glass rounded-xl px-4 py-3 text-left text-[12.5px] text-white/65 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  )
}
