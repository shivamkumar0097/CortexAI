import { useState } from 'react'
import { X } from 'lucide-react'
import { MODELS } from '../lib/storage.js'
import { showToast } from '../lib/toast.js'

export default function SettingsModal({ settings, onSave, onClose, onClear }) {
  return (
    <div className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="modal-in glass w-full max-w-lg rounded-2xl p-5"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Settings</h2>
          <button type="button" onClick={onClose} className="text-white/40 transition-colors hover:text-white" aria-label="Close">
            <X size={17} />
          </button>
        </div>
        <SettingsForm settings={settings} onSave={onSave} onClear={onClear} />
      </div>
    </div>
  )
}

function SettingsForm({ settings, onSave, onClear }) {
  const [model, setModel] = useState(settings.model)
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt)

  const save = () => {
    onSave({ model, systemPrompt })
    if (model !== settings.model) showToast(`Model changed to ${model}`, 'info')
    showToast('Settings saved', 'success')
  }

  const clear = () => {
    onClear()
    showToast('All chats cleared', 'info')
  }

  return (
    <>
      <label className="mb-1 block text-[11px] font-medium text-white/45">Model</label>
      <select
        value={model}
        onChange={(event) => setModel(event.target.value)}
        className="mb-4 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[12.5px] outline-none transition-colors focus:border-cyan-400/40"
      >
        {MODELS.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <label className="mb-1 block text-[11px] font-medium text-white/45">System prompt</label>
      <textarea
        value={systemPrompt}
        onChange={(event) => setSystemPrompt(event.target.value)}
        rows={6}
        className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[12.5px] leading-relaxed outline-none transition-colors focus:border-cyan-400/40"
      />
      <div className="mt-5 flex items-center justify-between gap-2">
        <button type="button" onClick={clear} className="rounded-lg px-2.5 py-2 text-[12px] text-red-400 transition-colors hover:bg-red-500/10">
          Clear all chats
        </button>
        <button
          type="button"
          onClick={save}
          className="glow rounded-lg px-4 py-2 text-[12px] font-medium text-white transition-transform hover:scale-[1.03] active:scale-95"
        >
          Save
        </button>
      </div>
    </>
  )
}
