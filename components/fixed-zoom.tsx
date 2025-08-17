"use client"

import { useEffect, useState } from 'react'
import { OVERLAY_FRAMES } from '@/lib/frame-config'

export default function FixedZoom() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const BASE_WIDTH = 1920
    const DESIGN_MAGNIFY = 1.21 // ~21% total más grande
    const EFFECTIVE_BASE_WIDTH = BASE_WIDTH / DESIGN_MAGNIFY // ~1587.6px
    let resizeTimeout: NodeJS.Timeout
    let observerTimeout: NodeJS.Timeout | null = null
    let resizeObserver: ResizeObserver | null = null

    let fixedZoomReadyDispatched = false

    function dispatchFixedZoomReadyOnce() {
      if (fixedZoomReadyDispatched) return
      fixedZoomReadyDispatched = true
      try {
        ;(window as any).__fixedZoomReady = true
        window.dispatchEvent(new CustomEvent('fixed-zoom-ready'))
      } catch {}
    }

    function applyZoom() {
      try {
        const documentWidth = document.documentElement.clientWidth
        const innerWidth = window.innerWidth
        const viewport = documentWidth || innerWidth
        const scale = viewport / EFFECTIVE_BASE_WIDTH
        const fixedLayout = document.getElementById('fixed-layout') as HTMLElement | null
        const wrapper = document.getElementById('fixed-layout-wrapper') as HTMLElement | null
        
        if (fixedLayout && wrapper) {
          // Fijar ancho base del lienzo
          fixedLayout.style.width = `${EFFECTIVE_BASE_WIDTH}px`

          // Medir altura natural sin alterar transform
          const naturalHeight = fixedLayout.offsetHeight

          // Aplicar escala
          fixedLayout.style.transform = `scale(${scale})`
          fixedLayout.style.transformOrigin = 'top left'

          // Bloquear overflow horizontal. Mantener scroll vertical en html, ocultar en body
          document.documentElement.style.overflowX = 'hidden'
          document.documentElement.style.overflowY = 'auto'
          document.body.style.overflowX = 'hidden'
          document.documentElement.style.width = '100vw'
          document.body.style.width = '100vw'

          // HARD CUT: Medir altura exacta hasta el final COMPLETO de la sección del video
          const finalSection = document.getElementById('final-video-section')
          if (finalSection) {
            // Medir posición absoluta del final REAL del video en el espacio escalado
            const videoRect = finalSection.getBoundingClientRect()
            // videoRect.bottom da la posición final real de la sección en viewport
            // Necesitamos convertir eso a posición absoluta en el documento
            const currentScrollY = window.scrollY
            const videoBottomAbsolute = currentScrollY + videoRect.bottom

            // Calcular el fondo absoluto requerido por los marcos (overlay)
            const isMobileViewport = (window.innerWidth || 0) <= 768
            let overlayBottomCSS = 0
            try {
              for (const frame of OVERLAY_FRAMES) {
                if (frame.visible === false) continue
                const yBase = (frame.y ?? 0) + (isMobileViewport ? (frame.mobileOffsetY ?? 0) : 0)
                const heightBase = (frame.height ?? 400) * (frame.scaleY ?? 1)
                const bottomBase = yBase + (heightBase / 2)
                const bottomCSS = bottomBase * scale // convertir a coordenadas CSS
                if (bottomCSS > overlayBottomCSS) overlayBottomCSS = bottomCSS
              }
            } catch {}

            const framesBottomAbsolute = Math.max(0, Math.ceil(overlayBottomCSS))
            const totalDocumentHeight = Math.max(0, Math.ceil(Math.max(videoBottomAbsolute, framesBottomAbsolute)))
            
            // FORZAR altura absoluta - HARD CUT sin excepciones
            wrapper.style.height = `${totalDocumentHeight}px`
            wrapper.style.maxHeight = `${totalDocumentHeight}px`
            wrapper.style.minHeight = `${totalDocumentHeight}px`
            wrapper.style.overflow = 'hidden'
            wrapper.style.overflowY = 'hidden'
            
            // Forzar que el documento no sea más alto que esto
            document.documentElement.style.height = `${totalDocumentHeight}px`
            document.documentElement.style.maxHeight = `${totalDocumentHeight}px`
            document.body.style.height = `${totalDocumentHeight}px`
            document.body.style.maxHeight = `${totalDocumentHeight}px`
            document.body.style.overflow = 'hidden'
            document.body.style.overflowY = 'hidden'

            // Señal global: el primer corte de altura está listo
            dispatchFixedZoomReadyOnce()
          } else {
            // Fallback si no encuentra la sección del video
            const visualHeight = Math.max(0, Math.ceil(fixedLayout.getBoundingClientRect().height))
            // Considerar también la altura necesaria por marcos
            const isMobileViewport = (window.innerWidth || 0) <= 768
            let overlayBottomCSS = 0
            try {
              for (const frame of OVERLAY_FRAMES) {
                if (frame.visible === false) continue
                const yBase = (frame.y ?? 0) + (isMobileViewport ? (frame.mobileOffsetY ?? 0) : 0)
                const heightBase = (frame.height ?? 400) * (frame.scaleY ?? 1)
                const bottomBase = yBase + (heightBase / 2)
                const bottomCSS = bottomBase * scale
                if (bottomCSS > overlayBottomCSS) overlayBottomCSS = bottomCSS
              }
            } catch {}
            const needed = Math.max(visualHeight, Math.ceil(overlayBottomCSS))
            wrapper.style.height = `${needed}px`
            wrapper.style.minHeight = `${needed}px`
            // También podemos despachar en fallback para no bloquear
            dispatchFixedZoomReadyOnce()
          }
        }
      } catch (error) {
        console.error('❌ FixedZoom - Error:', error)
      }
    }

    function handleResize() {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        applyZoom()
      }, 150)
    }

    // Observa cambios en el contenido y recalcula con debounce
    const fixedLayoutEl = document.getElementById('fixed-layout')
    if (fixedLayoutEl && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        if (observerTimeout) clearTimeout(observerTimeout)
        observerTimeout = setTimeout(() => {
          applyZoom()
        }, 150)
      })
      resizeObserver.observe(fixedLayoutEl)
    }

    // HARD CUT AGRESIVO: Aplicar corte inmediato y múltiples refuerzos
    // Ejecutar inmediatamente sin delay
    applyZoom()
    
    // Reforzar en cada frame durante los primeros segundos para asegurar el corte
    const timeouts = [
      setTimeout(applyZoom, 0),
      setTimeout(applyZoom, 1),
      setTimeout(applyZoom, 16),
      setTimeout(applyZoom, 50),
      setTimeout(applyZoom, 100),
      setTimeout(applyZoom, 200),
      setTimeout(applyZoom, 400),
      setTimeout(applyZoom, 600),
      setTimeout(applyZoom, 1000),
      setTimeout(applyZoom, 1200),
      setTimeout(applyZoom, 2000)
    ]
    
    // Forzar en animation frames para capturar el primer render
    let rafCount = 0
    const hardCutRaf = () => {
      applyZoom()
      if (rafCount++ < 10) {
        requestAnimationFrame(hardCutRaf)
      }
    }
    requestAnimationFrame(hardCutRaf)

    // Recalcular cuando todo cargue (imágenes, etc.)
    window.addEventListener('load', applyZoom)
    // Recalcular cuando las fuentes web terminen de cargar
    // @ts-ignore FontFaceSet
    if (document.fonts && document.fonts.ready) {
      // @ts-ignore
      document.fonts.ready.then(() => applyZoom()).catch(() => {})
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', () => setTimeout(applyZoom, 200))

    return () => {
      timeouts.forEach(clearTimeout)
      if (resizeTimeout) clearTimeout(resizeTimeout)
      if (observerTimeout) clearTimeout(observerTimeout)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      window.removeEventListener('load', applyZoom)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [])

  return null
} 