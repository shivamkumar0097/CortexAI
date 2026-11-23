# CortexAI

A fast, polished AI chat app with streaming replies, cloud sync, and a mobile-first interface. Built by **Shivam Kumar**.

**Live demo:** [cortexai-three.vercel.app](https://cortexai-three.vercel.app)

CortexAI talks to the Groq API through a small serverless endpoint, renders rich Markdown and LaTeX answers, keeps your history locally, and optionally syncs it to Firestore after Firebase sign-in.

## Features

- **Streaming replies** — answers appear token by token with smooth, chunked rendering
- **AI-generated chat titles** — a short title is generated from your first message
- **Multiple login options** — email/password and Google sign-in via Firebase Auth
- **Cloud sync** — conversations and settings sync to Firestore when signed in
- **Sign-in-aware storage** — chat history is written locally only while signed in; settings, reminders, and bookmarks stay in `localStorage`
- **Rich messages** — Markdown, GitHub-style tables, fenced code blocks, and KaTeX math
- **Attachments** — attach images and text files from the composer
- **Voice input** — browser speech recognition support where available
- **Think mode** — asks the model for deeper, step-by-step reasoning
- **Library** — bookmark any AI reply and reopen it later
- **Images panel** — every image you attach is collected in one place
- **Scheduled panel** — local reminders that fire while the app is open
- **Plugins panel** — toggle individual features on or off
- **Explore panel** — curated starter prompts for learning, building, and planning
- **Model switching** — change the Groq model from the composer
- **Responsive UI** — collapsible sidebar, mobile drawer, touch-friendly controls
- **Installable PWA** — add to home screen and launch standalone without the browser bar

## Tech Stack

| Layer | Technology |
| --- | --- |
| UI | React 19, Vite 8, Tailwind CSS 4 |
| AI | Groq Chat Completions API (streaming) |
| Auth & database | Firebase Authentication, Cloud Firestore |
| Icons | lucide-react |
| Markdown | react-markdown, remark-gfm, remark-math, rehype-katex, KaTeX |
| Server | Vite dev/preview middleware + Vercel serverless function |

## Getting Started

### Prerequisites

- Node.js 20.19+ (or 22.12+)
- A [Groq](https://groq.com) API key
- Firebase project credentials (optional — needed only for sign-in and cloud sync)

### Install and run

```bash
git clone https://github.com/shivamkumar0097/CortexAI.git
cd CortexAI
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `copy .env.example .env` instead of `cp`.

Open `http://localhost:5173`. Add your `GROQ_API_KEY` to `.env` before sending a message.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with the local `/api/chat` middleware |
| `npm run build` | Build the production bundle |
| `npm run preview` | Preview the production build locally |

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you need.

| Variable | Required | Description |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes | Server-side Groq API key used by `/api/chat` |
| `GROQ_MODEL` | No | Model id, defaults to `openai/gpt-oss-120b` |
| `VITE_FIREBASE_API_KEY` | No | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | No | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | No | Firebase project id |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | Firebase messaging sender id |
| `VITE_FIREBASE_APP_ID` | No | Firebase app id |

Without Firebase values, the app still works entirely in local mode — the auth buttons simply show a setup hint.

## How It Works

- `src/components/ChatView.jsx` owns the chat UI, composer, and empty state.
- `src/App.jsx` manages conversations, streaming state, and cloud/local persistence.
- `server/chat.js` validates requests, injects the system prompt, and streams Groq output. `api/chat.js` exposes the same handler as a Vercel function.
- The first message also calls `/api/chat` with `mode: "title"` to generate a short conversation title.
- `src/lib/firebase.js` handles authentication and the Firestore user document.
- `src/lib/storage.js` handles local persistence and shared constants.

### API

`POST /api/chat`

```json
{
  "messages": [{ "role": "user", "content": "Hello" }],
  "model": "openai/gpt-oss-120b",
  "systemPrompt": "Optional custom instructions",
  "think": false
}
```

Response: streamed plain text.

Title generation uses:

```json
{ "mode": "title", "text": "First user message" }
```

Response: `{ "title": "Generated Title" }`.

## Deployment

The project is Vercel-ready. `api/chat.js` is the serverless entry point, so `dist/` is built as a static frontend and `/api/chat` runs on the server.

1. Import the repository into Vercel.
2. Add `GROQ_API_KEY` (and optional `GROQ_MODEL`) as environment variables.
3. Add the `VITE_FIREBASE_*` values if you want authentication and cloud sync.
4. Add your deployment domain to Firebase Authentication's authorized domains.

Never put `GROQ_API_KEY` in a `VITE_` variable — that would expose it in the browser bundle.

## Project Structure

```
.
├── api/
│   └── chat.js                 # Vercel serverless entry point
├── server/
│   └── chat.js                 # Shared chat + title handler
├── src/
│   ├── App.jsx                 # App state, persistence, cloud sync
│   ├── components/
│   │   ├── AuthModal.jsx       # Sign in / sign up
│   │   ├── ChatView.jsx        # Chat UI and composer
│   │   ├── Message.jsx         # Message rendering and actions
│   │   ├── Panels.jsx          # Images, Library, Scheduled, Plugins, Explore
│   │   ├── SettingsModal.jsx   # Model, system prompt, clear data
│   │   ├── Sidebar.jsx         # Navigation and profile menu
│   │   └── Toaster.jsx         # Toast notifications
│   ├── lib/
│   │   ├── firebase.js         # Firebase auth and Firestore
│   │   ├── storage.js          # localStorage helpers
│   │   └── toast.js            # Toast event bus
│   ├── index.css               # Global styles and theme
│   └── main.jsx                # React entry point
├── index.html
├── vite.config.js
└── .env.example
```

## Security Notes

- `.env` is gitignored. Keep API keys out of commits.
- The Groq key is read only on the server.
- Firebase web config values are public by design; secure your project with Firebase rules.
- This project stores chat history in the browser and, when signed in, in your own Firestore account.

## Author

**Shivam Kumar**

- GitHub: [shivamkumar0097](https://github.com/shivamkumar0097)
- LinkedIn: [shivamkumar0097](https://www.linkedin.com/in/shivamkumar0097)
