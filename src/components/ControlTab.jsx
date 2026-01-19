import React, { useState, useRef } from 'react'

// Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
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

function ControlTab({ queue, addToQueue, removeFromQueue, clearQueue, clearCompletedFromQueue, startQueue, stopQueue, isRunning, progress, settings }) {
  const [promptText, setPromptText] = useState('')
  const [selectedImages, setSelectedImages] = useState([])
  const [imageSortOrder, setImageSortOrder] = useState('A-Z')
  const [showQueue, setShowQueue] = useState(true)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)

  // Get current mode from settings
  const creationMode = settings.creationMode || 'text-to-video'
  const isFramesMode = creationMode === 'frames-to-video'

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

  const handleSelectImages = (e) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      file
    }))

    // Sort images
    const sorted = [...imageFiles].sort((a, b) => {
      if (imageSortOrder === 'A-Z') return a.name.localeCompare(b.name)
      return b.name.localeCompare(a.name)
    })

    setSelectedImages(sorted)
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
    if (isFramesMode) {
      // Frames mode requires source images
      const prompts = parsePrompts(promptText)
      const items = selectedImages.map((img, idx) => ({
        type: creationMode,
        prompt: prompts[idx]?.prompt || '',
        image: img,
        folder: settings.downloadFolder || 'VeoFlow'
      }))
      if (items.length > 0) {
        addToQueue(items)
        setSelectedImages([])
        setPromptText('')
      }
    } else {
      // Text-to-Video, Create Image, Ingredients - prompts only
      const items = parsePrompts(promptText)
      if (items.length > 0) {
        addToQueue(items)
        setPromptText('')
      }
    }
  }

  const progressPercent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  const handleStartQueue = () => {
    if (queue.length === 0) return
    startQueue()
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

      {/* Image List (only for frames-to-video) */}
      {isFramesMode && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-primary">Source Images</label>
          <div className="flex gap-2">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="btn btn-secondary flex-1"
            >
              <ImageIcon />
              Select images
            </button>
            <select
              value={imageSortOrder}
              onChange={(e) => setImageSortOrder(e.target.value)}
              className="w-20"
            >
              <option value="A-Z">A-Z</option>
              <option value="Z-A">Z-A</option>
            </select>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleSelectImages}
            className="hidden"
          />
          {selectedImages.length > 0 && (
            <div className="text-xs text-text-muted">
              {selectedImages.length} images selected
            </div>
          )}
        </div>
      )}

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
          disabled={!promptText.trim() && selectedImages.length === 0}
          className={`btn flex-1 ${!promptText.trim() && selectedImages.length === 0 ? 'bg-dark-border text-text-muted cursor-not-allowed' : 'btn-warning'}`}
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

      {/* Start/Stop Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleStartQueue}
          disabled={isRunning || queue.length === 0}
          className={`btn flex-1 ${isRunning || queue.length === 0 ? 'bg-dark-border text-text-muted cursor-not-allowed' : 'btn-success'}`}
        >
          <PlayIcon />
          {isRunning ? 'Running...' : 'Start Queue'}
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
