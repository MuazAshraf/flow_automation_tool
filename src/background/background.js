/**
 * VeoFlow Background Service Worker
 * Handles queue management, tab control, and communication with content scripts
 */

console.log('VeoFlow background service worker starting...')

// State management
let state = {
  isRunning: false,
  currentTaskIndex: 0,
  queue: [],
  settings: {},
  activeTabId: null
}

// Flow URLs
const FLOW_URLS = [
  'https://labs.google/fx/tools/video-fx',
  'https://labs.google/fx/tools/flow',
  'https://labs.google/flow'
]

// Initialize state from storage
chrome.storage.local.get(['queue', 'settings', 'isRunning'], (result) => {
  if (result.queue) state.queue = result.queue
  if (result.settings) state.settings = result.settings
  if (result.isRunning) state.isRunning = result.isRunning
  console.log('VeoFlow: State loaded from storage', { queueLength: state.queue.length })
})

// Register extension icon click handler early - open sidebar
chrome.action.onClicked.addListener(async (tab) => {
  console.log('VeoFlow: Extension icon clicked, opening sidebar...')
  console.log('VeoFlow: Tab info:', { tabId: tab.id, windowId: tab.windowId })
  
  // Check if sidePanel API is available
  if (!chrome.sidePanel) {
    console.error('VeoFlow: chrome.sidePanel API is not available. Make sure you are using Chrome 114+ and have the side_panel permission.')
    return
  }
  
  try {
    // Open the sidebar directly (setOptions doesn't exist in the API)
    await chrome.sidePanel.open({ windowId: tab.windowId })
    console.log('VeoFlow: Sidebar opened successfully')
  } catch (error) {
    console.error('VeoFlow: Failed to open sidebar:', error)
    console.error('VeoFlow: Error details:', error.message, error.stack)
    
    // Fallback: try to open in current tab's window
    try {
      const window = await chrome.windows.get(tab.windowId)
      await chrome.sidePanel.open({ windowId: window.id })
      console.log('VeoFlow: Sidebar opened via fallback')
    } catch (e) {
      console.error('VeoFlow: Fallback sidebar open failed:', e)
      console.error('VeoFlow: Fallback error details:', e.message, e.stack)
    }
  }
})

// Helper: Generate random delay within range
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper: Sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper: Log message to popup and console
function log(type, message) {
  const logEntry = {
    type,
    message,
    timestamp: Date.now()
  }

  console.log(`VeoFlow [${type}]:`, message)

  // Save to storage
  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || []
    logs.push(logEntry)
    // Keep only last 500 logs
    if (logs.length > 500) logs.shift()
    chrome.storage.local.set({ logs })
  })

  // Send to popup if open
  chrome.runtime.sendMessage({ type: 'LOG', data: logEntry }).catch(() => {})
}

// Helper: Update progress
function updateProgress(current, total, status) {
  const data = { current, total, status }
  console.log('VeoFlow progress:', data)
  chrome.runtime.sendMessage({ type: 'PROGRESS_UPDATE', data }).catch(() => {})
}

// Helper: Send status update
function sendStatusUpdate() {
  chrome.runtime.sendMessage({
    type: 'STATUS_UPDATE',
    data: { isRunning: state.isRunning }
  }).catch(() => {})
  chrome.storage.local.set({ isRunning: state.isRunning })
}

// Find existing Flow tab or create new one
async function getOrCreateFlowTab() {
  console.log('VeoFlow: Looking for Flow tab...')

  // Check for existing Flow tabs
  for (const url of FLOW_URLS) {
    try {
      const tabs = await chrome.tabs.query({ url: url + '*' })
      if (tabs.length > 0) {
        console.log('VeoFlow: Found existing Flow tab:', tabs[0].id)
        return tabs[0]
      }
    } catch (e) {
      console.error('Error querying tabs:', e)
    }
  }

  // Also check with broader pattern
  try {
    const tabs = await chrome.tabs.query({ url: '*://labs.google/*' })
    if (tabs.length > 0) {
      console.log('VeoFlow: Found labs.google tab:', tabs[0].id)
      return tabs[0]
    }
  } catch (e) {
    console.error('Error querying labs.google tabs:', e)
  }

  // Create new tab
  console.log('VeoFlow: Creating new Flow tab...')
  const tab = await chrome.tabs.create({ url: FLOW_URLS[0], active: true })
  console.log('VeoFlow: Created new tab:', tab.id)
  return tab
}

// Wait for tab to finish loading
async function waitForTabLoad(tabId, timeout = 30000) {
  console.log('VeoFlow: Waiting for tab to load:', tabId)
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const checkTab = async () => {
      try {
        const tab = await chrome.tabs.get(tabId)
        if (tab.status === 'complete') {
          console.log('VeoFlow: Tab loaded successfully')
          resolve(tab)
          return
        }
      } catch (e) {
        reject(new Error('Tab closed or unavailable'))
        return
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Tab load timeout'))
        return
      }

      setTimeout(checkTab, 500)
    }

    checkTab()
  })
}

