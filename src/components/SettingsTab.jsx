import React from 'react'

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)

// Creation modes
const CREATION_MODES = [
  { value: 'text-to-video', label: 'Text to Video' },
  { value: 'frames-to-video', label: 'Frames to Video' },
  { value: 'create-image', label: 'Create Image' },
  { value: 'ingredients', label: 'Ingredients to Video' },
]

// Video models (for Text to Video, Frames to Video, Ingredients)
const VIDEO_MODELS = [
  { value: 'veo-3.1-fast', label: 'Veo 3.1 - Fast' },
  { value: 'veo-3.1-quality', label: 'Veo 3.1 - Quality' },
  { value: 'veo-2-fast', label: 'Veo 2 - Fast' },
  { value: 'veo-2-quality', label: 'Veo 2 - Quality' },
]

// Image models (for Create Image)
const IMAGE_MODELS = [
  { value: 'imagen-4', label: 'Imagen 4' },
  { value: 'nano-banana', label: 'Nano Banana' },
  { value: 'nano-banana-pro', label: 'Nano Banana Pro' },
]

// Ratios
const RATIOS = [
  { value: 'landscape', label: '16:9 (Landscape)' },
  { value: 'portrait', label: '9:16 (Portrait)' },
]

// Output counts
const OUTPUT_COUNTS = ['1', '2', '3', '4']

// Languages
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
]

function SettingsTab({ settings, updateSettings }) {
  const isVideoMode = settings.creationMode !== 'create-image'
  const models = isVideoMode ? VIDEO_MODELS : IMAGE_MODELS
  const outputLabel = isVideoMode ? 'Videos per prompt:' : 'Images per prompt:'

  const handleConfigureFolder = () => {
    if (typeof chrome !== 'undefined' && chrome.downloads) {
      chrome.downloads.showDefaultFolder()
    }
  }

  // When mode changes, reset model to correct default for that mode
  const handleModeChange = (newMode) => {
    updateSettings('creationMode', newMode)
    // Reset model to correct default for the new mode
    // CRITICAL: Use veo-3.1-fast (20 credits) as default, NOT veo-2-quality (100 credits)
    if (newMode === 'create-image') {
      updateSettings('model', 'nano-banana-pro')  // Default image model
    } else {
      updateSettings('model', 'veo-3.1-fast')     // Default video model (20 credits)
    }
  }


  return (
    <div className="space-y-6">
      {/* Creation Mode */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-primary border-b border-dark-border pb-2">
          Creation Mode
        </h2>

        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Mode:</label>
          <select
            value={settings.creationMode || 'text-to-video'}
            onChange={(e) => handleModeChange(e.target.value)}
            className="w-48"
          >
            {CREATION_MODES.map(mode => (
              <option key={mode.value} value={mode.value}>{mode.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode-specific Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-primary border-b border-dark-border pb-2">
          {isVideoMode ? 'Video Settings' : 'Image Settings'}
        </h2>

        {/* Model */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Model:</label>
          <select
            value={settings.model || models[0].value}
            onChange={(e) => updateSettings('model', e.target.value)}
            className="w-48"
          >
            {models.map(model => (
              <option key={model.value} value={model.value}>{model.label}</option>
            ))}
          </select>
        </div>

        {/* Ratio */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Aspect Ratio:</label>
          <select
            value={settings.ratio || 'landscape'}
            onChange={(e) => updateSettings('ratio', e.target.value)}
            className="w-48"
          >
            {RATIOS.map(ratio => (
              <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
            ))}
          </select>
        </div>

        {/* Output count */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">{outputLabel}</label>
          <select
            value={settings.outputCount || '1'}
            onChange={(e) => updateSettings('outputCount', e.target.value)}
            className="w-48"
          >
            {OUTPUT_COUNTS.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>

      {/* General Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-primary border-b border-dark-border pb-2">
          General Settings
        </h2>

        {/* Language */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Language:</label>
          <select
            value={settings.language || 'en'}
            onChange={(e) => updateSettings('language', e.target.value)}
            className="w-48"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>

        {/* Auto-download */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Auto-download:</label>
          <button
            onClick={() => updateSettings('autoDownload', !settings.autoDownload)}
            className={`toggle ${settings.autoDownload ? 'toggle-enabled' : 'toggle-disabled'}`}
          >
            <span
              className={`toggle-knob ${settings.autoDownload ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {/* Download folder name */}
        {settings.autoDownload && (
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-secondary">Download folder:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.downloadFolder || 'VeoFlow'}
                onChange={(e) => updateSettings('downloadFolder', e.target.value)}
                placeholder="VeoFlow"
                className="w-36 text-sm"
              />
              <button
                onClick={handleConfigureFolder}
                className="p-1.5 bg-dark-surface hover:bg-dark-hover rounded transition-colors"
                title="Open Downloads folder"
              >
                <FolderIcon />
              </button>
            </div>
          </div>
        )}

        {/* Pause for reference images */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-text-secondary">Pause for references:</label>
            <p className="text-xs text-text-muted">Pause after each image to add reference</p>
          </div>
          <button
            onClick={() => updateSettings('pauseForReference', !settings.pauseForReference)}
            className={`toggle ${settings.pauseForReference ? 'toggle-enabled' : 'toggle-disabled'}`}
          >
            <span
              className={`toggle-knob ${settings.pauseForReference ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsTab
