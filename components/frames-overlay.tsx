"use client"

import React, { useEffect, useState } from "react"
import { OVERLAY_FRAMES } from "@/lib/frame-config"

export default function FramesOverlay(): React.JSX.Element | null {
  const [layoutInfo, setLayoutInfo] = useState({
    scale: 1,
    fixedLayoutLeft: 0,
    fixedLayoutTop: 0,
    fixedLayoutCenterX: 0,
    fixedLayoutCenterY: 0,
    fixedLayoutWidth: 1920,
  })

  useEffect(() => {
    const updateLayout = () => {
      // Get the REAL position and scale of the #fixed-layout element
      const fixedLayout = document.getElementById('fixed-layout')
      if (!fixedLayout) return

      // Get the actual bounding box of the scaled element
      const rect = fixedLayout.getBoundingClientRect()
      
      // Extract the scale from the computed transform
      const computedStyle = window.getComputedStyle(fixedLayout)
      const transform = computedStyle.transform
      
      let scale = 1
      if (transform && transform !== 'none') {
        // Parse matrix(scaleX, 0, 0, scaleY, translateX, translateY)
        const values = transform.match(/matrix\(([^)]+)\)/)
        if (values) {
          const matrix = values[1].split(',').map(v => parseFloat(v.trim()))
          scale = matrix[0] // scaleX value
        }
      }

      // Calculate the center of the scaled fixed-layout element
      const fixedLayoutCenterX = rect.left + (rect.width / 2)
      const fixedLayoutCenterY = rect.top + (rect.height / 2)
      
      setLayoutInfo({
        scale,
        fixedLayoutLeft: rect.left,
        fixedLayoutTop: rect.top,
        fixedLayoutCenterX,
        fixedLayoutCenterY,
        fixedLayoutWidth: rect.width,
      })
      
      // Debug logging
      console.log('[FRAMES REAL FIXED-LAYOUT REFERENCE]', {
        rect,
        scale,
        center: { x: fixedLayoutCenterX, y: fixedLayoutCenterY },
        transform,
        timestamp: Date.now()
      })
    }

    // Initial calculation
    updateLayout()

    // Listen to resize events and layout changes
    const handleResize = () => {
      setTimeout(updateLayout, 150)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', () => setTimeout(updateLayout, 200))
    
    // Also listen for any changes to the fixed-layout element
    const fixedLayout = document.getElementById('fixed-layout')
    if (fixedLayout && 'ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        setTimeout(updateLayout, 50)
      })
      resizeObserver.observe(fixedLayout)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleResize)
        resizeObserver.disconnect()
      }
    }
    
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

        // Position relative to the REAL center of the scaled #fixed-layout element
        // Apply the same scale that's applied to the fixed-layout
        const scaledX = x * layoutInfo.scale
        const scaledY = y * layoutInfo.scale
        const scaledWidth = width ? width * layoutInfo.scale : width
        const scaledHeight = height ? height * layoutInfo.scale : height
        const finalScaleX = scaleX * layoutInfo.scale
        const finalScaleY = scaleY * layoutInfo.scale

        const transform = `translate(-50%, -50%) translate(${Math.round(scaledX)}px, ${Math.round(scaledY)}px) scale(${finalScaleX}, ${finalScaleY})`
        const style: React.CSSProperties = {
          position: "absolute",
          left: `${layoutInfo.fixedLayoutCenterX}px`, // Use REAL center of scaled element
          top: `${layoutInfo.fixedLayoutCenterY}px`,   // Use REAL center of scaled element
          transform,
          objectFit: "cover",
          borderRadius: 12 * layoutInfo.scale,
          pointerEvents: "none",
        }

        if (typeof scaledWidth === "number") style.width = `${Math.round(scaledWidth)}px`
        if (typeof scaledHeight === "number") style.height = `${Math.round(scaledHeight)}px`

        // Debug logging for first frame
        if (id === 'carousel-frame-anchor') {
          console.log('[FRAMES REAL CENTER DEBUG]', {
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
              left: layoutInfo.fixedLayoutCenterX,
              top: layoutInfo.fixedLayoutCenterY,
              transform
            }
          })
        }

        return <img key={id} id={`overlay-${id}`} src={src} alt="" style={style} />
      })}
    </div>
  )
}