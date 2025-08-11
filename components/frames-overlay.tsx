"use client"

import React from "react"
import { OVERLAY_FRAMES } from "@/lib/frame-config"

// Base design width - same as the #fixed-layout element
const BASE_DESIGN_WIDTH = 1920

export default function FramesOverlay(): React.JSX.Element | null {
  return (
    <div
      id="frames-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${BASE_DESIGN_WIDTH}px`, // Same as #fixed-layout base width
        height: "100%",
        pointerEvents: "none",
        zIndex: 50,
        // NO transform - the parent #fixed-layout already handles scaling
      }}
    >
      {OVERLAY_FRAMES.filter((f) => f.visible !== false).map((frame) => {
        const { id, src, x = 0, y = 0, width, height, scaleX = 1, scaleY = 1 } = frame

        // Position relative to the center of the base design (1920px width)
        const baseCenterX = BASE_DESIGN_WIDTH / 2
        
        // Direct coordinates in the base design space (no scaling calculations needed)
        const transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`
        const style: React.CSSProperties = {
          position: "absolute",
          left: `${baseCenterX + x}px`, // Center + offset in base design space
          top: `${y}px`, // Direct Y coordinate in base design space
          transform,
          objectFit: "cover",
          borderRadius: 12,
          pointerEvents: "none",
        }

        // Direct dimensions in base design space
        if (typeof width === "number") style.width = `${width}px`
        if (typeof height === "number") style.height = `${height}px`

        // Debug logging for first frame
        if (id === 'carousel-frame-anchor') {
          console.log('[FRAMES INSIDE SCALED CONTAINER]', {
            frameId: id,
            baseDesignWidth: BASE_DESIGN_WIDTH,
            baseCenterX,
            finalPosition: {
              left: baseCenterX + x,
              top: y,
              transform
            },
            frame: { x, y, width, height, scaleX, scaleY }
          })
        }

        return <img key={id} id={`overlay-${id}`} src={src} alt="" style={style} />
      })}
    </div>
  )
}