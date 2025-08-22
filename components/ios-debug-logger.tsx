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

  // Check for previous logs after page reload/crash
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const previousLogs = localStorage.getItem('ios-debug-formatted')
      if (previousLogs && previousLogs.length > 100) {
        console.warn(`
🔄 iOS DEBUG: LOGS FROM PREVIOUS SESSION DETECTED
================================================
This might be from a session that crashed/reloaded.

To view previous logs, run:
iOSDebug.printLogs()

To clear old logs:  
iOSDebug.clearLogs()

To export all data:
iOSDebug.exportLogs()
`)
        
        // Also check if logs contain critical indicators
        if (previousLogs.includes('CRITICAL POINT') || 
            previousLogs.includes('CRITICAL ERROR DETECTED') ||
            previousLogs.includes('About to hide overlay')) {
          console.error(`
🚨 PREVIOUS SESSION HAD CRITICAL ERRORS!
=======================================
Run iOSDebug.printLogs() to see what happened before crash/reload
`)
        }
      }
    } catch (e) {
      console.warn('Could not check for previous iOS debug logs')
    }
  }, [])

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
    
    // iPhone-específico: Activar siempre en iPhone para prevenir crashes
    const isIPhone = /iPhone/.test(navigator.userAgent) && !(window as any).MSStream
    
    // Activar en versiones problemáticas O en cualquier iPhone
    if (info.isProblemVersion || isIPhone) {
      setIsActive(true)
      const reason = isIPhone ? 'iPhone device detected' : 'Problem iOS version'
      addLog('info', `iOS Debug Logger activated for ${info.deviceModel} iOS ${info.version} (${reason})`)
    }
    
    // Manual activation for testing (check URL parameter or localStorage)
    const urlParams = new URLSearchParams(window.location.search)
    const manualActivation = urlParams.get('ios-debug') === 'true' || 
                           localStorage.getItem('ios-debug-manual') === 'true'
    
    if (manualActivation && !info.isProblemVersion) {
      setIsActive(true)
      setIOSInfo({
        isIOS: true,
        version: 'Simulated iOS 16.7',
        isProblemVersion: true,
        deviceModel: 'iPhone 15 Pro (Simulated)'
      })
      addLog('info', `iOS Debug Logger MANUALLY activated for testing`)
      console.log('🧪 MANUAL iOS DEBUG MODE - Add ?ios-debug=true to URL or run localStorage.setItem("ios-debug-manual", "true")')
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
    
    logsRef.current = [...logsRef.current.slice(-100), entry] // Keep last 100 logs
    setLogs([...logsRef.current])
    
    // ============================================================================
    // ROBUST LOGGING FOR USB-C SAFARI WEB INSPECTOR ACCESS
    // ============================================================================
    
    // 1. Enhanced Console Logging - Visible in Safari Web Inspector
    const timestamp = new Date(entry.timestamp).toISOString()
    const componentStr = component ? `[${component}] ` : ''
    const emoji = {
      'error': '🔴',
      'warning': '🟡', 
      'info': '🔵',
      'dom': '🟢',
      'memory': '🟣',
      'performance': '🟠'
    }[type] || '⚪'
    
    const logMessage = `${emoji} iOS-DEBUG ${timestamp} [${type.toUpperCase()}] ${componentStr}${message}`
    
    // Use appropriate console method for visibility
    switch(type) {
      case 'error':
        console.error(logMessage, details || '', stack ? `\nStack: ${stack}` : '')
        break
      case 'warning':
        console.warn(logMessage, details || '')
        break
      default:
        console.log(logMessage, details || '')
    }
    
    // 2. Persist to localStorage (survives crashes/reloads)
    try {
      const existingLogs = localStorage.getItem('ios-debug-logs')
      const logHistory: LogEntry[] = existingLogs ? JSON.parse(existingLogs) : []
      const updatedHistory = [...logHistory.slice(-200), entry] // Keep last 200 in storage
      localStorage.setItem('ios-debug-logs', JSON.stringify(updatedHistory))
      
      // Also store a formatted version for easy access
      const formattedLog = `${timestamp} [${type.toUpperCase()}] ${componentStr}${message}${details ? `\nDetails: ${JSON.stringify(details, null, 2)}` : ''}${stack ? `\nStack: ${stack}` : ''}`
      const existingFormatted = localStorage.getItem('ios-debug-formatted') || ''
      const newFormatted = existingFormatted + '\n' + formattedLog
      // Keep only last 50KB of formatted logs to avoid storage limits
      const trimmedFormatted = newFormatted.slice(-50000)
      localStorage.setItem('ios-debug-formatted', trimmedFormatted)
    } catch (e) {
      console.error('🔴 iOS-DEBUG: Failed to persist logs to localStorage', e)
    }
    
    // 3. Network logging (if endpoint available)
    try {
      fetch('/api/ios-debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entry,
          userAgent: navigator.userAgent,
          url: window.location.href,
          devicePixelRatio: window.devicePixelRatio,
          screenSize: `${window.screen.width}x${window.screen.height}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`
        })
      }).catch(() => {
        // Silent fail - endpoint might not exist
      })
    } catch (e) {
      // Silent fail
    }
    
    // Auto-show overlay on critical conditions (if not already crashed)
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
        try {
          setIsVisible(true)
          // Don't call addLog here to avoid recursion
        } catch (e) {
          console.error('🔴 iOS-DEBUG: Failed to show overlay after critical errors', e)
        }
      }
    }
  }

  // Global error handlers
  useEffect(() => {
    if (!isActive) return

    const handleError = (event: ErrorEvent) => {
      addLog('error', `JavaScript Error: ${event.message}`, event.error?.stack, undefined, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
      
      // Critical errors that often precede crashes
      if (event.message.includes('DOM') || 
          event.message.includes('transform') || 
          event.message.includes('height') ||
          event.message.includes('overflow') ||
          event.message.includes('Cannot read property') ||
          event.message.includes('Cannot set property') ||
          event.message.includes('null') ||
          event.message.includes('undefined')) {
        
        addLog('warning', '🚨 CRITICAL ERROR DETECTED - Potential crash imminent', undefined, 'ErrorHandler', {
          errorMessage: event.message,
          location: `${event.filename}:${event.lineno}:${event.colno}`,
          stackTrace: event.error?.stack,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          memoryInfo: (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
          } : 'not available'
        })
        
        try {
          setIsVisible(true)
        } catch (e) {
          console.error('🔴 Failed to show overlay after critical error')
        }
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
      
      // iPhone-específico: Forzar garbage collection agresivo
      const isIPhone = /iPhone/.test(navigator.userAgent) && !(window as any).MSStream
      if (isIPhone) {
        addLog('memory', 'iPhone: Triggering aggressive memory cleanup', 'MemoryManager')
        
        // Limpiar caches de imágenes
        setTimeout(() => {
          const images = document.querySelectorAll('img')
          let cleanedCount = 0
          images.forEach((img) => {
            if (!img.getBoundingClientRect().width) {
              img.src = ''
              cleanedCount++
            }
          })
          addLog('memory', `iPhone: Cleaned ${cleanedCount} invisible images`, 'MemoryManager')
        }, 100)
        
        // Pausar carouseles no visibles
        setTimeout(() => {
          const carousels = document.querySelectorAll('[data-carousel-active="false"]')
          addLog('memory', `iPhone: Found ${carousels.length} inactive carousels for pause`, 'MemoryManager')
        }, 200)
      }
    }

    // iPhone-específico: Performance monitoring más agresivo
    let observer: PerformanceObserver | null = null
    const isIPhone = /iPhone/.test(navigator.userAgent) && !(window as any).MSStream
    
    if ('PerformanceObserver' in window) {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          // iPhone: Umbral más bajo para detectar problemas antes
          const threshold = isIPhone ? 30 : 50
          
          if (entry.duration > threshold) {
            performanceIssuesRef.current++
            addLog('performance', `⏱️ Long task detected: ${entry.duration.toFixed(2)}ms${isIPhone ? ' (iPhone threshold)' : ''}`, undefined, entry.name, {
              duration: entry.duration,
              startTime: entry.startTime,
              isIPhone
            })
            
            // iPhone: Mostrar overlay más pronto
            const alertThreshold = isIPhone ? 3 : 5
            if (performanceIssuesRef.current >= alertThreshold) {
              setIsVisible(true)
              addLog('warning', `🐌 Performance degradation detected (${performanceIssuesRef.current} issues)${isIPhone ? ' - iPhone critical' : ''}`)
              
              // iPhone: Memory pressure check automático
              if (isIPhone && (performance as any).memory) {
                const memInfo = (performance as any).memory
                const memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit
                if (memoryUsage > 0.8) {
                  addLog('memory', `iPhone: Critical memory usage: ${(memoryUsage * 100).toFixed(1)}%`, undefined, 'MemoryMonitor', {
                    usedJSHeapSize: memInfo.usedJSHeapSize,
                    jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
                    totalJSHeapSize: memInfo.totalJSHeapSize
                  })
                  handleMemoryWarning()
                }
              }
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
    
    // iPhone-específico: Memory monitoring periódico
    let memoryMonitor: NodeJS.Timeout | null = null
    if (isIPhone && (performance as any).memory) {
      memoryMonitor = setInterval(() => {
        try {
          const memInfo = (performance as any).memory
          const memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit
          
          if (memoryUsage > 0.7) {
            addLog('memory', `iPhone: High memory usage: ${(memoryUsage * 100).toFixed(1)}%`, 'MemoryMonitor')
          }
          
          if (memoryUsage > 0.9) {
            addLog('memory', 'iPhone: CRITICAL memory usage - triggering cleanup', 'MemoryMonitor')
            handleMemoryWarning()
          }
        } catch (e) {
          // Ignore memory API errors
        }
      }, 5000) // Check every 5 seconds on iPhone
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
      if (memoryMonitor) clearInterval(memoryMonitor)
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

  // iPhone-específico: Funciones de emergency cleanup
  const triggerIPhoneEmergencyCleanup = () => {
    const isIPhone = /iPhone/.test(navigator.userAgent) && !(window as any).MSStream
    if (!isIPhone) return
    
    addLog('memory', 'iPhone: EMERGENCY CLEANUP TRIGGERED', 'EmergencyCleanup')
    
    // Pausar todos los carouseles
    const carouselElements = document.querySelectorAll('[data-experience-id]')
    carouselElements.forEach((el) => {
      (el as HTMLElement).style.animationPlayState = 'paused'
    })
    
    // Eliminar transform-gpu de elementos no críticos
    const gpuElements = document.querySelectorAll('.transform-gpu')
    gpuElements.forEach((el) => {
      el.classList.remove('transform-gpu')
      el.classList.add('emergency-cleanup')
    })
    
    // Reducir calidad de video
    const videos = document.querySelectorAll('video')
    videos.forEach((video) => {
      video.pause()
      if (video.src && !video.src.includes('preview')) {
        video.preload = 'none'
      }
    })
    
    addLog('memory', `iPhone: Emergency cleanup completed - paused ${carouselElements.length} carousels, ${gpuElements.length} GPU elements, ${videos.length} videos`, 'EmergencyCleanup')
  }

  // Expose comprehensive debug functions to window for external components and console access
  useEffect(() => {
    if (isActive) {
      (window as any).__iOSDebugLogger = {
        addLog,
        show: () => setIsVisible(true),
        hide: () => setIsVisible(false),
        isActive: true,
        
        // iPhone-específico: Función de emergency cleanup
        triggerEmergencyCleanup: triggerIPhoneEmergencyCleanup,
        
        // Console-accessible functions for USB debugging
        getLogs: () => {
          try {
            const stored = localStorage.getItem('ios-debug-logs')
            return stored ? JSON.parse(stored) : []
          } catch (e) {
            console.error('Failed to retrieve logs:', e)
            return []
          }
        },
        
        getFormattedLogs: () => {
          try {
            return localStorage.getItem('ios-debug-formatted') || 'No logs found'
          } catch (e) {
            console.error('Failed to retrieve formatted logs:', e)
            return 'Error retrieving logs'
          }
        },
        
        exportLogs: () => {
          try {
            const logs = (window as any).__iOSDebugLogger.getLogs()
            const deviceInfo = {
              userAgent: navigator.userAgent,
              url: window.location.href,
              devicePixelRatio: window.devicePixelRatio,
              screenSize: `${window.screen.width}x${window.screen.height}`,
              viewportSize: `${window.innerWidth}x${window.innerHeight}`,
              timestamp: new Date().toISOString()
            }
            
            const fullReport = {
              deviceInfo,
              logs,
              formatted: (window as any).__iOSDebugLogger.getFormattedLogs()
            }
            
            console.log('📋 iOS DEBUG FULL EXPORT:')
            console.log(JSON.stringify(fullReport, null, 2))
            
            return fullReport
          } catch (e) {
            console.error('Failed to export logs:', e)
            return null
          }
        },
        
        clearLogs: () => {
          try {
            localStorage.removeItem('ios-debug-logs')
            localStorage.removeItem('ios-debug-formatted')
            setLogs([])
            logsRef.current = []
            console.log('🗑️ iOS DEBUG: All logs cleared')
          } catch (e) {
            console.error('Failed to clear logs:', e)
          }
        },
        
        // Quick access functions
        printLogs: () => {
          const formatted = (window as any).__iOSDebugLogger.getFormattedLogs()
          console.log('📱 iOS DEBUG FORMATTED LOGS:\n' + formatted)
        },
        
        getErrorCount: () => errorCountRef.current,
        getPerformanceIssues: () => performanceIssuesRef.current,
        
        // iPhone-específico: Funciones de diagnóstico
        checkMemoryUsage: () => {
          if ((performance as any).memory) {
            const memInfo = (performance as any).memory
            const usage = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit * 100).toFixed(1)
            console.log(`📱 iPhone Memory Usage: ${usage}%`)
            return {
              usage: parseFloat(usage),
              usedJSHeapSize: memInfo.usedJSHeapSize,
              jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
              totalJSHeapSize: memInfo.totalJSHeapSize
            }
          }
          return null
        },
        
        emergencyCleanup: triggerIPhoneEmergencyCleanup
      }
      
      // Global console shortcuts
      ;(window as any).iOSDebug = (window as any).__iOSDebugLogger
      
      // Auto-print instructions for debugging
      const isIPhone = /iPhone/.test(navigator.userAgent) && !(window as any).MSStream
      
      console.log(`
🚨 iOS DEBUG LOGGER ACTIVE
========================
Device: ${iosInfo?.deviceModel} - iOS ${iosInfo?.version}${isIPhone ? ' (iPhone Detected)' : ''}

DEBUGGING COMMANDS:
iOSDebug.printLogs()         - Print all logs to console
iOSDebug.exportLogs()        - Export full report  
iOSDebug.getLogs()           - Get raw logs array
iOSDebug.clearLogs()         - Clear all logs
${isIPhone ? `
🍎 iPhone-SPECIFIC COMMANDS:
iOSDebug.checkMemoryUsage()  - Check current memory usage
iOSDebug.emergencyCleanup()  - Trigger emergency performance cleanup
` : ''}
WATCH FOR: Logs with emoji 🔴🟡 before crash
CRITICAL: Look for "About to hide overlay - CRITICAL POINT"
`)
    }

    return () => {
      delete (window as any).__iOSDebugLogger
      delete (window as any).iOSDebug
    }
  }, [isActive, iosInfo])
  
  // Global activation function (always available)
  useEffect(() => {
    ;(window as any).activateIOSDebug = () => {
      localStorage.setItem('ios-debug-manual', 'true')
      window.location.reload()
    }
    
    ;(window as any).deactivateIOSDebug = () => {
      localStorage.removeItem('ios-debug-manual')
      localStorage.removeItem('ios-debug-logs')
      localStorage.removeItem('ios-debug-formatted')
      console.log('🗑️ iOS Debug deactivated and logs cleared')
    }
    
    // Instructions for manual activation (always shown)
    if (!isActive) {
      console.log(`
🧪 iOS DEBUG - MANUAL ACTIVATION AVAILABLE
==========================================
To activate iOS debugging on any device:

METHOD 1 - URL Parameter:
Add ?ios-debug=true to current URL

METHOD 2 - Console Command:  
activateIOSDebug()

METHOD 3 - Direct localStorage:
localStorage.setItem('ios-debug-manual', 'true')
window.location.reload()

To deactivate:
deactivateIOSDebug()
`)
    }

    return () => {
      delete (window as any).activateIOSDebug  
      delete (window as any).deactivateIOSDebug
    }
  }, [isActive])

  if (!isActive) {
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
        <div>{iosInfo?.deviceModel} - iOS {iosInfo?.version}</div>
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
