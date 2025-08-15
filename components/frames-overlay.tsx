"use client"

import React, { useEffect, useMemo, useState } from "react"
import { OVERLAY_FRAMES } from "@/lib/frame-config"

// Base design width - same as the #fixed-layout element
const BASE_DESIGN_WIDTH = 1920

export default function FramesOverlay(): React.JSX.Element | null {
  const [isMobile, setIsMobile] = useState(false)
  const [containerHeight, setContainerHeight] = useState('100%')
  const [visibleFrameIds, setVisibleFrameIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Virtualize frame rendering on mobile: only render frames near viewport
  useEffect(() => {
    if (!isMobile) {
      // Render all frames on desktop
      setVisibleFrameIds(new Set(OVERLAY_FRAMES.filter(f => f.visible !== false).map(f => f.id)))
      return
    }

    const PRELOAD_MARGIN = 1200 // px before/after viewport

    const updateVisible = () => {
      const currentScrollTop = window.scrollY || document.documentElement.scrollTop || 0
      const viewportHeight = window.innerHeight || 0
      const next = new Set<string>()
      for (const frame of OVERLAY_FRAMES) {
        if (frame.visible === false) continue
        const finalY = (frame.y ?? 0) + (frame.mobileOffsetY ?? 0)
        if (finalY >= currentScrollTop - PRELOAD_MARGIN && finalY <= currentScrollTop + viewportHeight + PRELOAD_MARGIN) {
          next.add(frame.id)
        }
      }
      setVisibleFrameIds(next)
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
  }, [isMobile])

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
      {OVERLAY_FRAMES.filter((f) => f.visible !== false && (visibleFrameIds.has(f.id))).map((frame) => {
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

        return <img key={id} id={`overlay-${id}`} src={src} alt="" style={style} loading="lazy" decoding="async" fetchPriority={isMobile ? 'low' : 'auto'} />
      })}
    </div>
  )
}