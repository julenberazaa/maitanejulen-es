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
    contentLeft: 0, // Real left position of content container
    contentCenterX: BASE_VIEWPORT_WIDTH / 2,
    contentCenterY: 408,
    viewportWidth: BASE_VIEWPORT_WIDTH,
    viewportHeight: 816,
  })

  useEffect(() => {
    const updateLayout = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Calculate actual content area width and position (same logic as max-w-7xl mx-auto px-4)
      const paddingX = 16 * 2 // px-4 = 16px each side = 32px total
      const availableWidth = viewportWidth - paddingX
      const contentWidth = Math.min(availableWidth, MAX_CONTENT_WIDTH)
      
      // Calculate where the content container actually starts (left position)
      const contentLeft = (viewportWidth - contentWidth) / 2
      
      // Content center is at contentLeft + half of contentWidth
      const contentCenterX = contentLeft + (contentWidth / 2)
      const contentCenterY = viewportHeight / 2
      
      // Scale is based on content width, not viewport width
      const scale = contentWidth / MAX_CONTENT_WIDTH
      
      setLayoutInfo({
        scale,
        contentWidth,
        contentLeft,
        contentCenterX,
        contentCenterY,
        viewportWidth,
        viewportHeight,
      })
      
      // Debug logging
      console.log('[FRAMES REAL CONTAINER RESPONSIVE]', {
        viewportWidth,
        availableWidth,
        contentWidth,
        contentLeft,
        contentCenterX,
        maxContentWidth: MAX_CONTENT_WIDTH,
        scale,
        paddingX,
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
        const { id, src, x = 0, y = 0, width, height, scaleX = 1, scaleY = 1, mobileOffsetX = 0, mobileOffsetY = 0 } = frame

        const isMobile = layoutInfo.viewportWidth <= 768

        if (isMobile) {
          // MOBILE: Anchor to real DOM element center so it follows layout exactly
          const anchor = document.querySelector<HTMLElement>(`[data-frame-anchor="${id}"]`)
          if (!anchor) return null
          const rect = anchor.getBoundingClientRect()
          const centerLeftDoc = window.scrollX + rect.left + rect.width / 2
          const centerTopDoc = window.scrollY + rect.top + rect.height / 2

          const finalScaleX = scaleX * (layoutInfo.contentWidth / MAX_CONTENT_WIDTH)
          const finalScaleY = scaleY * (layoutInfo.contentWidth / MAX_CONTENT_WIDTH)

          const style: React.CSSProperties = {
            position: 'absolute',
            left: `${Math.round(centerLeftDoc + mobileOffsetX)}px`,
            top: `${Math.round(centerTopDoc + mobileOffsetY)}px`,
            transform: `translate(-50%, -50%) scale(${finalScaleX}, ${finalScaleY})`,
            objectFit: 'cover',
            borderRadius: 12 * (layoutInfo.contentWidth / MAX_CONTENT_WIDTH),
            pointerEvents: 'none',
          }
          if (typeof width === 'number') style.width = `${Math.round(width * (layoutInfo.contentWidth / MAX_CONTENT_WIDTH))}px`
          if (typeof height === 'number') style.height = `${Math.round(height * (layoutInfo.contentWidth / MAX_CONTENT_WIDTH))}px`
          return <img key={id} id={`overlay-${id}`} src={src} alt="" style={style} />
        }

        // DESKTOP: keep current content-based center positioning
        const scaledX = x * layoutInfo.scale
        const scaledY = y * layoutInfo.scale
        const scaledWidth = width ? width * layoutInfo.scale : width
        const scaledHeight = height ? height * layoutInfo.scale : height
        const finalScaleX = scaleX * layoutInfo.scale
        const finalScaleY = scaleY * layoutInfo.scale
        const realContentCenterX = layoutInfo.contentCenterX
        const realContentCenterY = layoutInfo.contentCenterY
        const transform = `translate(-50%, -50%) translate(${Math.round(scaledX)}px, ${Math.round(scaledY)}px) scale(${finalScaleX}, ${finalScaleY})`
        const style: React.CSSProperties = {
          position: "absolute",
          left: `${realContentCenterX}px`,
          top: `${realContentCenterY}px`,
          transform,
          objectFit: "cover",
          borderRadius: 12 * layoutInfo.scale,
          pointerEvents: "none",
        }
        if (typeof scaledWidth === "number") style.width = `${Math.round(scaledWidth)}px`
        if (typeof scaledHeight === "number") style.height = `${Math.round(scaledHeight)}px`
        return <img key={id} id={`overlay-${id}`} src={src} alt="" style={style} />
      })}
    </div>
  )
}