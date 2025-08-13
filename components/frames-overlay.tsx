"use client"

import React, { useEffect, useState } from "react"
import { OVERLAY_FRAMES } from "@/lib/frame-config"

// Base design width - same as the #fixed-layout element
const BASE_DESIGN_WIDTH = 1920

export default function FramesOverlay(): React.JSX.Element | null {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  return (
    <div
      id="frames-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${BASE_DESIGN_WIDTH}px`, // Same as #fixed-layout base width
        height: '100%', // Limitar al alto del contenido para evitar overflow que añada scroll
        overflow: 'hidden', // Evita que frames absolutos alarguen el scroll por debajo del video
        pointerEvents: "none",
        zIndex: 50,
        // NO transform - the parent #fixed-layout already handles scaling
      }}
    >
      {OVERLAY_FRAMES.filter((f) => f.visible !== false).map((frame) => {
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

        // Debug logging for first frame
        if (id === 'carousel-frame-anchor') {
          console.log('[FRAMES WITH MOBILE OFFSET]', {
            frameId: id,
            isMobile,
            original: { x, y, mobileOffsetY },
            finalPosition: {
              left: baseCenterX + x,
              top: finalY,
              transform
            },
            baseDesignWidth: BASE_DESIGN_WIDTH,
            baseCenterX
          })
        }

        return <img key={id} id={`overlay-${id}`} src={src} alt="" style={style} />
      })}
    </div>
  )
}