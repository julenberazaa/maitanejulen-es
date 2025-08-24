"use client"

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface LogEntry {
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  data?: any
}

export default function EmergencyDebug() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Add log function
  const addLog = (level: LogEntry['level'], message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      level,
      message,
      data
    }
    
    setLogs(prev => [...prev.slice(-49), entry]) // Keep last 50
    
    // Also log to console for backup
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `[${entry.timestamp}] ${message}`, data || ''
    )
  }

  useEffect(() => {
    setMounted(true)
    
    // Log that debug system is active
    addLog('info', 'Emergency debug system initialized')
    
    // Detect device
    const isIPhone = /iPhone/.test(navigator.userAgent)
    addLog('info', `Device detected: ${isIPhone ? 'iPhone' : 'Other'}`)
    
    // Auto-show on iPhone
    if (isIPhone) {
      setIsVisible(true)
      addLog('warn', 'Auto-showing debug overlay on iPhone')
    }
    
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      addLog('error', `Global error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
      setIsVisible(true) // Show on any error
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog('error', `Unhandled rejection: ${event.reason}`)
      setIsVisible(true)
    }

    // Catch React errors
    const originalError = console.error
    console.error = (...args) => {
      addLog('error', `Console error: ${args.join(' ')}`)
      setIsVisible(true)
      originalError(...args)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Make globally accessible
    ;(window as any).showDebug = () => setIsVisible(true)
    ;(window as any).hideDebug = () => setIsVisible(false)
    ;(window as any).addDebugLog = addLog

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      console.error = originalError
      delete (window as any).showDebug
      delete (window as any).hideDebug
      delete (window as any).addDebugLog
    }
  }, [])

  const copyLogs = async () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${log.data ? `\nData: ${JSON.stringify(log.data, null, 2)}` : ''}`
    ).join('\n\n')
    
    const report = `EMERGENCY DEBUG REPORT
Generated: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
Screen: ${window.screen.width}x${window.screen.height}
Viewport: ${window.innerWidth}x${window.innerHeight}

LOGS:
${logText}`

    try {
      await navigator.clipboard.writeText(report)
      addLog('info', 'Debug report copied to clipboard!')
    } catch (e) {
      addLog('error', 'Failed to copy to clipboard', e)
      
      // Fallback: show text area
      const textarea = document.createElement('textarea')
      textarea.value = report
      textarea.style.position = 'fixed'
      textarea.style.top = '50%'
      textarea.style.left = '50%'
      textarea.style.transform = 'translate(-50%, -50%)'
      textarea.style.width = '80%'
      textarea.style.height = '60%'
      textarea.style.zIndex = '999999'
      textarea.style.backgroundColor = 'white'
      textarea.style.color = 'black'
      textarea.style.fontSize = '12px'
      textarea.style.padding = '10px'
      textarea.select()
      document.body.appendChild(textarea)
      
      setTimeout(() => {
        document.body.removeChild(textarea)
      }, 10000)
    }
  }

  if (!mounted) return null

  const overlay = (
    <div 
      className={`fixed inset-4 bg-black/95 text-white text-xs font-mono border-2 border-red-500 rounded-lg shadow-2xl transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={{ 
        zIndex: 999999,
        maxHeight: '90vh',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div className="bg-red-600 px-3 py-2 flex justify-between items-center border-b border-red-500">
        <span className="font-bold text-sm">🚨 EMERGENCY DEBUG</span>
        <div className="flex gap-2">
          <button
            onClick={copyLogs}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs font-bold"
          >
            📋 COPY
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Device Info */}
      <div className="px-3 py-2 bg-yellow-900 border-b border-yellow-600 text-xs">
        <div>🔍 Device: {/iPhone/.test(navigator.userAgent) ? 'iPhone' : /iPad/.test(navigator.userAgent) ? 'iPad' : 'Other'}</div>
        <div>📱 Screen: {window.screen.width}x{window.screen.height} | Viewport: {window.innerWidth}x{window.innerHeight}</div>
        <div>🌐 URL: {window.location.pathname}</div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(90vh - 120px)' }}>
        {logs.length === 0 ? (
          <div className="text-gray-400">No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`p-2 rounded border-l-4 ${
              log.level === 'error' ? 'bg-red-900/50 border-red-500 text-red-200' :
              log.level === 'warn' ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200' :
              log.level === 'info' ? 'bg-blue-900/50 border-blue-500 text-blue-200' :
              'bg-gray-900/50 border-gray-500 text-gray-200'
            }`}>
              <div className="flex justify-between items-start">
                <span className="font-bold uppercase text-xs">{log.level}</span>
                <span className="text-xs opacity-60">{log.timestamp}</span>
              </div>
              <div className="mt-1 text-sm">{log.message}</div>
              {log.data && (
                <div className="mt-2 text-xs opacity-80 bg-black/50 p-2 rounded">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(log.data, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="px-3 py-2 bg-gray-800 border-t border-gray-600 text-xs">
        <div>🎯 <strong>Console commands:</strong> <code>showDebug()</code> <code>hideDebug()</code> <code>addDebugLog('info', 'message')</code></div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}

// Global log function
export const emergencyLog = (level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any) => {
  if (typeof window !== 'undefined' && (window as any).addDebugLog) {
    ;(window as any).addDebugLog(level, message, data)
  }
}