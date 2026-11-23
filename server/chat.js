import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const loadLocalEnv = () => {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    raw.split('\n').forEach((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
      }
    })
  } catch {}
}

const readBody = async (req) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

export async function handleChat(req, res) {
  loadLocalEnv()
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end('Method not allowed')
    return
  }
  const key = process.env.GROQ_API_KEY
  if (!key || key === 'your_groq_api_key_here') {
    res.statusCode = 503
    res.end('Add GROQ_API_KEY to .env (or Vercel environment variables)')
    return
  }

  let payload
  try {
    payload = JSON.parse(await readBody(req) || '{}')
  } catch {
    res.statusCode = 400
    res.end('Invalid payload')
    return
  }

  if (payload.mode === 'title') {
    res.setHeader('Content-Type', 'application/json')
    try {
      const upstream = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: 'Write a short, descriptive title for this chat in 2 to 6 words. Reply with only the title, no quotes, no punctuation at the end.' },
            { role: 'user', content: String(payload.text || '').slice(0, 2000) },
          ],
          temperature: 0.2,
          max_tokens: 24,
          stream: false,
        }),
      })
      const data = await upstream.json()
      const title = String(data?.choices?.[0]?.message?.content || '')
        .replace(/^["'\s]+|["'\s]+$/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 60)
      res.statusCode = 200
      res.end(JSON.stringify({ title }))
    } catch {
      res.statusCode = 200
      res.end(JSON.stringify({ title: '' }))
    }
    return
  }

  const messages = Array.isArray(payload.messages)
    ? payload.messages
        .filter((item) => item && (item.role === 'user' || item.role === 'assistant' || item.role === 'system'))
        .slice(-30)
        .map((item) => ({ role: item.role, content: String(item.content || '').slice(0, 8000) }))
    : []
  if (!messages.length) {
    res.statusCode = 400
    res.end('No message')
    return
  }

  const think = payload.think === true
  const CREDIT = [
    'IMPORTANT IDENTITY: You are CortexAI, built by Shivam Kumar, a developer who builds polished real-world web products.',
    'When anyone asks who made you, who built you, who created you, or about your developer, answer clearly and proudly: "I was built by Shivam Kumar" and give him credit. Do not claim any other creator.',
    'Shivam Kumar contact details: GitHub username shivamkumar0097 and LinkedIn username shivamkumar0097. Share these directly whenever someone asks how to contact him, follow him, or connect with him.',
    'Instagram: he does not have an Instagram account. If asked about his Instagram, say plainly that he is not on Instagram instead of refusing to answer.',
    'Never reply "I can\'t help with that" to questions about Shivam, his contact details, or his social profiles — these are public details you are allowed to share.',
    'Give a specific answer to each different question instead of one generic response. Do not sound like a robot; be warm, natural, clear and conversational.',
  ].join(' ')
  const system = `${CREDIT}${think ? '\nThink carefully and explain step by step when useful.' : ''}\n\n${String(payload.systemPrompt || '').slice(0, 4000) ||
    'You are CortexAI, a helpful, friendly and concise AI assistant. Format answers cleanly with short paragraphs and bullets. Use markdown and LaTeX math when useful.'}`

  try {
    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages: [{ role: 'system', content: system }, ...messages],
        temperature: think ? 0.3 : 0.6,
        max_tokens: think ? 4096 : 2048,
        stream: true,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '')
      res.statusCode = 502
      res.end(detail.slice(0, 500) || 'AI request failed')
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('X-Accel-Buffering', 'no')

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const text = parsed?.choices?.[0]?.delta?.content
          if (text) res.write(text)
        } catch {}
      }
    }
    res.end()
  } catch (error) {
    if (!res.headersSent) {
      res.statusCode = 502
      res.end('AI request failed')
    } else {
      res.end()
    }
  }
}
