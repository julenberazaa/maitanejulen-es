"use client"

import React, { useEffect, useState } from "react"
import { OVERLAY_FRAMES } from "@/lib/frame-config"

// Base dimensions when frames were positioned correctly
const BASE_VIEWPORT_WIDTH = 1536
const MAX_CONTENT_WIDTH = 1280 // max-w-7xl = 80rem = 1280px

export default function FramesOverlay(): React.JSX.Element | null {
  const [layoutInfo, setLayoutInfo] = useState({
    scale: 1,
    contentWidth: MAX_CONTENT_WIDTH,
    contentCenterX: BASE_VIEWPORT_WIDTH / 2,
    contentCenterY: 408,
    viewportWidth: BASE_VIEWPORT_WIDTH,
    viewportHeight: 816,
    isMobile: false,
  })

  useEffect(() => {
    const updateLayout = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Calculate actual content area width (same logic as max-w-7xl mx-auto)
      const contentWidth = Math.min(viewportWidth - 32, MAX_CONTENT_WIDTH) // px-4 = 16px each side
      
      // Content is always centered in viewport
      const contentCenterX = viewportWidth / 2
      const contentCenterY = viewportHeight / 2
      
      // Scale is based on content width, not viewport width
      const scale = contentWidth / MAX_CONTENT_WIDTH
      
      setLayoutInfo({
        scale,
        contentWidth,
        contentCenterX,
        contentCenterY,
        viewportWidth,
        viewportHeight,
        isMobile: viewportWidth <= 768
      })
      
      // Debug logging
      console.log('[FRAMES CONTENT RESPONSIVE]', {
        viewportWidth,
        contentWidth,
        maxContentWidth: MAX_CONTENT_WIDTH,
        scale,
        contentCenter: { x: contentCenterX, y: contentCenterY },
        timestamp: Date.now()
      })
    }

    // Initial calculation
    updateLayout()

    // Listen to resize events
    window.addEventListener('resize', updateLayout)
    
    return () => {
      window.removeEventListener('resize', updateLayout)
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
        const { id, src, x = 0, y = 0, width, height, scaleX = 1, scaleY = 1, mobileOffsetX, mobileOffsetY } = frame

        // Apply content-based scaling to position offsets
        // Apply optional mobile-specific nudges relative to anchor center
        const baseX = layoutInfo.isMobile && typeof mobileOffsetX === 'number' ? x + mobileOffsetX : x
        const baseY = layoutInfo.isMobile && typeof mobileOffsetY === 'number' ? y + mobileOffsetY : y

        const scaledX = baseX * layoutInfo.scale
        const scaledY = baseY * layoutInfo.scale
        
        // Apply content-based scaling to dimensions
        const scaledWidth = width ? width * layoutInfo.scale : width
        const scaledHeight = height ? height * layoutInfo.scale : height
        
        // Apply content-based scaling to scale factors
        const finalScaleX = scaleX * layoutInfo.scale
        const finalScaleY = scaleY * layoutInfo.scale

        // Position relative to content center; for absolute overlay we use viewport center baseline
        const contentCenterX = layoutInfo.viewportWidth / 2
        const contentCenterY = layoutInfo.viewportHeight / 2

        const transform = `translate(-50%, -50%) translate(${Math.round(scaledX)}px, ${Math.round(scaledY)}px) scale(${finalScaleX}, ${finalScaleY})`
        const style: React.CSSProperties = {
          position: "absolute",
          left: `${contentCenterX}px`,
          top: `${contentCenterY}px`,
          transform,
          objectFit: "cover",
          borderRadius: 12 * layoutInfo.scale,
          pointerEvents: "none",
        }

        if (typeof scaledWidth === "number") style.width = `${Math.round(scaledWidth)}px`
        if (typeof scaledHeight === "number") style.height = `${Math.round(scaledHeight)}px`

        // Debug logging for first frame
        if (id === 'carousel-frame-anchor') {
          console.log('[FRAMES CONTENT DEBUG]', {
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
              left: contentCenterX,
              top: contentCenterY,
              transform
            }
          })
        }

        return <img key={id} id={`overlay-${id}`} src={src} alt="" style={style} />
      })}
    </div>
  )
}