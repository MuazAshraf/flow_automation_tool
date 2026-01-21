import React, { useState, useRef } from 'react'
import { generatePrompts, generateVideoPrompts } from '../utils/openai'

// Icons
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
    <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z"/>
    <path d="M19 12l1 2 1-2 2-1-2-1-1-2-1 2-2 1 2 1z"/>
  </svg>
)

const LoadingSpinner = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
  </svg>
)

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)

// Mode labels for display
const MODE_LABELS = {
  'text-to-video': 'Text to Video',
  'frames-to-video': 'Frames to Video',
  'create-image': 'Create Image',
  'ingredients': 'Ingredients'
}

// Pause icon
const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
)

const ForwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 17 18 12 13 7"/>
    <polyline points="6 17 11 12 6 7"/>
  </svg>
)

function ControlTab({ queue, addToQueue, removeFromQueue, clearQueue, clearCompletedFromQueue, startQueue, stopQueue, continueQueue, isRunning, isPaused, progress, settings, storedImagePrompts, setStoredImagePrompts, storedImageTopic, setStoredImageTopic }) {
  const [promptText, setPromptText] = useState('')
  const [showQueue, setShowQueue] = useState(true)
  const [topic, setTopic] = useState('')
  const [promptCount, setPromptCount] = useState('5')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const fileInputRef = useRef(null)

  // Get current mode from settings
  const creationMode = settings.creationMode || 'text-to-video'
  const isFramesMode = creationMode === 'frames-to-video'
  const isCreateImageMode = creationMode === 'create-image'

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPromptText(event.target?.result || '')
      }
      reader.readAsText(file)
    }
  }

  const parsePrompts = (text) => {
    // Split by double newlines
    const prompts = text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0)

    return prompts.map(prompt => ({
      type: creationMode,
      prompt,
      folder: settings.downloadFolder || 'VeoFlow'
    }))
  }

  const handleAddToQueue = () => {
    // All modes now use prompts only (frames-to-video uses first frame from Google Flow UI)
    const items = parsePrompts(promptText)
    if (items.length > 0) {
      addToQueue(items)
      setPromptText('')
    }
  }

  const progressPercent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  const handleStartQueue = () => {
    if (queue.length === 0) return
    startQueue()
  }

  const handleGeneratePrompts = async () => {
    // For Frames to Video mode, we need stored image prompts as context
    if (isFramesMode && storedImagePrompts.length === 0) {
      setGenerateError('Please generate image prompts in Create Image mode first for character consistency')
      return
    }

    // For Create Image mode, require topic input
    if (!isFramesMode && !topic.trim()) return
    if (isGenerating) return

    setIsGenerating(true)
    setGenerateError('')

    try {
      let prompts
      if (isFramesMode) {
        // Use stored image prompts as context for character consistency
        prompts = await generateVideoPrompts(storedImageTopic, parseInt(promptCount), storedImagePrompts)
      } else if (isCreateImageMode) {
        // Generate image prompts and store them
        prompts = await generatePrompts(topic.trim(), parseInt(promptCount))
        // Store the prompts and topic for later use in Frames to Video mode
        setStoredImagePrompts(prompts)
        setStoredImageTopic(topic.trim())
      } else {
        // Text-to-Video and other modes
        prompts = await generatePrompts(topic.trim(), parseInt(promptCount))
      }
      // Join prompts with double newlines (format expected by parsePrompts)
      const formattedPrompts = prompts.join('\n\n')
      setPromptText(formattedPrompts)
      if (!isFramesMode) {
        setTopic('') // Clear topic after successful generation (only for non-frames mode)
      }
    } catch (error) {
      console.error('Failed to generate prompts:', error)
      setGenerateError(error.message || 'Failed to generate prompts')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Mode Display */}
      <div className="px-3 py-2 bg-dark-surface rounded-lg border border-dark-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Current Mode:</span>
          <span className="text-sm font-medium text-accent-teal">
            {MODE_LABELS[creationMode] || creationMode}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-1">
          Change mode in Settings tab
        </p>
      </div>

      {/* AI Prompt Generator */}
      <div className="space-y-2 p-3 bg-dark-surface rounded-lg border border-dark-border">
        <label className="text-sm font-medium text-primary flex items-center gap-2">
          <SparklesIcon />
          {isFramesMode ? 'AI Video Prompt Generator' : 'AI Prompt Generator'}
        </label>

        {/* Frames to Video mode - show stored topic from Create Image mode */}
        {isFramesMode ? (
          <div className="space-y-2">
            {storedImagePrompts.length > 0 ? (
              <>
                <div className="px-3 py-2 bg-dark-bg rounded border border-dark-border">
                  <span className="text-xs text-text-muted">Topic from Create Image:</span>
                  <p className="text-sm text-primary mt-1">{storedImageTopic}</p>
                  <span className="text-xs text-text-muted">{storedImagePrompts.length} character prompts stored</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={promptCount}
                    onChange={(e) => setPromptCount(e.target.value)}
                    className="w-full text-sm"
                    disabled={isGenerating}
                  >
                    <option value="3">3 Video Prompts</option>
                    <option value="5">5 Video Prompts</option>
                    <option value="7">7 Video Prompts</option>
                    <option value="10">10 Video Prompts</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded text-center">
                <p className="text-xs text-amber-400">No image prompts stored yet</p>
                <p className="text-xs text-text-muted mt-1">Generate prompts in Create Image mode first to maintain character consistency</p>
              </div>
            )}
          </div>
        ) : (
          /* Create Image / Text-to-Video mode - show topic input */
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic or story idea..."
              className="flex-1 text-sm"
              disabled={isGenerating}
            />
            <select
              value={promptCount}
              onChange={(e) => setPromptCount(e.target.value)}
              className="w-16 text-sm"
              disabled={isGenerating}
            >
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="7">7</option>
              <option value="10">10</option>
            </select>
          </div>
        )}

        <button
          onClick={handleGeneratePrompts}
          disabled={(isFramesMode ? storedImagePrompts.length === 0 : !topic.trim()) || isGenerating}
          className={`btn w-full ${(isFramesMode ? storedImagePrompts.length === 0 : !topic.trim()) || isGenerating ? 'bg-dark-border text-text-muted cursor-not-allowed' : 'btn-primary'}`}
        >
          {isGenerating ? (
            <>
              <LoadingSpinner />
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon />
              {isFramesMode ? 'Generate Video Prompts' : 'Generate Prompts'}
            </>
          )}
        </button>
        {generateError && (
          <p className="text-xs text-accent-red">{generateError}</p>
        )}
      </div>

      {/* Prompt List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-primary">
            Prompt List
          </label>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary text-xs py-1 px-3"
          >
            <UploadIcon />
            Import .txt
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </div>


      {/* Prompt Text Area */}
      <textarea
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder={`First prompt.\nCan span multiple lines.\n\nSecond prompt starts after blank line.\n\nThird prompt...`}
        className="w-full h-32 resize-none text-sm"
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleAddToQueue}
          disabled={!promptText.trim()}
          className={`btn flex-1 ${!promptText.trim() ? 'bg-dark-border text-text-muted cursor-not-allowed' : 'btn-warning'}`}
        >
          <PlusIcon />
          Add to Queue
        </button>
        <button
          onClick={clearQueue}
          disabled={queue.length === 0}
          className={`btn px-3 ${queue.length === 0 ? 'bg-dark-border text-text-muted cursor-not-allowed' : 'btn-danger'}`}
          title="Clear Queue"
        >
          <TrashIcon />
        </button>
      </div>

      {/* Queue Display */}
      <div className="border border-dark-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-dark-surface">
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="flex items-center gap-2 hover:bg-dark-hover transition-colors rounded px-1"
          >
            <span className="text-sm font-medium text-primary flex items-center gap-2">
              <ListIcon />
              Queue ({queue.length})
            </span>
            {showQueue ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
          {queue.some(item => item.status === 'completed') && (
            <button
              onClick={clearCompletedFromQueue}
              className="text-xs text-text-muted hover:text-accent-teal transition-colors"
              title="Clear completed tasks"
            >
              Clear done
            </button>
          )}
        </div>

        {showQueue && (
          <div className="max-h-40 overflow-y-auto">
            {queue.length === 0 ? (
              <div className="px-3 py-4 text-center text-text-muted text-sm">
                Queue empty. Add prompts above.
              </div>
            ) : (
              <div className="divide-y divide-dark-border">
                {queue.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 px-3 py-2 bg-dark-bg hover:bg-dark-hover group"
                  >
                    <span className="text-xs text-text-muted min-w-[20px]">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate" title={item.prompt}>
                        {item.prompt || '(No prompt)'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {MODE_LABELS[item.type] || item.type}
                        {item.status && ` • ${item.status}`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent-red/20 rounded transition-all"
                      title="Remove"
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 bg-dark-input rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-teal transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-text-muted">
          {progress.status} {progress.total > 0 && `(${progress.current}/${progress.total})`}
        </div>
      </div>

      {/* Paused for Reference */}
      {isPaused && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <PauseIcon />
            <span className="text-sm font-medium">
              {isFramesMode ? 'Paused - Add First Frame' : 'Paused - Add Reference Image'}
            </span>
          </div>
          <p className="text-xs text-text-muted">
            {isFramesMode
              ? 'Add the first frame image using Google Flow\'s "Add image" or use a result from previous generation. Then click Continue to generate this video.'
              : 'Image generated! Click "Add to prompt" on the result to use as reference for next prompt, then click Continue.'
            }
          </p>
          <button
            onClick={continueQueue}
            className="btn btn-warning w-full"
          >
            <ForwardIcon />
            {isFramesMode ? 'Continue to Generate Video' : 'Continue to Next Prompt'}
          </button>
        </div>
      )}

      {/* Start/Stop Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleStartQueue}
          disabled={isRunning || queue.length === 0}
          className={`btn flex-1 ${isRunning || queue.length === 0 ? 'bg-dark-border text-text-muted cursor-not-allowed' : 'btn-success'}`}
        >
          <PlayIcon />
          {isRunning ? (isPaused ? 'Paused' : 'Running...') : 'Start Queue'}
        </button>
        <button
          onClick={stopQueue}
          disabled={!isRunning}
          className={`btn flex-1 ${!isRunning ? 'bg-dark-border text-text-muted cursor-not-allowed' : 'btn-danger'}`}
        >
          <StopIcon />
          Stop
        </button>
      </div>
    </div>
  )
}

export default ControlTab
