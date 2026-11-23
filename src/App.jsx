import { useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import ChatView from './components/ChatView.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import AuthModal from './components/AuthModal.jsx'
import Toaster from './components/Toaster.jsx'
import {
  ImagesPanel, LibraryPanel, ScheduledPanel, PluginsPanel, ExplorePanel,
} from './components/Panels.jsx'
import { clearConversations, loadConversations, saveConversations, loadSettings, saveSettings, uid } from './lib/storage.js'
import { showToast } from './lib/toast.js'
import {
  isFirebaseConfigured, loadCloud, onAuthChange, saveCloud, signOutUser,
} from './lib/firebase.js'

export default function App() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [settings, setSettings] = useState(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [view, setView] = useState('chat')
  const [streaming, setStreaming] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [cloudLoading, setCloudLoading] = useState(false)
  const [cloudReady, setCloudReady] = useState(false)
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [justOnline, setJustOnline] = useState(false)
  const abortRef = useRef(null)
  const mainRef = useRef(null)
  const onlineTimerRef = useRef(null)

  useEffect(() => {
    if (user && cloudReady) saveConversations(conversations)
  }, [conversations, user, cloudReady])
  useEffect(() => saveSettings(settings), [settings])
  useEffect(() => onAuthChange((next) => { setUser(next); setAuthLoading(false) }), [])

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      setJustOnline(true)
      if (user && cloudReady) saveCloud(user.uid, conversations, settings).catch(() => {})
      clearTimeout(onlineTimerRef.current)
      onlineTimerRef.current = setTimeout(() => setJustOnline(false), 2500)
    }
    const handleOffline = () => {
      setOnline(false)
      setJustOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearTimeout(onlineTimerRef.current)
    }
  }, [user, cloudReady, conversations, settings])

  useEffect(() => {
    if (!authLoading && !user) clearConversations()
  }, [authLoading, user])

  useEffect(() => {
    const isMobile = () => window.matchMedia('(max-width: 767px)').matches
    const inHorizontalScroller = (target) => {
      let node = target instanceof Element ? target : null
      while (node && node !== document.body) {
        const style = window.getComputedStyle(node)
        if (/(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 4) return true
        node = node.parentElement
      }
      return false
    }
    let startX = null
    let startY = 0
    let startTime = 0
    let blocked = false
    const onStart = (event) => {
      if (!isMobile() || event.touches.length !== 1) { startX = null; return }
      const target = event.target
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) { startX = null; return }
      startX = event.touches[0].clientX
      startY = event.touches[0].clientY
      startTime = Date.now()
      blocked = inHorizontalScroller(target)
    }
    const onEnd = (event) => {
      if (startX === null) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      const elapsed = Date.now() - startTime
      startX = null
      if (blocked || elapsed > 700) return
      if (Math.abs(dx) < 55 || Math.abs(dy) > Math.abs(dx) * 0.7) return
      if (dx > 0 && !sidebarOpen) setSidebarOpen(true)
      else if (dx < 0 && sidebarOpen) setSidebarOpen(false)
    }
    const onCancel = () => { startX = null }
    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchend', onEnd, { passive: true })
    document.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onCancel)
    }
  }, [sidebarOpen])

  useEffect(() => {
    if (!user) {
      setCloudReady(false)
      return
    }
    let cancelled = false
    setCloudLoading(true)
    const local = loadConversations()
    const mergeLocalImages = (cloudConversations) => cloudConversations.map((conversation) => {
      const localConversation = local.find((item) => item.id === conversation.id)
      if (!localConversation?.messages?.length) return conversation
      return {
        ...conversation,
        messages: conversation.messages.map((message) => {
          if (message.attachments?.some((item) => item.dataUrl)) return message
          const localMessage = localConversation.messages.find((item) => item.id === message.id)
          const attachments = localMessage?.attachments
          return attachments?.some((item) => item.dataUrl) ? { ...message, attachments } : message
        }),
      }
    })
    loadCloud(user.uid)
      .then(async (data) => {
        if (cancelled) return
        if (data?.conversations?.length) {
          setConversations(mergeLocalImages(data.conversations))
          setActiveId((prev) => (prev && data.conversations.some((item) => item.id === prev)) ? prev : null)
          if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }))
        } else {
          const initial = local.length ? local : conversations
          if (local.length && !conversations.length) setConversations(local)
          await saveCloud(user.uid, initial, settings)
        }
      })
      .catch((error) => {
        if (cancelled) return
        if (!conversations.length && local.length) setConversations(local)
        if (navigator.onLine) showToast(`Could not load cloud history: ${error?.code || error?.message || 'unknown'}`, 'error')
      })
      .finally(() => { if (!cancelled) { setCloudLoading(false); setCloudReady(true) } })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!user || !cloudReady || cloudLoading) return
    const timer = setTimeout(() => {
      saveCloud(user.uid, conversations, settings)
        .catch((error) => { if (navigator.onLine) showToast(`Cloud sync failed: ${error?.code || error?.message || 'unknown'}`, 'error') })
    }, streaming ? 300 : 0)
    return () => clearTimeout(timer)
  }, [conversations, settings, user, cloudLoading, cloudReady, streaming])

  const active = conversations.find((item) => item.id === activeId) || null
  const messages = active?.messages || []

  const patchConversation = (id, updater) => {
    setConversations((prev) => prev.map((item) => (item.id === id ? updater(item) : item)))
  }

  const renameChat = (id, title) => patchConversation(id, (item) => ({ ...item, title }))

  const streamReply = async (id, history, think = false) => {
    const assistantId = uid()
    patchConversation(id, (item) => ({
      ...item,
      messages: [...item.messages, { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() }],
    }))

    const controller = new AbortController()
    abortRef.current = controller
    setStreaming(true)
    let full = ''
    let shown = ''
    let finished = false
    let timer = null
    const paint = (text) => patchConversation(id, (item) => ({
      ...item,
      messages: item.messages.map((message) =>
        message.id === assistantId ? { ...message, content: text } : message,
      ),
    }))
    const reveal = () => {
      if (shown.length < full.length) {
        let end = full.length
        for (let i = shown.length; i < full.length; i += 1) {
          if (full[i] === ' ' || full[i] === '\n') { end = i + 1; break }
        }
        end = Math.min(end, shown.length + 32)
        shown = full.slice(0, end)
        paint(shown)
      } else if (finished) {
        clearInterval(timer)
        setStreaming(false)
      }
    }
    timer = setInterval(reveal, 20)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history,
          model: settings.model,
          systemPrompt: settings.systemPrompt,
          think,
        }),
      })
      if (!response.ok || !response.body) throw new Error(await response.text())
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
      }
      finished = true
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showToast(error?.message || 'Request failed', 'error')
        full = fullText(error)
        shown = full
        paint(full)
      }
      finished = true
    } finally {
      abortRef.current = null
    }
  }

  const generateChatTitle = async (id, text) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'title', text }),
      })
      const data = await response.json()
      const title = String(data.title || '').slice(0, 60)
      if (!title) return
      patchConversation(id, (item) => ({ ...item, title }))
    } catch {
      patchConversation(id, (item) => ({ ...item, title: text.slice(0, 40) }))
    }
  }

  const toApiMessage = (message, images) => {
    if (!images.length) return { role: message.role, content: message.content }
    return {
      role: message.role,
      content: [
        ...(message.content ? [{ type: 'text', text: message.content }] : []),
        ...images.map((image) => ({ type: 'image_url', image_url: { url: image.dataUrl } })),
      ],
    }
  }

  const buildApiHistory = (items) => {
    let budget = 3
    const built = []
    for (let index = items.length - 1; index >= 0; index -= 1) {
      const message = items[index]
      const images = (message.attachments || []).filter((item) => item.kind === 'image' && item.dataUrl)
      const allowed = images.slice(Math.max(0, images.length - budget))
      budget -= allowed.length
      built.push(toApiMessage(message, allowed))
    }
    return built.reverse()
  }

  const send = async (text, think = false, attachments = []) => {
    let id = activeId
    if (!id) {
      id = uid()
      setActiveId(id)
      setConversations((prev) => [{ id, title: 'New chat', messages: [], createdAt: Date.now() }, ...prev])
      if (text) generateChatTitle(id, text)
    }
    const userMessage = { id: uid(), role: 'user', content: text, createdAt: Date.now() }
    if (attachments.length) userMessage.attachments = attachments
    const history = buildApiHistory([...messages, userMessage])
    patchConversation(id, (item) => ({
      ...item,
      title: item.messages.length === 0 ? (text.slice(0, 40) || 'Image') : item.title,
      messages: [...item.messages, userMessage],
    }))
    await streamReply(id, history, think)
  }

  const regenerate = async (messageId) => {
    const conversation = conversations.find((item) => item.id === activeId)
    if (!conversation) return
    const index = conversation.messages.findIndex((message) => message.id === messageId)
    if (index < 0) return
    const kept = conversation.messages.slice(0, index)
    const history = kept.map(({ role, content }) => ({ role, content }))
    setConversations((prev) => prev.map((item) => (item.id === activeId ? { ...item, messages: kept } : item)))
    await streamReply(activeId, history, false)
  }

  const stop = () => abortRef.current?.abort()

  const openSidebar = () => {
    if (sidebarCollapsed) setSidebarCollapsed(false)
    else setSidebarOpen(true)
  }

  const handleSignOut = async () => {
    await signOutUser()
    showToast('Signed out', 'info')
  }

  const newChat = () => {
    setConversations((prev) => prev.filter((item) => item.messages.length > 0))
    setActiveId(null)
    setView('chat')
  }

  const removeChat = (id) => {
    setConversations((prev) => {
      const next = prev.filter((item) => item.id !== id)
      if (id === activeId) setActiveId(null)
      return next
    })
  }

  const openChat = (id) => {
    setActiveId(id)
    setView('chat')
  }

  const toggleStar = (messageId) => {
    if (!activeId) return
    patchConversation(activeId, (item) => ({
      ...item,
      messages: item.messages.map((message) =>
        message.id === messageId ? { ...message, starred: !message.starred } : message,
      ),
    }))
  }

  const setFeedback = (messageId, type) => {
    if (!activeId) return
    patchConversation(activeId, (item) => ({
      ...item,
      messages: item.messages.map((message) =>
        message.id === messageId ? { ...message, feedback: message.feedback === type ? null : type } : message,
      ),
    }))
    showToast('Feedback noted — thanks!', 'success')
  }

  const deleteMessage = (messageId) => {
    if (!activeId) return
    patchConversation(activeId, (item) => ({
      ...item,
      messages: item.messages.filter((message) => message.id !== messageId),
    }))
    showToast('Message deleted', 'info')
  }

  const changeModel = (model) => {
    setSettings((prev) => ({ ...prev, model }))
    showToast(`Model set to ${model}`, 'info')
  }

  const toggleFeature = (key, enabled) => {
    setSettings((prev) => ({ ...prev, features: { ...prev.features, [key]: enabled } }))
    showToast(`${key} ${enabled ? 'enabled' : 'disabled'}`, 'success')
  }

  const sendPrompt = (text) => {
    setView('chat')
    send(text)
  }

  const panelProps = {
    conversations,
    onOpenChat: openChat,
    onBack: () => setView('chat'),
  }

  return (
    <div className="flex h-full w-full bg-[#08080a] text-white/90">
      {(!online || justOnline) && (
        <div
          className={`pointer-events-none fixed left-1/2 top-2 z-[60] -translate-x-1/2 rounded-full px-3 py-1.5 text-[12px] shadow-lg ring-1 backdrop-blur ${
            online
              ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/25'
              : 'bg-amber-500/15 text-amber-200 ring-amber-400/25'
          }`}
        >
          {online ? 'Back online — synced' : 'Offline — changes will sync later'}
        </div>
      )}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={openChat}
        onNew={newChat}
        onDelete={removeChat}
        onRename={renameChat}
        onSettings={() => setSettingsOpen(true)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        user={user}
        authLoading={authLoading}
        onAuthOpen={() => setAuthOpen(true)}
        onSignOut={handleSignOut}
        isFirebaseConfigured={isFirebaseConfigured}
        view={view}
        onNavigate={setView}
      />
      <main ref={mainRef} className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="icon-btn absolute left-3 top-3 z-30 grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/[0.07] md:hidden"
          aria-label="Open menu"
        >
          <Menu size={19} />
        </button>
        {view === 'chat' && (
          <ChatView
            messages={messages}
            streaming={streaming}
            onSend={send}
            onStop={stop}
            settings={settings}
            sidebarCollapsed={sidebarCollapsed}
            onOpenSidebar={openSidebar}
            onToggleStar={toggleStar}
            onFeedback={setFeedback}
            onRegenerate={regenerate}
            onDeleteMessage={deleteMessage}
            onModelChange={changeModel}
          />
        )}
        {view === 'images' && <ImagesPanel {...panelProps} />}
        {view === 'library' && <LibraryPanel {...panelProps} />}
        {view === 'scheduled' && <ScheduledPanel onBack={() => setView('chat')} />}
        {view === 'plugins' && <PluginsPanel settings={settings} onToggleFeature={toggleFeature} onBack={() => setView('chat')} />}
        {view === 'explore' && <ExplorePanel onPrompt={sendPrompt} onBack={() => setView('chat')} />}
      </main>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={(value) => { setSettings((prev) => ({ ...prev, ...value })); setSettingsOpen(false) }}
          onClear={() => { setConversations([]); setActiveId(null); setSettingsOpen(false) }}
        />
      )}
      <Toaster />
    </div>
  )
}

const fullText = (error) => `Sorry, something went wrong.\n\n\`\`\`\n${error?.message || error}\n\`\`\``
