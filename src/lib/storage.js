const CONV_KEY = 'cortexai:conversations'
const SETTINGS_KEY = 'cortexai:settings'
const SCHEDULE_KEY = 'cortexai:scheduled'
const ACTIVE_KEY = 'cortexai:active'
const VIEW_KEY = 'cortexai:view'

const DEFAULT_SETTINGS = {
  model: 'openai/gpt-oss-120b',
  features: { think: true, voice: true, files: true, suggestions: true },
  systemPrompt:
    'You are CortexAI, a helpful, friendly and concise AI assistant built by Shivam Kumar. Answer in simple Hinglish or English depending on the user. Use markdown, bullet lists and LaTeX math when useful. Never refuse a normal question. When anyone asks who built you, who made you, who created you or about your developer, say clearly and proudly: "I was built by Shivam Kumar" and mention that he is a developer who builds polished real-world web products. Shivam\'s GitHub and LinkedIn username is shivamkumar0097. He does not have an Instagram account — say so plainly if asked. When asked how to contact him, give his GitHub and LinkedIn handles directly, never say "I can\'t help with that". Give a specific natural answer to each question, not one generic bot-like response.',
}

export const MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'allam-2-7b',
]

export const loadConversations = () => {
  try {
    const value = JSON.parse(localStorage.getItem(CONV_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export const saveConversations = (value) => {
  try {
    localStorage.setItem(CONV_KEY, JSON.stringify(value))
  } catch {}
}

export const loadSettings = () => {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const saveSettings = (value) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(value))
  } catch {}
}

export const loadScheduled = () => {
  try {
    const value = JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export const saveScheduled = (value) => {
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(value))
  } catch {}
}

export const loadActiveId = () => {
  try {
    return localStorage.getItem(ACTIVE_KEY) || null
  } catch {
    return null
  }
}

export const saveActiveId = (value) => {
  try {
    if (value) localStorage.setItem(ACTIVE_KEY, value)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch {}
}

export const loadView = () => {
  try {
    const value = localStorage.getItem(VIEW_KEY)
    return ['chat', 'images', 'library', 'scheduled', 'plugins', 'explore'].includes(value) ? value : 'chat'
  } catch {
    return 'chat'
  }
}

export const saveView = (value) => {
  try {
    localStorage.setItem(VIEW_KEY, value)
  } catch {}
}

export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