// Inject content script if needed
async function ensureContentScript(tabId) {
  console.log('VeoFlow: Checking content script on tab:', tabId)

  // Try multiple pings with longer timeout to avoid unnecessary re-injection
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Try to ping existing content script with timeout
      const response = await Promise.race([
        chrome.tabs.sendMessage(tabId, { type: 'PING' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), 2000))
      ])

      if (response && response.success) {
        console.log('VeoFlow: Content script already active (attempt', attempt, ')')
        return true
      }
    } catch (e) {
      console.log('VeoFlow: Ping attempt', attempt, 'failed:', e.message)
      if (attempt < 3) {
        await sleep(500) // Wait before retry
      }
    }
  }

  // All pings failed, inject content script
  console.log('VeoFlow: Content script not responding after 3 attempts, injecting...')
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['src/content/content.js']
    })
    console.log('VeoFlow: Content script injected')
    await sleep(1500) // Wait longer for script to initialize
    return true
  } catch (e) {
    console.error('VeoFlow: Failed to inject content script:', e)
    throw new Error('Failed to inject content script: ' + e.message)
  }
}

// Execute a single task
async function executeTask(task, settings) {
  if (!state.activeTabId) {
    throw new Error('No active tab')
  }

  const promptPreview = task.prompt ? task.prompt.substring(0, 50) + '...' : '(no prompt)'
  log('info', `Executing task: ${promptPreview}`)

  try {
    // Send task to content script
    console.log('VeoFlow: Sending EXECUTE_TASK to content script...')
    const response = await chrome.tabs.sendMessage(state.activeTabId, {
      type: 'EXECUTE_TASK',
      data: { task, settings }
    })

    console.log('VeoFlow: Content script response:', response)

    if (response && response.success) {
      log('success', `Task started: ${promptPreview}`)
      return true
    } else {
      throw new Error(response?.error || 'Task execution failed')
    }
  } catch (error) {
    console.error('VeoFlow: Task execution error:', error)
    log('error', `Task failed: ${error.message}`)
    throw error
  }
}

// Wait for video generation to be partially complete (for bulk videos in same project)
async function waitForVideoPartialCompletion(settings, isLastTask = false) {
  // For bulk videos in same project, we wait until video is ~50% done, then start next
  // For last task, wait for full completion
  const minWait = (settings.waitTimeMin || 30) * 1000
  const maxWait = (settings.waitTimeMax || 120) * 1000
  const checkInterval = 3000 // Check more frequently

  if (isLastTask) {
    log('info', `Waiting for final video to complete (${settings.waitTimeMin}-${settings.waitTimeMax}s)...`)
  } else {
    log('info', `Waiting for video to be partially complete (~50%) before next prompt...`)
  }

  const startTime = Date.now()
  const targetWait = isLastTask ? maxWait : Math.min(minWait + (maxWait - minWait) * 0.5, maxWait * 0.6) // ~50% for bulk

  while (Date.now() - startTime < targetWait) {
    if (!state.isRunning) {
      throw new Error('Queue stopped by user')
    }

    await sleep(checkInterval)

    try {
      const response = await chrome.tabs.sendMessage(state.activeTabId, {
        type: 'CHECK_VIDEO_STATUS'
      })

      console.log('VeoFlow: Video status:', response)

      if (response.status === 'completed') {
        log('success', 'Video generation completed!')
        return true
      } else if (response.status === 'error') {
        throw new Error(response.error || 'Video generation failed')
      }
      // Still processing, continue
    } catch (e) {
      console.log('VeoFlow: Status check error (continuing):', e.message)
    }
  }

  if (isLastTask) {
    log('info', 'Final video wait time reached')
  } else {
    log('info', 'Video partially complete, starting next prompt in same project')
  }
  return true
}

// Download video
async function downloadVideo(settings, task) {
  if (!settings.autoDownload) {
    log('info', 'Auto-download disabled, skipping')
    return
  }

  try {
    const response = await chrome.tabs.sendMessage(state.activeTabId, {
      type: 'DOWNLOAD_VIDEO',
      data: { folder: task.folder || settings.downloadFolder || 'VeoFlow' }
    })

    if (response && response.success) {
      log('success', 'Video downloaded')
    } else {
      log('warning', 'Download may have failed: ' + (response?.error || 'unknown'))
    }
  } catch (error) {
    log('warning', `Download error: ${error.message}`)
  }
}

