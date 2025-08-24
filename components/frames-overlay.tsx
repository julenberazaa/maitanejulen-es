"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { OVERLAY_FRAMES } from "@/lib/frame-config"
import { iOSDebugLog } from './ios-debug-logger'

// Base design width - same as the #fixed-layout element
const BASE_DESIGN_WIDTH = 1920

export default function FramesOverlay(): React.JSX.Element | null {
  // iPhone: Completely disable frames overlay to prevent complexity and crashes
  const isIPhone = typeof window !== 'undefined' && /iPhone/.test(navigator.userAgent) && !(window as any).MSStream
  
  if (isIPhone) {
    iOSDebugLog('info', 'iPhone detected: FramesOverlay completely disabled', 'FramesOverlay')
    return null
  }
  const [isMobile, setIsMobile] = useState(false)
  const [containerHeight, setContainerHeight] = useState('100%')
  const [visibleFrameIds, setVisibleFrameIds] = useState<Set<string>>(new Set())
  const [retryCounts, setRetryCounts] = useState<Record<string, number>>({})
  const [prefetchedIds, setPrefetchedIds] = useState<Set<string>>(new Set())
  const [enableFrameLoading, setEnableFrameLoading] = useState(false)
  const [slowConnection, setSlowConnection] = useState(false)
  const prefetchTimersRef = useRef<Record<string, number>>({})
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isIPhone, setIsIPhone] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    // Detección de iOS + iPhone específico
    const checkIOS = () => {
      const userAgent = navigator.userAgent
      const iOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
      const iPhone = (window as any).__isIPhone || (/iPhone/.test(userAgent) && !(window as any).MSStream)
      
      setIsIOS(iOS)
      setIsIPhone(iPhone)
      
      if (iPhone) {
        iOSDebugLog('info', 'FramesOverlay: iPhone detected - will use native scroll system', 'FramesOverlay')
      }
    }
    
    checkMobile()
    checkIOS()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Detect slow connection and delay frame loading, but only after FixedZoom signals ready
  useEffect(() => {
    // Check connection speed
    const connection = (navigator as any)?.connection
    const isSlowConnection = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' ||
      connection.downlink < 1.5
    )
    setSlowConnection(isSlowConnection)

    // iPhone: Delay ultra-conservador para evitar conflictos con FixedZoom
    let delay = 100
    if (isIPhone) {
      delay = 3000  // iPhone: Delay muy largo para que FixedZoom complete
      iOSDebugLog('info', `FramesOverlay detected iPhone - using ${delay}ms delay to avoid FixedZoom conflicts`, 'FramesOverlay')
    } else if (isIOS) {
      delay = 2000  // iPad: delay moderado
    } else if (isSlowConnection) {
      delay = 1200
    } else if (isMobile) {
      delay = 400
    }
    let cleanupFns: Array<() => void> = []
    
    // Also wait for user interaction to ensure critical content loads first
    let hasUserInteracted = false
    // iPhone: Semáforo para prevenir doble ejecución (causa de long tasks de 10s+)
    let iPhoneFrameLoadingInitiated = false
    const enableOnInteraction = () => {
      hasUserInteracted = true
      // iPhone: Requerir interacción Y esperar a que FixedZoom complete
      if (isIPhone) {
        // CRITICAL FIX: Prevenir múltiple ejecución en iPhone
        if (iPhoneFrameLoadingInitiated) {
          iOSDebugLog('info', 'iPhone: Frame loading already initiated - skipping duplicate execution', 'FramesOverlay')
          return
        }
        iPhoneFrameLoadingInitiated = true
        const waitForFixedZoom = () => {
          if ((window as any).__iPhoneFixedZoomComplete) {
            setTimeout(() => {
              setEnableFrameLoading(true)
              iOSDebugLog('info', 'iPhone: Frame loading enabled after FixedZoom completion + user interaction', 'FramesOverlay')
            }, 1000) // Delay adicional para iPhone
          } else {
            // Esperar a que FixedZoom complete
            setTimeout(waitForFixedZoom, 200)
          }
        }
        iOSDebugLog('info', 'iPhone: User interaction detected - waiting for FixedZoom completion', 'FramesOverlay')
        waitForFixedZoom()
      } else if (isIOS) {
        iOSDebugLog('info', 'iPad user interaction detected - enabling frame loading with 500ms delay', 'FramesOverlay')
        setTimeout(() => {
          setEnableFrameLoading(true)
          iOSDebugLog('info', 'iPad frame loading enabled after user interaction', 'FramesOverlay')
        }, 500)
      } else if (!isSlowConnection || hasUserInteracted) {
        setEnableFrameLoading(true)
      }
    }
    
    // Listen for any user interaction
    const events = ['scroll', 'touchstart', 'click', 'keydown']
    events.forEach(event => {
      window.addEventListener(event, enableOnInteraction, { once: true, passive: true })
    })
    cleanupFns.push(() => events.forEach(event => window.removeEventListener(event, enableOnInteraction)))
    
    const enableAfterDelay = () => {
      const t = setTimeout(() => {
        setEnableFrameLoading(true)
      }, delay)
      cleanupFns.push(() => clearTimeout(t))
    }

    // If FixedZoom already signaled ready, proceed; else wait for the event
    if ((window as any).__fixedZoomReady) {
      enableAfterDelay()
    } else {
      const onReady = () => {
        enableAfterDelay()
      }
      window.addEventListener('fixed-zoom-ready', onReady, { once: true })
      cleanupFns.push(() => window.removeEventListener('fixed-zoom-ready', onReady))
      // Safety fallback: if event never fires, still proceed after a max timeout
      const safety = setTimeout(() => {
        enableAfterDelay()
      }, 2500)
      cleanupFns.push(() => clearTimeout(safety))
    }

    return () => {
      cleanupFns.forEach(fn => { try { fn() } catch {} })
    }
  }, [isMobile])

  // Detect WebP support at runtime
  useEffect(() => {
    let cancelled = false
    const testImg = new Image()
    testImg.onload = () => { if (!cancelled) setWebpSupported(true) }
    testImg.onerror = () => { if (!cancelled) setWebpSupported(false) }
    // 1x1 webp data URI
    testImg.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBgAAAAwAQCdASoEAAQAAVAfCWkAQUxQAA=="
    return () => { cancelled = true }
  }, [])

  // Virtualize frame rendering on mobile: only render frames near viewport
  useEffect(() => {
    if (!enableFrameLoading) {
      console.log(`[FRAMES] Frame loading not enabled yet`)
      return
    }

    console.log(`[FRAMES] Initializing frame loading, isMobile: ${isMobile}`)

    if (!isMobile) {
      // Render all frames on desktop
      const allFrameIds = OVERLAY_FRAMES.filter(f => f.visible !== false).map(f => f.id)
      console.log(`[FRAMES] Desktop - rendering all frames:`, allFrameIds)
      setVisibleFrameIds(new Set(allFrameIds))
      // Prefetch all frames (sequentially via loop, with retry)
      OVERLAY_FRAMES.forEach((f) => ensurePrefetch(f.id, f.src))
      return
    }

    // ORIGINAL virtualization code (adjusted for fixed-layout scale and custom scroller)
    const PRELOAD_MARGIN = 1200 // px before/after viewport

    const getFixedLayoutScale = (): number => {
      const el = document.getElementById('fixed-layout')
      if (!el) return 1
      const style = window.getComputedStyle(el)
      const t = style.transform
      if (t && t !== 'none') {
        const m = t.match(/matrix\(([^)]+)\)/)
        if (m && m[1]) {
          const parts = m[1].split(',').map(v => parseFloat(v.trim()))
          if (!Number.isNaN(parts[0])) return parts[0]
        }
      }
      return 1
    }

    const scroller = document.getElementById('scroll-root')

    const updateVisible = () => {
      // iPhone: Usar scroll nativo del documento
      let currentScrollTop: number
      let viewportHeight: number
      
      if (isIPhone) {
        // iPhone: Solo window scroll nativo
        currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0
        viewportHeight = window.innerHeight || 0
        iOSDebugLog('performance', `iPhone scroll update: ${currentScrollTop}px`, 'FramesOverlay')
      } else {
        // Otros dispositivos: lógica original
        currentScrollTop = scroller ? scroller.scrollTop : (window.scrollY || document.documentElement.scrollTop || 0)
        viewportHeight = scroller ? scroller.clientHeight : (window.innerHeight || 0)
      }
      
      const scale = getFixedLayoutScale()
      const next = new Set<string>()
      const toPrefetchIds: string[] = []
      
      for (const frame of OVERLAY_FRAMES) {
        if (frame.visible === false) continue
        const finalY = (frame.y ?? 0) + (frame.mobileOffsetY ?? 0)
        const cssY = finalY * scale
        
        if (cssY >= currentScrollTop - PRELOAD_MARGIN && cssY <= currentScrollTop + viewportHeight + PRELOAD_MARGIN) {
          next.add(frame.id)
          toPrefetchIds.push(frame.id)
        }
      }
      
      setVisibleFrameIds(next)
      
      // Kick off prefetch for candidates
      for (const id of toPrefetchIds) {
        const frame = OVERLAY_FRAMES.find(f => f.id === id)
        if (frame) ensurePrefetch(frame.id, frame.src)
      }
    }

    updateVisible()
    
    // iPhone: Solo usar window scroll eventos
    if (isIPhone) {
      window.addEventListener('scroll', updateVisible, { passive: true })
      window.addEventListener('resize', updateVisible)
      
      // iPhone: Menos timers para reducir overhead
      const timers = [500, 1500].map(ms => setTimeout(updateVisible, ms))
      
      return () => {
        window.removeEventListener('scroll', updateVisible)
        window.removeEventListener('resize', updateVisible)
        timers.forEach(clearTimeout)
      }
    } else {
      // Otros dispositivos: lógica original
      if (scroller) scroller.addEventListener('scroll', updateVisible, { passive: true })
      else window.addEventListener('scroll', updateVisible, { passive: true })
      window.addEventListener('resize', updateVisible)
      const timers = [50, 200, 600].map(ms => setTimeout(updateVisible, ms))
      
      return () => {
        if (scroller) scroller.removeEventListener('scroll', updateVisible)
        else window.removeEventListener('scroll', updateVisible)
        window.removeEventListener('resize', updateVisible)
        timers.forEach(clearTimeout)
      }
    }
  }, [isMobile, enableFrameLoading, isIPhone])

  // Cleanup any scheduled prefetch timers on unmount
  useEffect(() => {
    return () => {
      const timers = prefetchTimersRef.current
      Object.values(timers).forEach((t) => clearTimeout(t))
      prefetchTimersRef.current = {}
    }
  }, [])

  // iPhone: Mínimos retries para evitar saturación
  const MAX_RETRIES = isIPhone ? 1 : (isIOS ? 2 : (isMobile ? 4 : 3))

  const getOptimizedSrc = (src: string, forMobile: boolean = isMobile): string => {
    if (!src.endsWith('.png')) return src
    const webpSrc = src.replace('.png', '.webp')
    // Prefer WebP when supported; otherwise use PNG directly
    if (forMobile) {
      if (webpSupported === false) return src
      return webpSrc
    }
    // Desktop: prefer webp
    return webpSrc
  }

  const ensurePrefetch = (id: string, src: string) => {
    if (prefetchedIds.has(id)) return
    // Avoid starting multiple timers for same id
    if (prefetchTimersRef.current[id]) return
    const attempts = retryCounts[id] ?? 0
    if (attempts >= MAX_RETRIES) return

    const start = () => {
      const optimizedSrc = getOptimizedSrc(src, isMobile)
      // Aggressive cache busting for mobile WebP
      const cacheBustSrc = attempts > 0 ? `${optimizedSrc}?retry=${attempts}&t=${Date.now()}` : optimizedSrc
      const img = new Image()
      img.decoding = 'async' as any
      img.loading = 'eager' as any
      
      const onLoad = () => {
        console.log(`[FRAMES] Successfully loaded: ${cacheBustSrc}`)
        setPrefetchedIds((prev) => new Set(prev).add(id))
        delete prefetchTimersRef.current[id]
      }
      
      const onError = () => {
        console.warn(`[FRAMES] Failed to load: ${cacheBustSrc}`)
        iOSDebugLog('error', `Frame image failed to load: ${id}`, 'FramesOverlay', {
          src: cacheBustSrc,
          attempts,
          webpSupported
        })
        
        // If mobile without WebP support, don't loop: try PNG immediately
        if (isMobile && webpSupported === false) {
          const fallbackImg = new Image()
          fallbackImg.src = src
          fallbackImg.onload = onLoad
          fallbackImg.onerror = scheduleRetry
          return
        }
        // If desktop or mobile with support: after first failure of WebP, try PNG fallback once
        if (optimizedSrc !== src && attempts === 0) {
          const fallbackImg = new Image()
          fallbackImg.src = src
          fallbackImg.onload = onLoad
          fallbackImg.onerror = scheduleRetry
          return
        }
        scheduleRetry()
      }
      
      img.addEventListener('load', onLoad, { once: true })
      img.addEventListener('error', onError, { once: true })
      img.src = cacheBustSrc
    }

    const scheduleRetry = () => {
      const nextAttempt = (retryCounts[id] ?? 0) + 1
      if (nextAttempt > MAX_RETRIES) {
        console.error(`[FRAMES] Max retries reached for ${id}, giving up`)
        delete prefetchTimersRef.current[id]
        return
      }
      setRetryCounts((prev) => ({ ...prev, [id]: nextAttempt }))
      // iPhone: Backoff ultra-conservador para evitar saturación
      let backoff: number
      if (isIPhone) {
        backoff = Math.min(5000 * nextAttempt, 10000) // iPhone: Muy lento
      } else if (isIOS) {
        backoff = Math.min(3000 * nextAttempt, 8000)  // iPad: Moderado
      } else {
        backoff = isMobile ? Math.min(1500 * nextAttempt, 4000) : Math.min(2000 * nextAttempt, 6000)
      }
      console.log(`[FRAMES] Scheduling retry ${nextAttempt}/${MAX_RETRIES} for ${id} in ${backoff}ms`)
      const timer = window.setTimeout(() => {
        delete prefetchTimersRef.current[id]
        ensurePrefetch(id, src)
      }, backoff)
      prefetchTimersRef.current[id] = timer
    }

    // Start immediately
    start()
  }

  const getSrcForRender = (id: string, src: string): string => {
    const attempts = retryCounts[id] ?? 0
    const optimizedSrc = getOptimizedSrc(src, isMobile)
    // Enhanced cache busting for mobile
    if (attempts > 0) {
      return isMobile 
        ? `${optimizedSrc}?mobile=1&rt=${attempts}&t=${Date.now()}`
        : `${optimizedSrc}?rt=${attempts}`
    }
    return isMobile ? `${optimizedSrc}?mobile=1` : optimizedSrc
  }

  // Calcular altura del contenedor en espacio de diseño (dividir por escala de #fixed-layout)
  useEffect(() => {
    const getFixedLayoutScale = (): number => {
      const el = document.getElementById('fixed-layout')
      if (!el) return 1
      const style = window.getComputedStyle(el)
      const t = style.transform
      if (t && t !== 'none') {
        const m = t.match(/matrix\(([^)]+)\)/)
        if (m && m[1]) {
          const parts = m[1].split(',').map(v => parseFloat(v.trim()))
          if (!Number.isNaN(parts[0])) return parts[0]
        }
      }
      return 1
    }

    const updateContainerHeight = () => {
      const wrapper = document.getElementById('fixed-layout-wrapper') as HTMLElement | null
      const totalHeight = wrapper ? wrapper.offsetHeight : (document.documentElement.scrollHeight || 0)
      const scale = getFixedLayoutScale()
      const designSpaceHeight = scale > 0 ? Math.ceil(totalHeight / scale) : totalHeight
      setContainerHeight(`${designSpaceHeight}px`)
    }

    updateContainerHeight()

    const onResize = () => updateContainerHeight()
    const onOrientationChange = () => setTimeout(updateContainerHeight, 100)
    const onLoad = () => updateContainerHeight()

    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('orientationchange', onOrientationChange)
    window.addEventListener('load', onLoad)

    const mutationObserver = new MutationObserver(() => {
      updateContainerHeight()
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: false })

    // iPhone: Mínimos timers para reducir overhead
    let timerDelays: number[]
    if (isIPhone) {
      timerDelays = [1000, 3000] // iPhone: Solo 2 timers
    } else if (isIOS) {
      timerDelays = [200, 1000, 3000] // iPad: Moderado
    } else {
      timerDelays = [50, 200, 600, 1200, 2000] // Desktop/Android: Completo
    }
    const timers = timerDelays.map(ms => setTimeout(updateContainerHeight, ms))

    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrientationChange)
      window.removeEventListener('load', onLoad)
      mutationObserver.disconnect()
    }
  }, [])
  return (
    <div
      id="frames-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${BASE_DESIGN_WIDTH}px`, // Same as #fixed-layout base width
        height: containerHeight, // Altura acorde a documento
        maxHeight: containerHeight,
        overflow: 'hidden', // Evita que frames absolutos alarguen el scroll por debajo del video
        overflowY: 'hidden', // Bloquear scroll vertical dentro del overlay
        overscrollBehavior: 'none', // Evita elastic scroll
        // Ocultar cualquier scrollbar nativo en navegadores que lo muestren
        // @ts-ignore
        msOverflowStyle: 'none',
        // @ts-ignore
        scrollbarWidth: 'none',
        pointerEvents: "none",
        zIndex: 50,
        // No transform: el layout de la página se encarga de la adaptación responsiva
      }}
    >
      {enableFrameLoading ? OVERLAY_FRAMES.filter((f) => f.visible !== false && (visibleFrameIds.has(f.id))).map((frame) => {
        const { id, src, fit = 'contain', x = 0, y = 0, width, height, scaleX = 1, scaleY = 1, mobileOffsetY = 0 } = frame

        // Position relative to the center of the base design (1920px width)
        const baseCenterX = BASE_DESIGN_WIDTH / 2
        
        // Apply mobile vertical offset if on mobile
        const finalY = isMobile ? y + mobileOffsetY : y
        
        // Direct coordinates in the base design space (no scaling calculations needed)
        const transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`
        const style: React.CSSProperties = {
          position: "absolute",
          left: `${baseCenterX + x}px`, // Center + offset in base design space
          top: `${finalY}px`, // Y coordinate with mobile adjustment
          transform,
          objectFit: fit as any,
          borderRadius: 12,
          pointerEvents: "none",
        }

        // Direct dimensions in base design space
        if (typeof width === "number") style.width = `${width}px`
        if (typeof height === "number") style.height = `${height}px`

        const isNearViewport = visibleFrameIds.has(id)
        const renderSrc = getSrcForRender(id, src)
        const handleImgError: React.ReactEventHandler<HTMLImageElement> = (e) => {
          const img = e.currentTarget
          const currentSrc = img.src
          
          console.warn(`[FRAMES] Image error for ${id}: ${currentSrc}`)
          
          if (isMobile) {
            // MOBILE: If no WebP support, switch to PNG immediately
            if (webpSupported === false) {
              img.src = src
              return
            }
            // Otherwise retry with cache-buster; if repeated, PNG fallback will be attempted upstream
            setRetryCounts((prev) => {
              const prevAttempts = prev[id] ?? 0
              if (prevAttempts >= MAX_RETRIES) {
                console.error(`[FRAMES] Mobile - giving up on ${id} after ${MAX_RETRIES} attempts`)
                return prev
              }
              const next = { ...prev, [id]: prevAttempts + 1 }
              return next
            })
            // Force reload with new cache-buster
            setTimeout(() => {
              img.src = getSrcForRender(id, src)
            }, 500)
          } else {
            // DESKTOP: Allow PNG fallback only once
            if (currentSrc.includes('.webp') && !currentSrc.includes('?rt=')) {
              console.log(`[FRAMES] Desktop - WebP failed for ${id}, trying PNG fallback`)
              img.src = src // Use original PNG
              return
            }
            
            console.warn(`[FRAMES] Desktop - frame loading failed after fallback: ${id}`)
            setRetryCounts((prev) => {
              const prevAttempts = prev[id] ?? 0
              if (prevAttempts >= MAX_RETRIES) return prev
              const next = { ...prev, [id]: prevAttempts + 1 }
              return next
            })
          }
          
          // Background prefetch retry for both mobile and desktop
          ensurePrefetch(id, src)
        }

        return (
          <img
            key={id}
            id={`overlay-${id}`}
            src={renderSrc}
            alt=""
            style={style}
            decoding="async"
            fetchPriority={isNearViewport ? 'high' : (isMobile ? 'low' : 'auto')}
            onError={handleImgError}
          />
        )
      }) : null}
      <style jsx>{`
        #frames-overlay::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}