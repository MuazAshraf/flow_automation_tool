import React, { useState } from 'react'

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

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
)

function HistoryTab({ logs, clearLogs, failedTasks, clearFailedTasks }) {
  const [showFailedTasks, setShowFailedTasks] = useState(true)

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-accent-green'
      case 'error': return 'text-accent-red'
      case 'warning': return 'text-accent-yellow'
      case 'info': return 'text-primary'
      default: return 'text-text-secondary'
    }
  }

  return (
    <div className="space-y-4">
      {/* Detailed Log Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary">Detailed Log</h2>
          <button
            onClick={clearLogs}
            className="text-xs text-text-muted hover:text-accent-red flex items-center gap-1 transition-colors"
          >
            <TrashIcon />
            Clear
          </button>
        </div>

        <div className="bg-dark-input rounded-lg border border-dark-border p-3 h-64 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-text-muted text-center py-8">
              No logs yet. Start a queue to see activity.
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className={`${getLogColor(log.type)}`}>
                  <span className="text-text-muted">[{formatTimestamp(log.timestamp)}]</span>{' '}
                  {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Failed Tasks Section */}
      <div className="space-y-2">
        <button
          onClick={() => setShowFailedTasks(!showFailedTasks)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="text-sm font-semibold text-accent-red flex items-center gap-2">
            Failed Tasks ({failedTasks.length})
            {showFailedTasks ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </h2>
          {failedTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // Retry all failed tasks
                  if (typeof chrome !== 'undefined' && chrome.runtime) {
                    chrome.runtime.sendMessage({
                      type: 'RETRY_FAILED_TASKS',
                      data: failedTasks
                    })
                  }
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <RefreshIcon />
                Retry All
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearFailedTasks()
                }}
                className="text-xs text-text-muted hover:text-accent-red flex items-center gap-1"
              >
                <TrashIcon />
                Clear
              </button>
            </div>
          )}
        </button>

        {showFailedTasks && (
          <div className="bg-dark-input rounded-lg border border-dark-border p-3 max-h-40 overflow-y-auto">
            {failedTasks.length === 0 ? (
              <div className="text-text-muted text-center py-4 text-xs">
                No failed tasks.
              </div>
            ) : (
              <div className="space-y-2">
                {failedTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-2 bg-dark-surface rounded border border-dark-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-secondary truncate">
                        {task.prompt?.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-accent-red mt-1">
                        {task.error || 'Unknown error'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (typeof chrome !== 'undefined' && chrome.runtime) {
                          chrome.runtime.sendMessage({
                            type: 'RETRY_TASK',
                            data: task
                          })
                        }
                      }}
                      className="text-primary hover:text-accent-green ml-2"
                      title="Retry this task"
                    >
                      <RefreshIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-dark-surface rounded-lg border border-dark-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Session Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-text-muted">Total Logs</p>
            <p className="text-lg font-bold text-primary">{logs.length}</p>
          </div>
          <div>
            <p className="text-text-muted">Failed Tasks</p>
            <p className="text-lg font-bold text-accent-red">{failedTasks.length}</p>
          </div>
          <div>
            <p className="text-text-muted">Success Rate</p>
            <p className="text-lg font-bold text-accent-green">
              {logs.length > 0
                ? Math.round(((logs.filter(l => l.type === 'success').length) / logs.length) * 100)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-text-muted">Videos Generated</p>
            <p className="text-lg font-bold text-accent-yellow">
              {logs.filter(l => l.type === 'success' && l.message?.includes('video')).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HistoryTab
