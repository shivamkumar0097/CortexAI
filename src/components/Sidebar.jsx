import { useState } from 'react'
import {
  CalendarClock, Compass, Images, Library, LogIn, LogOut, PanelLeftClose, Plug,
  Search, Settings2, SquarePen, Trash2, X,
} from 'lucide-react'
const NAV = [
  { label: 'Images', icon: Images },
  { label: 'Scheduled', icon: CalendarClock },
  { label: 'Library', icon: Library },
  { label: 'Plugins', icon: Plug },
  { label: 'Explore', icon: Compass },
]

export default function Sidebar({ conversations, activeId, onSelect, onNew, onRename, onDelete, onSettings, open, onClose, collapsed, onToggleCollapse, user, authLoading, onAuthOpen, onSignOut, isFirebaseConfigured, view, onNavigate }) {
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draftTitle, setDraftTitle] = useState('')
  const filtered = conversations.filter((item) => (item.title || 'New conversation').toLowerCase().includes(query.toLowerCase()))

  const commitRename = () => {
    if (!editingId) return
    const title = draftTitle.trim()
    if (title) onRename(editingId, title)
    setEditingId(null)
  }

  return (
    <>
      {open && <div className="fade-in fixed inset-0 z-30 bg-black/70 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[clamp(280px,22vw,430px)] flex-col border-r border-white/[0.06] bg-[#0d0d0f] transition-transform duration-300 ease-out md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:hidden' : ''}`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <button type="button" onClick={() => { onNavigate('chat'); onClose() }} className="icon-btn flex min-w-0 items-center gap-2 rounded-lg py-1">
            <img src="/favicon.png" alt="" className="h-6 w-6 shrink-0 rounded-md object-cover" />
            <span className="truncate text-[15px] font-semibold tracking-tight text-white/90">CortexAI</span>
          </button>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => { setSearching((value) => !value); setQuery('') }}
              className="icon-btn grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/[0.07] hover:text-white"
              aria-label="Search chats"
            >
              <Search size={17} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="icon-btn hidden h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/[0.07] hover:text-white md:grid"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={17} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="icon-btn grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/[0.07] hover:text-white md:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {searching && (
          <div className="fade-in shrink-0 px-3 pb-2">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-[12.5px] outline-none placeholder:text-white/30 focus:border-white/20"
            />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <button
            type="button"
            onClick={() => { onNew(); onClose() }}
            className="flex w-full items-center gap-2.5 rounded-lg bg-white/[0.07] px-3 py-2.5 text-[13px] text-white/90 transition-colors hover:bg-white/[0.11]"
          >
            <SquarePen size={16} strokeWidth={1.8} /> New chat
          </button>

          <nav className="mt-3 flex flex-col gap-0.5">
            {NAV.map(({ label, icon: Icon }) => {
              const key = label.toLowerCase()
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => { onNavigate(key); onClose() }}
                  className={`icon-btn flex items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] ${
                    view === key ? 'bg-white/[0.09] text-white' : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.8} /> {label}
                </button>
              )
            })}
          </nav>

          <p className="mb-1 mt-6 px-3 text-[12px] font-medium text-white/40">Projects</p>
          <p className="px-3 text-[12.5px] text-white/30">No projects</p>

          <p className="mb-1 mt-6 px-3 text-[12px] font-medium text-white/40">Recents</p>
          <div className="flex flex-col gap-0.5">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-[12.5px] text-white/30">
                {searching && query ? 'No matching chats' : 'No chats yet. Start one above.'}
              </p>
            )}
            {filtered.map((item) => {
              const active = item.id === activeId
              return (
                <div
                  key={item.id}
                  className={`group flex items-center rounded-lg transition-colors ${
                    active ? 'bg-white/[0.09]' : 'hover:bg-white/[0.05]'
                  }`}
                >
                  {editingId === item.id ? (
                    <input
                      autoFocus
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') commitRename()
                        if (event.key === 'Escape') setEditingId(null)
                      }}
                      className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-[13px] text-white outline-none focus:border-cyan-400/50"
                      aria-label="Chat name"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => { onSelect(item.id); onClose() }}
                      className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-[13px] ${
                        active ? 'text-white' : 'text-white/65 group-hover:text-white/90'
                      }`}
                    >
                      {item.title || 'New conversation'}
                    </button>
                  )}
                  {editingId !== item.id && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setEditingId(item.id); setDraftTitle(item.title || '') }}
                        className="shrink-0 rounded p-1 text-white/30 opacity-100 transition-opacity hover:text-white/80 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Rename chat"
                        title="Rename chat"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="mr-2 shrink-0 rounded p-1 text-white/25 opacity-100 transition-opacity hover:text-red-400 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Delete chat"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/[0.06] p-3">
          {authLoading ? (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-white/[0.08]" />
              <span className="flex-1 space-y-1.5">
                <span className="block h-2.5 w-28 animate-pulse rounded bg-white/[0.07]" />
                <span className="block h-2 w-20 animate-pulse rounded bg-white/[0.05]" />
              </span>
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 rounded-lg px-1 py-1">
              <button type="button" onClick={onSettings} className="icon-btn flex min-w-0 flex-1 items-center rounded-lg py-1 text-left" title="Settings">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-[11px] font-semibold text-white">
                    {(user.displayName || user.email || 'U').slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="ml-2.5 block min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-white/85">{user.displayName || 'User'}</span>
                  <span className="block truncate text-[11px] text-white/35">{user.email || 'Signed in'}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmSignOut(true)}
                className="icon-btn grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 hover:bg-white/[0.07] hover:text-white"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} strokeWidth={1.8} />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onAuthOpen}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[13px] font-medium text-white/90 transition-colors hover:bg-white/[0.11]"
              >
                <LogIn size={16} strokeWidth={1.8} /> Sign in / Sign up
              </button>
              <p className="mt-2 text-center text-[11px] text-white/30">
                {isFirebaseConfigured ? 'Sign in to sync history to the cloud' : 'Add Firebase keys to .env to enable sign-in'}
              </p>
              <button
                type="button"
                onClick={onSettings}
                className="icon-btn mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-[11.5px] text-white/35 hover:text-white/80"
              >
                <Settings2 size={13} /> Settings
              </button>
            </>
          )}
          <p className="mt-2 text-center text-[10px] text-white/25">Built by Shivam Kumar</p>
        </div>
      </aside>

      {confirmSignOut && (
        <div className="fade-in fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setConfirmSignOut(false)}>
          <div
            className="modal-in glass w-full max-w-[340px] rounded-2xl p-5"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-[16px] font-semibold text-white/90">Log out?</h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/50">
              Are you sure you want to sign out? Your chat history will stay saved in the cloud.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmSignOut(false)}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-[12.5px] font-medium text-white/75 transition-colors hover:bg-white/[0.11] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setConfirmSignOut(false); onSignOut() }}
                className="rounded-xl bg-red-500/20 px-4 py-2 text-[12.5px] font-medium text-red-300 transition-colors hover:bg-red-500/30"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
