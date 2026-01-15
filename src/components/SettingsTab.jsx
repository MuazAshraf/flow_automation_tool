import React from 'react'

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)

const MODELS = [
  { value: 'veo-3.1-fast', label: 'Default (Veo 3.1 - Fast)' },
  { value: 'veo-3.1-low-priority', label: 'Veo 3.1 - Low Priority' },
  { value: 'veo-3.1-quality', label: 'Veo 3.1 - Quality' },
  { value: 'veo-2.0', label: 'Veo 2.0' },
]

const RATIOS = [
  { value: 'landscape', label: 'Landscape (16:9)' },
  { value: 'portrait', label: 'Portrait (9:16)' },
]

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

const VIDEOS_PER_TASK = ['1', '2', '3', '4']

function SettingsTab({ settings, updateSettings }) {
  const handleConfigureFolder = () => {
    // Open folder picker or show instructions
    if (typeof chrome !== 'undefined' && chrome.downloads) {
      chrome.downloads.showDefaultFolder()
    }
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-primary border-b border-dark-border pb-2">
          General Settings
        </h2>

        {/* Videos per task */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Videos per task:</label>
          <select
            value={settings.videosPerTask}
            onChange={(e) => updateSettings('videosPerTask', e.target.value)}
            className="w-48"
          >
            {VIDEOS_PER_TASK.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Model (Optional):</label>
          <select
            value={settings.model}
            onChange={(e) => updateSettings('model', e.target.value)}
            className="w-48"
          >
            {MODELS.map(model => (
              <option key={model.value} value={model.value}>{model.label}</option>
            ))}
          </select>
        </div>

        {/* Ratio */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Ratio (T2V & I2V Crop):</label>
          <select
            value={settings.ratio}
            onChange={(e) => updateSettings('ratio', e.target.value)}
            className="w-48"
          >
            {RATIOS.map(ratio => (
              <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
            ))}
          </select>
        </div>

        {/* Start from */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Start from (Prompt/Image):</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={settings.startFrom}
              onChange={(e) => updateSettings('startFrom', parseInt(e.target.value) || 1)}
              className="w-20 text-center"
            />
            <span className="text-text-muted">#</span>
          </div>
        </div>

        {/* Video creation wait time */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Video creation wait time (sec):</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="10"
              max="300"
              value={settings.waitTimeMin}
              onChange={(e) => updateSettings('waitTimeMin', parseInt(e.target.value) || 30)}
              className="w-16 text-center"
            />
            <span className="text-text-muted">to</span>
            <input
              type="number"
              min="10"
              max="300"
              value={settings.waitTimeMax}
              onChange={(e) => updateSettings('waitTimeMax', parseInt(e.target.value) || 60)}
              className="w-16 text-center"
            />
          </div>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Language:</label>
          <select
            value={settings.language}
            onChange={(e) => updateSettings('language', e.target.value)}
            className="w-48"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Download Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-primary border-b border-dark-border pb-2">
          Download Settings
        </h2>

        {/* Auto-download videos */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Auto-download videos:</label>
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
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Download folder:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={settings.downloadFolder || 'VeoFlow-Videos'}
              onChange={(e) => updateSettings('downloadFolder', e.target.value)}
              placeholder="VeoFlow-Videos"
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

        <p className="text-xs text-text-muted italic">
          Videos save to: Downloads/{settings.downloadFolder || 'VeoFlow-Videos'}/
        </p>
        <p className="text-xs text-text-muted italic">
          Tip: Turn off 'Ask where to save...' in your browser's download settings for seamless auto-downloading.
        </p>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-primary border-b border-dark-border pb-2">
          Advanced Settings
        </h2>

        {/* Retry on failure */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Retry failed tasks:</label>
          <button
            onClick={() => updateSettings('retryOnFailure', !settings.retryOnFailure)}
            className={`toggle ${settings.retryOnFailure ? 'toggle-enabled' : 'toggle-disabled'}`}
          >
            <span
              className={`toggle-knob ${settings.retryOnFailure ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {/* Human-like delays */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-secondary">Human-like delays:</label>
          <button
            onClick={() => updateSettings('humanLikeDelays', !settings.humanLikeDelays)}
            className={`toggle ${settings.humanLikeDelays !== false ? 'toggle-enabled' : 'toggle-disabled'}`}
          >
            <span
              className={`toggle-knob ${settings.humanLikeDelays !== false ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsTab
