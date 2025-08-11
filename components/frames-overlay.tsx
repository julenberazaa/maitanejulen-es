"use client"

import React, { useEffect, useState } from "react"
import { OVERLAY_FRAMES } from "@/lib/frame-config"

// Use EXACTLY the same constants as FixedZoom component
const BASE_WIDTH = 1920
const DESIGN_MAGNIFY = 1.21 // ~21% total más grande
const EFFECTIVE_BASE_WIDTH = BASE_WIDTH / DESIGN_MAGNIFY // ~1587.6px

export default function FramesOverlay(): React.JSX.Element | null {
  const [layoutInfo, setLayoutInfo] = useState({
    scale: 1,
    viewportWidth: EFFECTIVE_BASE_WIDTH,
    viewportHeight: 816,
  })

  useEffect(() => {
    const updateLayout = () => {
      // Use EXACTLY the same logic as FixedZoom component
      const documentWidth = document.documentElement.clientWidth
      const innerWidth = window.innerWidth
      const viewport = documentWidth || innerWidth
      const scale = viewport / EFFECTIVE_BASE_WIDTH
      
      setLayoutInfo({
        scale,
        viewportWidth: viewport,
        viewportHeight: window.innerHeight,
      })
      
      // Debug logging
      console.log('[FRAMES FIXED ZOOM SYSTEM]', {
        viewport,
        effectiveBaseWidth: EFFECTIVE_BASE_WIDTH,
        scale,
        documentWidth,
        innerWidth,
        timestamp: Date.now()
      })
    }

    // Initial calculation
    updateLayout()

    // Listen to resize events (same as FixedZoom)
    const handleResize = () => {
      setTimeout(updateLayout, 150) // Same debounce as FixedZoom
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', () => setTimeout(updateLayout, 200))
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return (
    <div
      id="frames-overlay"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      {OVERLAY_FRAMES.filter((f) => f.visible !== false).map((frame) => {
        const { id, src, x = 0, y = 0, width, height, scaleX = 1, scaleY = 1 } = frame

        // Apply FIXED ZOOM scaling (same as the entire page)
        const scaledX = x * layoutInfo.scale
        const scaledY = y * layoutInfo.scale
        
        // Apply fixed zoom scaling to dimensions
        const scaledWidth = width ? width * layoutInfo.scale : width
        const scaledHeight = height ? height * layoutInfo.scale : height
        
        // Apply fixed zoom scaling to scale factors
        const finalScaleX = scaleX * layoutInfo.scale
        const finalScaleY = scaleY * layoutInfo.scale

        // Position relative to viewport center (like the fixed zoom system)
        const viewportCenterX = layoutInfo.viewportWidth / 2
        const viewportCenterY = layoutInfo.viewportHeight / 2

        const transform = `translate(-50%, -50%) translate(${Math.round(scaledX)}px, ${Math.round(scaledY)}px) scale(${finalScaleX}, ${finalScaleY})`
        const style: React.CSSProperties = {
          position: "absolute",
          left: `${viewportCenterX}px`,
          top: `${viewportCenterY}px`,
          transform,
          objectFit: "cover",
          borderRadius: 12 * layoutInfo.scale,
          pointerEvents: "none",
        }

        if (typeof scaledWidth === "number") style.width = `${Math.round(scaledWidth)}px`
        if (typeof scaledHeight === "number") style.height = `${Math.round(scaledHeight)}px`

        // Debug logging for first frame
        if (id === 'carousel-frame-anchor') {
          console.log('[FRAMES FIXED ZOOM DEBUG]', {
            frameId: id,
            original: { x, y, width, height, scaleX, scaleY },
            scaled: { 
              x: scaledX, 
              y: scaledY, 
              width: scaledWidth, 
              height: scaledHeight, 
              scaleX: finalScaleX, 
              scaleY: finalScaleY 
            },
            layoutInfo,
            finalPosition: {
              left: viewportCenterX,
              top: viewportCenterY,
              transform
            }
          })
        }

        return <img key={id} id={`overlay-${id}`} src={src} alt="" style={style} />
      })}
    </div>
  )
}