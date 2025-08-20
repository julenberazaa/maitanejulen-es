"use client"

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface LogEntry {
  timestamp: number
  type: 'error' | 'warning' | 'info' | 'dom' | 'memory' | 'performance'
  message: string
  stack?: string
  component?: string
  details?: any
}

interface IOSVersionInfo {
  isIOS: boolean
  version: string
  isProblemVersion: boolean // iOS 16-17
  deviceModel: string
}

export default function IOSDebugLogger() {
  const [isActive, setIsActive] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [iosInfo, setIOSInfo] = useState<IOSVersionInfo | null>(null)
  const logsRef = useRef<LogEntry[]>([])
  const errorCountRef = useRef(0)
  const lastErrorTimeRef = useRef(0)
  const performanceIssuesRef = useRef(0)

  // Detect iOS version and device
  useEffect(() => {
    const detectIOSInfo = (): IOSVersionInfo => {
      const userAgent = navigator.userAgent
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
      
      if (!isIOS) {
        return {
          isIOS: false,
          version: '',
          isProblemVersion: false,
          deviceModel: ''
        }
      }

      // Extract iOS version
      const versionMatch = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/)
      const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0
      const minorVersion = versionMatch ? parseInt(versionMatch[2]) : 0
      const version = `${majorVersion}.${minorVersion}`
      
      // Extract device model
      let deviceModel = 'Unknown iPhone'
      if (userAgent.includes('iPhone')) {
        if (userAgent.includes('iPhone15')) deviceModel = 'iPhone 15 Series'
        else if (userAgent.includes('iPhone14')) deviceModel = 'iPhone 14 Series'
        else if (userAgent.includes('iPhone16')) deviceModel = 'iPhone 16 Series'
        else deviceModel = 'iPhone (Unknown Model)'
      } else if (userAgent.includes('iPad')) {
        deviceModel = 'iPad'
      }

      // iOS 16-17 are problem versions
      const isProblemVersion = majorVersion >= 16 && majorVersion <= 17

      return {
        isIOS,
        version,
        isProblemVersion,
        deviceModel
      }
    }

    const info = detectIOSInfo()
    setIOSInfo(info)
    
    // Only activate logging on problem iOS versions
    if (info.isProblemVersion) {
      setIsActive(true)
      addLog('info', `iOS Debug Logger activated for ${info.deviceModel} iOS ${info.version}`)
    }
  }, [])

  const addLog = (type: LogEntry['type'], message: string, stack?: string, component?: string, details?: any) => {
    const entry: LogEntry = {
      timestamp: Date.now(),
      type,
      message,
      stack,
      component,
      details
    }
    
    logsRef.current = [...logsRef.current.slice(-50), entry] // Keep last 50 logs
    setLogs([...logsRef.current])
    
    // Auto-show overlay on critical conditions
    if (type === 'error') {
      const now = Date.now()
      if (now - lastErrorTimeRef.current < 1000) {
        errorCountRef.current++
      } else {
        errorCountRef.current = 1
      }
      lastErrorTimeRef.current = now
      
      // Show overlay if 3+ errors in 1 second
      if (errorCountRef.current >= 3) {
        setIsVisible(true)
        addLog('warning', `⚠️ Critical error count reached: ${errorCountRef.current} errors in <1s`)
      }
    }

    console.log(`[iOS-DEBUG] ${type.toUpperCase()}: ${message}`, details || '')
  }

  // Global error handlers
  useEffect(() => {
    if (!isActive) return

    const handleError = (event: ErrorEvent) => {
      addLog('error', `JavaScript Error: ${event.message}`, event.error?.stack, undefined, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
      
      // Critical errors that often precede crashes
      if (event.message.includes('DOM') || 
          event.message.includes('transform') || 
          event.message.includes('height') ||
          event.message.includes('overflow')) {
        setIsVisible(true)
        addLog('warning', '🚨 Critical DOM manipulation error detected')
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog('error', `Unhandled Promise Rejection: ${event.reason}`, event.reason?.stack, undefined, {
        reason: event.reason
      })
    }

    const handleMemoryWarning = () => {
      addLog('memory', '🧠 Memory pressure warning detected')
      setIsVisible(true)
    }

    // Performance monitoring
    let observer: PerformanceObserver | null = null
    if ('PerformanceObserver' in window) {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.duration > 50) {
            performanceIssuesRef.current++
            addLog('performance', `⏱️ Long task detected: ${entry.duration.toFixed(2)}ms`, undefined, entry.name, {
              duration: entry.duration,
              startTime: entry.startTime
            })
            
            if (performanceIssuesRef.current >= 5) {
              setIsVisible(true)
              addLog('warning', '🐌 Performance degradation detected')
            }
          }
        })
      })
      
      try {
        observer.observe({ entryTypes: ['longtask', 'measure', 'navigation'] })
      } catch (e) {
        addLog('warning', 'Performance observer not fully supported')
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    // @ts-ignore - iOS specific memory warning
    window.addEventListener('memorywarning', handleMemoryWarning)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      // @ts-ignore
      window.removeEventListener('memorywarning', handleMemoryWarning)
      if (observer) observer.disconnect()
    }
  }, [isActive])

  // DOM mutation monitoring for critical elements
  useEffect(() => {
    if (!isActive) return

    const targetElements = [
      '#fixed-layout',
      '#fixed-layout-wrapper', 
      '#frames-overlay'
    ]

    const observers: MutationObserver[] = []

    targetElements.forEach(selector => {
      const element = document.querySelector(selector)
      if (element) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
              addLog('dom', `DOM mutation on ${selector}: ${mutation.attributeName}`, undefined, 'DOM-Monitor', {
                target: selector,
                attributeName: mutation.attributeName,
                oldValue: mutation.oldValue
              })
            }
          })
        })
        
        observer.observe(element, {
          attributes: true,
          attributeOldValue: true,
          attributeFilter: ['style', 'class']
        })
        
        observers.push(observer)
      }
    })

    return () => {
      observers.forEach(obs => obs.disconnect())
    }
  }, [isActive])

  const copyLogs = () => {
    const logText = logs.map(log => {
      const date = new Date(log.timestamp).toISOString()
      const component = log.component ? `[${log.component}] ` : ''
      const stack = log.stack ? `\nStack: ${log.stack}` : ''
      const details = log.details ? `\nDetails: ${JSON.stringify(log.details, null, 2)}` : ''
      return `${date} [${log.type.toUpperCase()}] ${component}${log.message}${stack}${details}`
    }).join('\n\n')
    
    const fullReport = `
iOS DEBUG REPORT
================
Device: ${iosInfo?.deviceModel}
iOS Version: ${iosInfo?.version}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
Total Logs: ${logs.length}
Error Count: ${errorCountRef.current}
Performance Issues: ${performanceIssuesRef.current}

LOGS:
=====
${logText}
`
    
    navigator.clipboard.writeText(fullReport).then(() => {
      addLog('info', '📋 Logs copied to clipboard')
    }).catch(() => {
      addLog('warning', 'Failed to copy logs to clipboard')
    })
  }

  // Expose addLog function to window for external components
  useEffect(() => {
    if (isActive) {
      (window as any).__iOSDebugLogger = {
        addLog,
        show: () => setIsVisible(true),
        hide: () => setIsVisible(false),
        isActive: true
      }
    }

    return () => {
      delete (window as any).__iOSDebugLogger
    }
  }, [isActive])

  if (!isActive || !iosInfo?.isProblemVersion) {
    return null
  }

  const overlay = (
    <div 
      className={`fixed top-4 right-4 w-96 bg-black/95 text-white text-xs border border-red-500 rounded-lg shadow-2xl transition-transform duration-300 ${
        isVisible ? 'scale-100' : 'scale-0'
      }`}
      style={{ 
        zIndex: 99999,
        fontFamily: 'monospace',
        maxHeight: '70vh',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div className="bg-red-600 px-3 py-2 flex justify-between items-center">
        <span className="font-bold">🚨 iOS Debug Logger</span>
        <div className="flex gap-1">
          <button
            onClick={copyLogs}
            className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs"
            title="Copy logs to clipboard"
          >
            📋 Copy
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs"
            title="Hide (tap to show again)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Device Info */}
      <div className="px-3 py-2 bg-yellow-600/30 border-b border-yellow-500/50">
        <div>{iosInfo.deviceModel} - iOS {iosInfo.version}</div>
        <div>Errors: {errorCountRef.current} | Perf Issues: {performanceIssuesRef.current}</div>
      </div>

      {/* Logs */}
      <div className="max-h-96 overflow-y-auto">
        {logs.slice(-20).map((log, index) => {
          const time = new Date(log.timestamp).toLocaleTimeString()
          const typeColors = {
            error: 'text-red-400',
            warning: 'text-yellow-400', 
            info: 'text-blue-400',
            dom: 'text-green-400',
            memory: 'text-purple-400',
            performance: 'text-orange-400'
          }
          
          return (
            <div key={index} className={`px-3 py-1 border-b border-gray-700 ${typeColors[log.type]}`}>
              <div className="flex justify-between">
                <span className="font-bold">[{log.type.toUpperCase()}]</span>
                <span className="text-gray-400">{time}</span>
              </div>
              <div className="mt-1">{log.message}</div>
              {log.component && (
                <div className="text-gray-500 text-xs">Component: {log.component}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  // Show toggle button when hidden
  const toggleButton = !isVisible && (
    <button
      onClick={() => setIsVisible(true)}
      className="fixed top-4 right-4 w-12 h-12 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center text-lg hover:bg-red-700 transition-colors"
      style={{ zIndex: 99998 }}
      title="Show iOS Debug Logger"
    >
      🚨
    </button>
  )

  return createPortal(
    <>
      {overlay}
      {toggleButton}
    </>,
    document.body
  )
}

// Export the logging function for external use
export const iOSDebugLog = (type: 'error' | 'warning' | 'info' | 'dom' | 'memory' | 'performance', message: string, component?: string, details?: any) => {
  const logger = (window as any).__iOSDebugLogger
  if (logger && logger.isActive) {
    logger.addLog(type, message, undefined, component, details)
  }
}