// Main queue processing function
async function processQueue() {
  console.log('VeoFlow: Starting queue processing...')
  console.log('VeoFlow: Queue length:', state.queue.length)
  console.log('VeoFlow: Settings:', state.settings)

  if (!state.isRunning) {
    log('info', 'Queue not running, aborting')
    return
  }

  if (state.queue.length === 0) {
    log('warning', 'Queue is empty')
    state.isRunning = false
    sendStatusUpdate()
    return
  }

  log('info', `Starting queue: ${state.queue.length} tasks`)
  updateProgress(0, state.queue.length, 'Opening Google Flow...')

  // Step 1: Get or create Flow tab
  let tab
  try {
    tab = await getOrCreateFlowTab()
    state.activeTabId = tab.id

    // Focus the tab
    await chrome.tabs.update(tab.id, { active: true })
    await chrome.windows.update(tab.windowId, { focused: true })

    log('info', 'Flow tab ready: ' + tab.id)
  } catch (error) {
    log('error', 'Failed to open Flow: ' + error.message)
    state.isRunning = false
    sendStatusUpdate()
    return
  }

  // Step 2: Wait for page to load
  try {
    await waitForTabLoad(state.activeTabId)
    await sleep(2000) // Extra wait for JS to initialize
  } catch (error) {
    log('error', 'Flow page failed to load: ' + error.message)
    state.isRunning = false
    sendStatusUpdate()
    return
  }

  // Step 3: Ensure content script is ready
  try {
    await ensureContentScript(state.activeTabId)
  } catch (error) {
    log('error', 'Content script error: ' + error.message)
    state.isRunning = false
    sendStatusUpdate()
    return
  }

  // Step 3.5: Click "Start project" button once at the beginning
  try {
    log('info', 'Clicking "Start project" button...')
    const clickResponse = await chrome.tabs.sendMessage(state.activeTabId, {
      type: 'CLICK_START_PROJECT'
    })
    if (clickResponse && clickResponse.success) {
      log('success', 'Start project button clicked')
      await sleep(2000) // Wait for UI to update
    } else {
      log('warning', 'Start project button may not have been found (might already be in create mode)')
    }
  } catch (error) {
    log('warning', 'Failed to click start project button: ' + error.message + ' (continuing anyway)')
  }

  // Step 3.6: Apply settings ONCE at the beginning (mode, model, ratio, output count)
  try {
    const firstTask = state.queue[0]
    log('info', 'Applying settings once: ' + (firstTask?.type || 'text-to-video'))
    const settingsResponse = await chrome.tabs.sendMessage(state.activeTabId, {
      type: 'APPLY_SETTINGS',
      data: {
        mode: firstTask?.type || state.settings.creationMode || 'text-to-video',
        settings: state.settings
      }
    })
    if (settingsResponse && settingsResponse.success) {
      log('success', 'Settings applied')
    } else {
      log('warning', 'Settings may not have been applied: ' + (settingsResponse?.error || 'unknown'))
    }
  } catch (error) {
    log('warning', 'Failed to apply settings: ' + error.message)
  }

  // Step 4: Process each task
  const startIndex = Math.max(0, (state.settings.startFrom || 1) - 1)
  const tasksToProcess = state.queue.slice(startIndex)

  log('info', `Processing ${tasksToProcess.length} tasks (starting from ${startIndex + 1})`)

  for (let i = 0; i < tasksToProcess.length; i++) {
    if (!state.isRunning) {
      log('info', 'Queue stopped by user')
      break
    }

    const task = tasksToProcess[i]
    const taskNum = startIndex + i + 1

    updateProgress(taskNum, state.queue.length, `Task ${taskNum}/${state.queue.length}`)
    log('info', `--- Task ${taskNum}/${state.queue.length} ---`)

    // Mark task as in-progress and update UI
    task.status = 'processing'
    chrome.storage.local.set({ queue: state.queue })
    chrome.runtime.sendMessage({ type: 'QUEUE_UPDATE', data: state.queue }).catch(() => {})

    try {
      // Execute the task (enters prompt, clicks generate, etc.)
      // All tasks run in the SAME project - no new project click between tasks
      await executeTask(task, state.settings)
      log('info', `Task ${taskNum} prompt submitted`)

      const isLastTask = (i === tasksToProcess.length - 1)
      const isImageTask = task.type === 'create-image'

      if (isImageTask) {
        // IMAGES: Fast mode - mark complete quickly
        await sleep(800) // Just enough for generate to register
        task.status = 'completed'
      } else {
        // VIDEOS: Wait for completion before marking as done
        await waitForVideoPartialCompletion(state.settings, isLastTask)
        task.status = 'completed'

        // Download video if enabled
        if (state.settings.autoDownload) {
          await downloadVideo(state.settings, task)
        }

        // Short delay before entering next prompt
        if (!isLastTask) {
          const delay = getRandomDelay(1000, 2000)
          log('info', `Waiting ${Math.round(delay/1000)}s before next video prompt...`)
          await sleep(delay)
        }
      }

      // Update UI with completed status
      log('success', `Task ${taskNum} completed`)
      chrome.storage.local.set({ queue: state.queue })
      chrome.runtime.sendMessage({ type: 'QUEUE_UPDATE', data: state.queue }).catch(() => {})

    } catch (error) {
      log('error', `Task ${taskNum} failed: ${error.message}`)
      task.status = 'failed'
      task.error = error.message

      // Report failed task and update UI
      chrome.runtime.sendMessage({
        type: 'TASK_FAILED',
        data: task
      }).catch(() => {})
      chrome.storage.local.set({ queue: state.queue })
      chrome.runtime.sendMessage({ type: 'QUEUE_UPDATE', data: state.queue }).catch(() => {})

      // Continue with next task after a short delay
      await sleep(2000)
    }
  }


  // Done
  state.isRunning = false
  sendStatusUpdate()
  updateProgress(state.queue.length, state.queue.length, 'Completed')
  log('success', 'Queue processing finished!')

  // Remove completed tasks from queue (keep only pending and failed)
  const remainingQueue = state.queue.filter(task => task.status !== 'completed')
  state.queue = remainingQueue

  // Update queue in storage and notify UI
  chrome.storage.local.set({ queue: remainingQueue })
  chrome.runtime.sendMessage({ type: 'QUEUE_UPDATE', data: remainingQueue }).catch(() => {})

  log('info', `Cleared ${state.queue.length === 0 ? 'all' : 'completed'} tasks from queue`)
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('VeoFlow background received:', message.type)

  switch (message.type) {
    case 'START_QUEUE':
      console.log('VeoFlow: START_QUEUE received')
      if (!state.isRunning) {
        state.isRunning = true
        state.queue = message.data.queue || []
        state.settings = message.data.settings || {}

        console.log('VeoFlow: Queue:', state.queue.length, 'items')
        console.log('VeoFlow: Settings:', state.settings)

        chrome.storage.local.set({
          queue: state.queue,
          settings: state.settings,
          isRunning: true
        })

        sendStatusUpdate()

        // Start processing (don't await - let it run in background)
        processQueue().catch(e => {
          console.error('VeoFlow: processQueue error:', e)
          log('error', 'Queue processing error: ' + e.message)
          state.isRunning = false
          sendStatusUpdate()
        })

        sendResponse({ success: true, message: 'Queue started' })
      } else {
        sendResponse({ success: false, message: 'Queue already running' })
      }
      break

    case 'STOP_QUEUE':
      console.log('VeoFlow: STOP_QUEUE received')
      state.isRunning = false
      chrome.storage.local.set({ isRunning: false })
      sendStatusUpdate()
      log('info', 'Queue stopped by user')
      sendResponse({ success: true })
      break

    case 'GET_STATUS':
      sendResponse({
        isRunning: state.isRunning,
        queueLength: state.queue.length,
        activeTabId: state.activeTabId
      })
      break

    case 'CONTENT_SCRIPT_READY':
      console.log('VeoFlow: Content script ready on:', message.data?.url)
      sendResponse({ success: true })
      break

    case 'DOWNLOAD_URL':
      // Download a video URL to specific folder using Chrome downloads API
      console.log('VeoFlow: DOWNLOAD_URL received:', message.data?.filename)
      try {
        const { url, filename } = message.data || {}
        if (url) {
          chrome.downloads.download({
            url: url,
            filename: filename || `VeoFlow_${Date.now()}.mp4`,
            saveAs: false // Don't prompt, use specified filename/folder
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error('VeoFlow: Download error:', chrome.runtime.lastError)
              log('error', 'Download failed: ' + chrome.runtime.lastError.message)
              sendResponse({ success: false, error: chrome.runtime.lastError.message })
            } else {
              console.log('VeoFlow: Download started, ID:', downloadId)
              log('success', 'Video download started: ' + filename)
              sendResponse({ success: true, downloadId })
            }
          })
        } else {
          sendResponse({ success: false, error: 'No URL provided' })
        }
      } catch (e) {
        console.error('VeoFlow: Download exception:', e)
        sendResponse({ success: false, error: e.message })
      }
      break

    default:
      console.log('VeoFlow: Unknown message type:', message.type)
      sendResponse({ error: 'Unknown message type' })
  }

  return true // Keep channel open for async response
})

// Handle tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === state.activeTabId) {
    console.log('VeoFlow: Active tab closed')
    state.activeTabId = null
    if (state.isRunning) {
      log('warning', 'Flow tab closed, stopping queue')
      state.isRunning = false
      sendStatusUpdate()
    }
  }
})

console.log('VeoFlow background service worker initialized')
