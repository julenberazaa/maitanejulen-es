"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { OVERLAY_FRAMES } from "@/lib/frame-config"

// Base design width - same as the #fixed-layout element
const BASE_DESIGN_WIDTH = 1920

export default function FramesOverlay(): React.JSX.Element | null {
  const [isMobile, setIsMobile] = useState(false)
  const [containerHeight, setContainerHeight] = useState('100%')
  const [visibleFrameIds, setVisibleFrameIds] = useState<Set<string>>(new Set())
  const [retryCounts, setRetryCounts] = useState<Record<string, number>>({})
  const [prefetchedIds, setPrefetchedIds] = useState<Set<string>>(new Set())
  const [enableFrameLoading, setEnableFrameLoading] = useState(false)
  const [slowConnection, setSlowConnection] = useState(false)
  const prefetchTimersRef = useRef<Record<string, number>>({})

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Detect slow connection and delay frame loading
  useEffect(() => {
    // Check connection speed
    const connection = (navigator as any)?.connection
    const isSlowConnection = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' ||
      connection.downlink < 1.5
    )
    setSlowConnection(isSlowConnection)

    // DEBUG: Aggressive delay reduction for testing
    const delay = isSlowConnection ? 3000 : (isMobile ? 1000 : 200)
    
    // Also wait for user interaction to ensure critical content loads first
    let hasUserInteracted = false
    const enableOnInteraction = () => {
      hasUserInteracted = true
      if (!isSlowConnection || hasUserInteracted) {
        setEnableFrameLoading(true)
      }
    }
    
    // Listen for any user interaction
    const events = ['scroll', 'touchstart', 'click', 'keydown']
    events.forEach(event => {
      window.addEventListener(event, enableOnInteraction, { once: true, passive: true })
    })
    
    const timer = setTimeout(() => {
      console.log(`[FRAMES] Enabling frame loading after ${delay}ms delay`)
      setEnableFrameLoading(true)
    }, delay)

    return () => {
      clearTimeout(timer)
      events.forEach(event => {
        window.removeEventListener(event, enableOnInteraction)
      })
    }
  }, [isMobile])

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

    // DEBUG: For now, render ALL frames on mobile to test if virtualization is the issue
    console.log(`[FRAMES] Mobile - rendering ALL frames for debugging`)
    const allFrameIds = OVERLAY_FRAMES.filter(f => f.visible !== false).map(f => f.id)
    setVisibleFrameIds(new Set(allFrameIds))
    OVERLAY_FRAMES.forEach((f) => ensurePrefetch(f.id, f.src))
    return

    // ORIGINAL virtualization code (commented for testing)
    const PRELOAD_MARGIN = 1200 // px before/after viewport

    const updateVisible = () => {
      const currentScrollTop = window.scrollY || document.documentElement.scrollTop || 0
      const viewportHeight = window.innerHeight || 0
      const next = new Set<string>()
      const toPrefetchIds: string[] = []
      for (const frame of OVERLAY_FRAMES) {
        if (frame.visible === false) continue
        const finalY = (frame.y ?? 0) + (frame.mobileOffsetY ?? 0)
        if (finalY >= currentScrollTop - PRELOAD_MARGIN && finalY <= currentScrollTop + viewportHeight + PRELOAD_MARGIN) {
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
    window.addEventListener('scroll', updateVisible, { passive: true })
    window.addEventListener('resize', updateVisible)
    const timers = [50, 200, 600].map(ms => setTimeout(updateVisible, ms))
    return () => {
      window.removeEventListener('scroll', updateVisible)
      window.removeEventListener('resize', updateVisible)
      timers.forEach(clearTimeout)
    }
  }, [isMobile, enableFrameLoading])

  // Cleanup any scheduled prefetch timers on unmount
  useEffect(() => {
    return () => {
      const timers = prefetchTimersRef.current
      Object.values(timers).forEach((t) => clearTimeout(t))
      prefetchTimersRef.current = {}
    }
  }, [])

  const MAX_RETRIES = isMobile ? 5 : 3  // More retries for mobile WebP-only strategy

  const getOptimizedSrc = (src: string, forMobile: boolean = isMobile): string => {
    if (src.endsWith('.png')) {
      const webpSrc = src.replace('.png', '.webp')
      if (forMobile) {
        // MOBILE: ONLY WebP, never fallback to heavy PNG
        console.log(`[FRAMES] Mobile - FORCING WebP: ${src} → ${webpSrc}`)
        return webpSrc
      } else {
        // DESKTOP: Try WebP first, allow PNG fallback
        console.log(`[FRAMES] Desktop - trying WebP: ${src} → ${webpSrc}`)
        return webpSrc
      }
    }
    return src
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
        
        if (isMobile) {
          // MOBILE: NO PNG fallback, just retry WebP with more aggressive cache busting
          console.log(`[FRAMES] Mobile - retrying WebP only (attempt ${attempts + 1}/${MAX_RETRIES})`)
          scheduleRetry()
        } else {
          // DESKTOP: Allow PNG fallback
          if (optimizedSrc !== src && attempts === 0) {
            console.log(`[FRAMES] Desktop - trying PNG fallback: ${src}`)
            const fallbackImg = new Image()
            fallbackImg.src = src
            fallbackImg.onload = onLoad
            fallbackImg.onerror = scheduleRetry
          } else {
            scheduleRetry()
          }
        }
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
      // More aggressive retries for mobile (shorter backoff)
      const backoff = isMobile ? Math.min(1500 * nextAttempt, 4000) : Math.min(2000 * nextAttempt, 6000)
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

  // Calcular altura máxima basada en el final de la sección del video
  useEffect(() => {
    const updateContainerHeight = () => {
      const finalSection = document.getElementById('final-video-section')
      if (finalSection) {
        const rect = finalSection.getBoundingClientRect()
        const finalBottom = window.scrollY + rect.bottom
        setContainerHeight(`${finalBottom}px`)
      }
    }

    // Calcular inicialmente y en cambios de tamaño
    updateContainerHeight()
    
    const resizeObserver = new ResizeObserver(updateContainerHeight)
    const finalSection = document.getElementById('final-video-section')
    if (finalSection) {
      resizeObserver.observe(finalSection)
    }

    window.addEventListener('resize', updateContainerHeight)
    window.addEventListener('load', updateContainerHeight)
    
    // Recalcular en varias pasadas para cubrir cargas diferidas
    const timers = [50, 200, 600, 1200].map(ms => setTimeout(updateContainerHeight, ms))

    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('resize', updateContainerHeight)
      window.removeEventListener('load', updateContainerHeight)
      resizeObserver.disconnect()
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
        height: containerHeight, // Altura dinámica basada en el final del video
        maxHeight: containerHeight, // Reforzar límite máximo
        overflow: 'hidden', // Evita que frames absolutos alarguen el scroll por debajo del video
        overflowY: 'hidden', // Explícitamente bloquear scroll vertical
        pointerEvents: "none",
        zIndex: 50,
        // NO transform - the parent #fixed-layout already handles scaling
      }}
    >
      {enableFrameLoading ? OVERLAY_FRAMES.filter((f) => f.visible !== false && (visibleFrameIds.has(f.id))).map((frame) => {
        const { id, src, fit = 'cover', x = 0, y = 0, width, height, scaleX = 1, scaleY = 1, mobileOffsetY = 0 } = frame

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
            // MOBILE: NEVER fallback to PNG, only retry WebP
            console.log(`[FRAMES] Mobile - retrying WebP for ${id}`)
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
            loading="lazy"
            decoding="async"
            fetchPriority={isNearViewport ? 'high' : (isMobile ? 'low' : 'auto')}
            onError={handleImgError}
          />
        )
      }) : null}
    </div>
  )
}