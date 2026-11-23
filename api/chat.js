import { handleChat } from '../server/chat.js'

export default async function handler(req, res) {
  return handleChat(req, res)
}
