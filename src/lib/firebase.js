import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider, browserLocalPersistence, createUserWithEmailAndPassword, getAuth,
  onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signInWithPopup,
  signOut, updateProfile,
} from 'firebase/auth'
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)

let auth = null
let db = null

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(config)
    auth = getAuth(app)
    db = getFirestore(app)
    setPersistence(auth, browserLocalPersistence).catch(() => {})
  } catch {
    auth = null
    db = null
  }
}

export const onAuthChange = (callback) => {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Firebase keys missing. Add VITE_FIREBASE_* values to .env')
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export const signOutUser = () => (auth ? signOut(auth) : Promise.resolve())

export const signInWithEmail = async (email, password) => {
  if (!auth) throw new Error('Firebase keys missing')
  return signInWithEmailAndPassword(auth, email, password)
}

export const signUpWithEmail = async (name, email, password) => {
  if (!auth) throw new Error('Firebase keys missing')
  const result = await createUserWithEmailAndPassword(auth, email, password)
  if (name?.trim()) await updateProfile(result.user, { displayName: name.trim() })
  return result
}

const cloudDoc = (uid) => doc(db, 'users', uid, 'chat', 'data')

export const loadCloud = async (uid) => {
  if (!db) return null
  const snapshot = await getDoc(cloudDoc(uid))
  return snapshot.exists() ? snapshot.data() : null
}

export const saveCloud = async (uid, conversations, settings) => {
  if (!db) return
  const clean = conversations.map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) => ({
      ...message,
      attachments: message.attachments?.map(({ dataUrl, ...rest }) => rest),
    })),
  }))
  await setDoc(cloudDoc(uid), { conversations: clean, settings, updatedAt: Date.now() }, { merge: true })
}
