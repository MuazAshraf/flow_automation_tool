import React from 'react'

// VeoFlow Logo - Clean modern design with blue accent
const LogoIcon = () => (
  <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#2B5288"/>
    <path d="M30 50 L45 35 L45 45 L70 45 L70 55 L45 55 L45 65 Z" fill="white"/>
    <circle cx="65" cy="35" r="8" fill="white" fillOpacity="0.9"/>
  </svg>
)

function Header() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-dark-border bg-dark-surface">
      <div className="flex items-center gap-3">
        <LogoIcon />
        <div>
          <h1 className="text-lg font-bold text-text-primary">VeoFlow</h1>
          <p className="text-xs text-text-muted">Bulk Video Automation</p>
        </div>
      </div>
      <div className="px-2 py-1 bg-primary/20 rounded text-xs text-primary font-medium">
        v1.0
      </div>
    </div>
  )
}

export default Header
