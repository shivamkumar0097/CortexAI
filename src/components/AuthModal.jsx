import { useState } from 'react'
import { X } from 'lucide-react'
import { showToast } from '../lib/toast.js'
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../lib/firebase.js'

const ERRORS = {
  'auth/email-already-in-use': 'Email already registered — please sign in',
  'auth/invalid-email': 'Invalid email address',
  'auth/weak-password': 'Password must be at least 6 characters',
  'auth/invalid-credential': 'Incorrect email or password',
  'auth/user-not-found': 'Incorrect email or password',
  'auth/wrong-password': 'Incorrect email or password',
  'auth/too-many-requests': 'Too many attempts, please try again after some time',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled',
}

const friendly = (error) => ERRORS[error?.code] || error?.message || 'Something went wrong'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const signup = mode === 'signup'

  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      if (signup) await signUpWithEmail(name, email, password)
      else await signInWithEmail(email, password)
      showToast(signup ? 'Account created — your history will be saved to the cloud' : 'Welcome back!', 'success')
      onClose()
    } catch (error) {
      showToast(friendly(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    if (busy) return
    setBusy(true)
    try {
      await signInWithGoogle()
      showToast('Signed in with Google', 'success')
      onClose()
    } catch (error) {
      showToast(friendly(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fade-in fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="modal-in glass w-full max-w-[400px] rounded-2xl p-5"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/CortexAI.png" alt="" className="h-9 w-9 rounded-lg object-cover" />
            <div>
              <h2 className="text-[16px] font-semibold text-white/90">CortexAI</h2>
              <p className="text-[11.5px] text-white/40">{signup ? 'Create Account' : 'Welcome Back'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="icon-btn grid h-7 w-7 place-items-center rounded-lg text-white/40 hover:bg-white/[0.07] hover:text-white" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[13px] font-medium text-white/90 transition-colors hover:bg-white/[0.11] disabled:opacity-50"
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] text-white/30">or continue with email</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-2.5">
          {signup && (
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[12.5px] outline-none placeholder:text-white/30 focus:border-white/25"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[12.5px] outline-none placeholder:text-white/30 focus:border-white/25"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (6+ characters)"
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[12.5px] outline-none placeholder:text-white/30 focus:border-white/25"
          />
          <button
            type="submit"
            disabled={busy}
            className="send-btn mt-1 w-full rounded-xl px-4 py-2.5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Please wait...' : signup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-[12px] text-white/45">
          {signup ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(signup ? 'signin' : 'signup'); setPassword('') }}
            className="font-medium text-white/85 underline underline-offset-2 hover:text-white"
          >
            {signup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
        <p className="mt-2 text-center text-[10px] text-white/25">Built by Shivam Kumar · history syncs to the cloud</p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
