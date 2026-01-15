import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import ControlTab from './components/ControlTab'
import SettingsTab from './components/SettingsTab'
import HistoryTab from './components/HistoryTab'
import MoreToolsTab from './components/MoreToolsTab'

// Icons
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="10 8 16 12 10 16 10 8"/>
  </svg>
)

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const ToolsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
)

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

const TABS = [
  { id: 'control', label: 'Control', icon: PlayIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'history', label: 'History', icon: HistoryIcon },
  { id: 'tools', label: 'More Tools', icon: ToolsIcon },
]

// Google Flow URLs
const FLOW_URLS = [
  'labs.google/fx',
  'labs.google/flow',
  'aitestkitchen.withgoogle.com'
]

// Default settings
const DEFAULT_SETTINGS = {
  videosPerTask: '1',
  model: 'veo-3.1-fast',
  ratio: 'landscape',
  startFrom: 1,
  waitTimeMin: 30,
  waitTimeMax: 60,
  language: 'en',
  autoDownload: true,
  downloadFolder: 'VeoFlow-Videos'
}

function App() {
  const [activeTab, setActiveTab] = useState('control')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [queue, setQueue] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState([])
  const [failedTasks, setFailedTasks] = useState([])
  const [progress, setProgress] = useState({ current: 0, total: 0, status: 'Ready' })
  const [isOnFlowPage, setIsOnFlowPage] = useState(false)
  const [currentTabUrl, setCurrentTabUrl] = useState('')

  // Check if current tab is on Google Flow
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          const url = tabs[0].url
          setCurrentTabUrl(url)
          const onFlow = FLOW_URLS.some(flowUrl => url.includes(flowUrl))
          setIsOnFlowPage(onFlow)
        }
      })
    }
  }, [])

  // Load settings from storage on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['settings', 'queue', 'logs', 'failedTasks', 'isRunning'], (result) => {
        if (result.settings) setSettings(result.settings)
        if (result.queue) setQueue(result.queue)
        if (result.logs) setLogs(result.logs)
        if (result.failedTasks) setFailedTasks(result.failedTasks)
        if (result.isRunning) setIsRunning(result.isRunning)
      })
    }
  }, [])

  // Save settings to storage
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ settings })
    }
  }, [settings])

  // Listen for messages from background script
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const handleMessage = (message) => {
        if (message.type === 'PROGRESS_UPDATE') {
          setProgress(message.data)
        } else if (message.type === 'LOG') {
          setLogs(prev => [...prev, message.data])
        } else if (message.type === 'QUEUE_UPDATE') {
          setQueue(message.data)
        } else if (message.type === 'STATUS_UPDATE') {
          setIsRunning(message.data.isRunning)
        } else if (message.type === 'TASK_FAILED') {
          setFailedTasks(prev => [...prev, message.data])
        } else if (message.type === 'TAB_CHANGED') {
          setIsOnFlowPage(message.data.isOnFlow)
        }
      }

      chrome.runtime.onMessage.addListener(handleMessage)
      return () => chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  const updateSettings = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Flag to prevent double-add
  const addingRef = useRef(false)

  const addToQueue = (items) => {
    // Prevent double-add (e.g., from double-click or React re-render)
    if (addingRef.current) {
      console.log('VeoFlow: Ignoring duplicate addToQueue call')
      return
    }
    addingRef.current = true

    const timestamp = Date.now()
    const newItems = items.map((item, idx) => ({
      id: timestamp + idx,
      ...item,
      status: 'pending'
    }))

    setQueue(prev => {
      // Check for duplicates (same prompt added within last 2 seconds)
      const recentIds = prev.filter(p => p.id > timestamp - 2000).map(p => p.prompt)
      const uniqueNewItems = newItems.filter(item => !recentIds.includes(item.prompt))

      if (uniqueNewItems.length === 0) {
        console.log('VeoFlow: All items are duplicates, skipping')
        return prev
      }

      const updated = [...prev, ...uniqueNewItems]
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ queue: updated })
      }
      return updated
    })

    // Reset flag after a short delay
    setTimeout(() => {
      addingRef.current = false
    }, 500)
  }

  const removeFromQueue = (id) => {
    setQueue(prev => {
      const updated = prev.filter(item => item.id !== id)
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ queue: updated })
      }
      return updated
    })
  }

  const clearQueue = () => {
    setQueue([])
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ queue: [] })
    }
  }

  const goToFlow = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow' })
    }
  }

  const startQueue = () => {
    if (queue.length === 0) return

    setIsRunning(true)
    setProgress({ current: 0, total: queue.length, status: 'Starting...' })

    // Send message to background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'START_QUEUE',
        data: { queue, settings }
      })
    }
  }

  const stopQueue = () => {
    setIsRunning(false)
    setProgress(prev => ({ ...prev, status: 'Stopped' }))

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'STOP_QUEUE' })
    }
  }

  const clearLogs = () => {
    setLogs([])
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ logs: [] })
    }
  }

  const clearFailedTasks = () => {
    setFailedTasks([])
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ failedTasks: [] })
    }
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'control':
        return (
          <ControlTab
            queue={queue}
            addToQueue={addToQueue}
            removeFromQueue={removeFromQueue}
            clearQueue={clearQueue}
            startQueue={startQueue}
            stopQueue={stopQueue}
            isRunning={isRunning}
            progress={progress}
            settings={settings}
            updateSettings={updateSettings}
            isOnFlowPage={isOnFlowPage}
            goToFlow={goToFlow}
          />
        )
      case 'settings':
        return (
          <SettingsTab
            settings={settings}
            updateSettings={updateSettings}
          />
        )
      case 'history':
        return (
          <HistoryTab
            logs={logs}
            clearLogs={clearLogs}
            failedTasks={failedTasks}
            clearFailedTasks={clearFailedTasks}
          />
        )
      case 'tools':
        return <MoreToolsTab />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <Header />

      {/* Flow Status Banner */}
      {!isOnFlowPage && (
        <div className="bg-dark-surface border-b border-dark-border px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-text-muted">Not on Google Flow</span>
          <button
            onClick={goToFlow}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-light transition-colors"
          >
            <ExternalLinkIcon />
            Go to Flow
          </button>
        </div>
      )}

      {isOnFlowPage && (
        <div className="bg-primary/10 border-b border-primary/30 px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-xs text-primary">Connected to Google Flow</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-dark-border px-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderTab()}
      </div>
    </div>
  )
}

export default App
