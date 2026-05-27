import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  messages as seedMessages,
  chatThread as seedThread,
  clientMessages as seedClientMessages,
  clientChatThread as seedClientThread,
} from '@/data/mockData'
import { chatWithGroq, getGroqApiKey, setGroqApiKey, hasGroqApiKey } from '@/lib/groq'
import { useAuth } from './AuthContext'

const STORAGE_PREFIX = 'talentstage-messages'

function storageKey(role) {
  return `${STORAGE_PREFIX}-${role || 'freelancer'}`
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function buildInitial(role) {
  const isClient = role === 'client'
  const seeds = isClient ? seedClientMessages : seedMessages
  const defaultThread = isClient ? seedClientThread : seedThread

  const threads = {}
  seeds.forEach((m) => {
    threads[m.id] = {
      meta: { ...m, unread: m.unread || 0 },
      messages:
        m.id === seeds[0].id
          ? defaultThread.map((msg) => ({ ...msg, id: msg.id || String(Date.now() + Math.random()) }))
          : [
              {
                id: 'welcome',
                sender: m.user,
                text: isClient
                  ? `Hi! I'm ${m.user}. Thanks for considering my proposal — ask me anything about timeline, deliverables, or rates.`
                  : `Hi! I'm ${m.user}. Ask me anything about projects, rates, or timelines.`,
                self: false,
                time: m.time,
              },
            ],
    }
  })
  return threads
}

function loadThreads(role) {
  try {
    const saved = localStorage.getItem(storageKey(role))
    if (saved) return JSON.parse(saved)
  } catch {
    /* ignore */
  }
  return buildInitial(role)
}

function saveThreads(threads, role) {
  try {
    localStorage.setItem(storageKey(role), JSON.stringify(threads))
  } catch (e) {
    console.error('Failed to save messages', e)
  }
}

const MessagesContext = createContext(null)

export function MessagesProvider({ children }) {
  const { user, isClient } = useAuth()
  const role = user?.role || 'freelancer'
  const viewerRole = isClient ? 'client' : 'freelancer'

  const [threads, setThreads] = useState(() => loadThreads(role))
  const [activeId, setActiveId] = useState(() => Object.keys(loadThreads(role))[0])
  const [isReplying, setIsReplying] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [apiKeyConfigured, setApiKeyConfigured] = useState(hasGroqApiKey)

  useEffect(() => {
    const loaded = loadThreads(role)
    setThreads(loaded)
    setActiveId(Object.keys(loaded)[0] || null)
    setChatError(null)
  }, [role])

  const active = activeId ? threads[activeId] : null

  const refreshApiKeyStatus = useCallback(() => {
    setApiKeyConfigured(hasGroqApiKey())
  }, [])

  const saveApiKey = useCallback((key) => {
    setGroqApiKey(key)
    setApiKeyConfigured(hasGroqApiKey())
    setChatError(null)
  }, [])

  const setActive = useCallback(
    (id) => {
      setActiveId(id)
      setChatError(null)
      setThreads((prev) => {
        if (!prev[id]) return prev
        const next = {
          ...prev,
          [id]: { ...prev[id], meta: { ...prev[id].meta, unread: 0 } },
        }
        saveThreads(next, role)
        return next
      })
    },
    [role]
  )

  const ensureThread = useCallback(
    (freelancerName, projectTitle) => {
      const existing = Object.entries(threads).find(([, t]) => t.meta.user === freelancerName)
      if (existing) {
        setActive(existing[0])
        return existing[0]
      }

      const id = `thread-${Date.now()}`
      const newThread = {
        meta: {
          id,
          user: freelancerName,
          status: 'online',
          last: 'New conversation',
          time: 'now',
          unread: 0,
          project: projectTitle,
        },
        messages: [
          {
            id: 'welcome-new',
            sender: freelancerName,
            text: `Hi! I'm ${freelancerName}. ${projectTitle ? `Regarding "${projectTitle}" — ` : ''}how can I help?`,
            self: false,
            time: nowTime(),
          },
        ],
      }

      setThreads((prev) => {
        const next = { ...prev, [id]: newThread }
        saveThreads(next, role)
        return next
      })
      setActiveId(id)
      return id
    },
    [threads, role, setActive]
  )

  const appendToThread = useCallback(
    (threadId, message, metaUpdate) => {
      setThreads((prev) => {
        const conv = prev[threadId]
        if (!conv) return prev
        const next = {
          ...prev,
          [threadId]: {
            ...conv,
            meta: { ...conv.meta, ...metaUpdate },
            messages: [...conv.messages, message],
          },
        }
        saveThreads(next, role)
        return next
      })
    },
    [role]
  )

  const replaceTypingMessage = useCallback(
    (threadId, replacement) => {
      setThreads((prev) => {
        const conv = prev[threadId]
        if (!conv) return prev
        const messages = conv.messages.filter((m) => !m.isTyping)
        const next = {
          ...prev,
          [threadId]: {
            ...conv,
            meta: { ...conv.meta, last: replacement.text, time: 'now' },
            messages: [...messages, replacement],
          },
        }
        saveThreads(next, role)
        return next
      })
    },
    [role]
  )

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim()
      if (!trimmed || !activeId) return

      const apiKey = getGroqApiKey()
      if (!apiKey) {
        setChatError('Add your Groq API key in chat settings to enable AI replies.')
        return
      }

      setChatError(null)
      const threadId = activeId

      const userMsg = {
        id: `msg-${Date.now()}`,
        sender: 'You',
        text: trimmed,
        self: true,
        time: nowTime(),
      }

      let messagesForApi = []
      let contactName = isClient ? 'Freelancer' : 'Client'

      setThreads((prev) => {
        const conv = prev[threadId]
        if (!conv) return prev
        contactName = conv.meta.user
        messagesForApi = [...conv.messages, userMsg]
        const next = {
          ...prev,
          [threadId]: {
            ...conv,
            meta: { ...conv.meta, last: trimmed, time: 'now' },
            messages: messagesForApi,
          },
        }
        saveThreads(next, role)
        return next
      })

      const typingMsg = {
        id: `typing-${Date.now()}`,
        sender: contactName,
        text: '...',
        self: false,
        time: nowTime(),
        isTyping: true,
      }

      appendToThread(threadId, typingMsg, { last: 'Typing...' })
      setIsReplying(true)

      try {
        const replyText = await chatWithGroq({
          apiKey,
          messages: messagesForApi,
          contactName,
          viewerRole,
        })

        replaceTypingMessage(threadId, {
          id: `msg-${Date.now()}`,
          sender: contactName,
          text: replyText,
          self: false,
          time: nowTime(),
        })
      } catch (err) {
        replaceTypingMessage(threadId, {
          id: `msg-${Date.now()}`,
          sender: 'System',
          text: err.message || 'Failed to get AI reply.',
          self: false,
          time: nowTime(),
          isError: true,
        })
        setChatError(err.message)
      } finally {
        setIsReplying(false)
      }
    },
    [activeId, role, isClient, viewerRole, appendToThread, replaceTypingMessage]
  )

  const conversationList = Object.values(threads).map((t) => t.meta)
  const totalUnread = conversationList.reduce((sum, m) => sum + (m.unread || 0), 0)

  return (
    <MessagesContext.Provider
      value={{
        threads,
        conversationList,
        activeId,
        active,
        setActive,
        sendMessage,
        ensureThread,
        isReplying,
        chatError,
        apiKeyConfigured,
        saveApiKey,
        refreshApiKeyStatus,
        getGroqApiKey,
        isClient,
        viewerRole,
        totalUnread,
      }}
    >
      {children}
    </MessagesContext.Provider>
  )
}

export function useMessages() {
  const ctx = useContext(MessagesContext)
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider')
  return ctx
}
