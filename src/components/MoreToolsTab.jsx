import React from 'react'

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const MusicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
)

const CodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
)

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

const TOOLS = [
  {
    name: 'Google Flow',
    description: 'Open Google Flow AI Studio',
    icon: VideoIcon,
    url: 'https://labs.google/fx/tools/video-fx',
    color: 'text-primary'
  },
  {
    name: 'Imagen 3',
    description: 'Google AI Image Generation',
    icon: ImageIcon,
    url: 'https://labs.google/fx/tools/image-fx',
    color: 'text-primary'
  },
  {
    name: 'MusicFX',
    description: 'Google AI Music Generation',
    icon: MusicIcon,
    url: 'https://labs.google/fx/tools/music-fx',
    color: 'text-primary'
  },
  {
    name: 'AI Studio',
    description: 'Google AI Studio for Developers',
    icon: CodeIcon,
    url: 'https://aistudio.google.com/',
    color: 'text-primary'
  },
]

function MoreToolsTab() {
  const openUrl = (url) => {
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Quick Links */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-primary">Quick Links</h2>

        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map((tool) => (
            <button
              key={tool.name}
              onClick={() => openUrl(tool.url)}
              className="flex flex-col items-center justify-center p-4 bg-dark-surface rounded-lg border border-dark-border hover:border-primary transition-colors group"
            >
              <div className={`${tool.color} mb-2 group-hover:scale-110 transition-transform`}>
                <tool.icon />
              </div>
              <span className="text-sm font-medium text-text-primary">{tool.name}</span>
              <span className="text-xs text-text-muted mt-1">{tool.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="bg-dark-surface rounded-lg border border-dark-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">About VeoFlow</h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          VeoFlow is a browser extension that automates bulk video generation on Google Flow AI.
          It supports batch prompts, multiple VEO models, image-to-video conversion, and automatic downloads.
        </p>

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() => openUrl('https://github.com/veoflow')}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLinkIcon />
            GitHub
          </button>
          <button
            onClick={() => openUrl('https://twitter.com/veoflow')}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLinkIcon />
            Twitter
          </button>
          <button
            onClick={() => openUrl('mailto:support@veoflow.com')}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLinkIcon />
            Support
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-dark-surface rounded-lg border border-dark-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Tips & Tricks</h2>
        <ul className="text-xs text-text-secondary space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Use double line breaks to separate prompts in your text file.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Set human-like delays to reduce bot detection risk.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Use "Veo 3.1 Quality" for important videos, "Fast" for bulk generation.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Enable auto-download and disable "Ask where to save" in Chrome settings.
          </li>
        </ul>
      </div>

      {/* Support */}
      <div className="text-center py-4">
        <p className="text-xs text-text-muted mb-2">
          Made with <HeartIcon className="inline text-accent-red" /> by the VeoFlow Team
        </p>
        <p className="text-xs text-text-muted">
          Version 1.0.0
        </p>
      </div>
    </div>
  )
}

export default MoreToolsTab
