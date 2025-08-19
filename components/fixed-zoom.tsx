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

    // Detección específica de iOS Safari
    const isIOSSafari = () => {
      const userAgent = navigator.userAgent
      return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
    }

    const isIOS = isIOSSafari()
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
        const scroller = document.getElementById('scroll-root') as HTMLElement | null
        
        if (fixedLayout && wrapper) {
          // Optimización iOS: Batch DOM operations
          if (isIOS) {
            fixedLayout.style.willChange = 'transform'
            wrapper.style.willChange = 'height'
          }

          // Fijar ancho base del lienzo
          fixedLayout.style.width = `${EFFECTIVE_BASE_WIDTH}px`

          // Medir altura natural sin alterar transform
          const naturalHeight = fixedLayout.offsetHeight

          // Aplicar escala
          fixedLayout.style.transform = `scale(${scale})`
          fixedLayout.style.transformOrigin = 'top left'

          // Asegurar ancho sin forzar políticas de scroll (delegadas a layout CSS)
          document.documentElement.style.width = '100vw'
          document.body.style.width = '100vw'

          // HARD CUT: Medir altura exacta hasta el final COMPLETO de la sección del video
          const finalSection = document.getElementById('final-video-section')
          if (finalSection) {
            // Medición robusta para móviles con contenedor de scroll propio (#scroll-root)
            let videoBottomAbsolute: number
            if (scroller) {
              // Usar offsets no transformados y convertir a CSS multiplicando por la escala
              const bottomUnscaled = finalSection.offsetTop + finalSection.offsetHeight
              videoBottomAbsolute = Math.max(0, Math.ceil(bottomUnscaled * scale))
            } else {
              // Fallback (desktop): usar bounding rect + window scroll
              const videoRect = finalSection.getBoundingClientRect()
              const currentScrollY = window.scrollY
              videoBottomAbsolute = currentScrollY + videoRect.bottom
            }

            // Calcular el fondo absoluto requerido por los marcos (overlay)
            const isMobileViewport = (window.innerWidth || 0) <= 768
            let overlayBottomCSS = 0
            
            // Optimización iOS: Saltar cálculo de frames si no es crítico
            if (!isIOS) {
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
            } else {
              // iOS: Cálculo simplificado usando solo el último frame visible
              try {
                const lastFrame = OVERLAY_FRAMES.filter(f => f.visible !== false).pop()
                if (lastFrame) {
                  const yBase = (lastFrame.y ?? 0) + (isMobileViewport ? (lastFrame.mobileOffsetY ?? 0) : 0)
                  const heightBase = (lastFrame.height ?? 400) * (lastFrame.scaleY ?? 1)
                  const bottomBase = yBase + (heightBase / 2)
                  overlayBottomCSS = bottomBase * scale
                }
              } catch {}
            }

            const framesBottomAbsolute = Math.max(0, Math.ceil(overlayBottomCSS))
            // Añadir un pequeño buffer en móviles para evitar recortes por redondeos/transformaciones
            const mobileBuffer = scroller ? 20 : 0
            const totalDocumentHeight = Math.max(0, Math.ceil(Math.max(videoBottomAbsolute, framesBottomAbsolute) + mobileBuffer))
            
            // FORZAR altura absoluta - HARD CUT sin excepciones
            wrapper.style.height = `${totalDocumentHeight}px`
            wrapper.style.maxHeight = `${totalDocumentHeight}px`
            wrapper.style.minHeight = `${totalDocumentHeight}px`
            wrapper.style.overflow = 'hidden'
            wrapper.style.overflowY = 'hidden'
            
            // No forzar alturas/overflow en html; el wrapper marca el alto. Body scrollea por CSS
            document.documentElement.style.height = ''
            document.documentElement.style.maxHeight = ''
            document.body.style.height = ''
            document.body.style.maxHeight = ''
            document.body.style.overflow = ''
            document.body.style.overflowY = ''

            // Optimización iOS: Limpiar willChange después de operaciones
            if (isIOS) {
              setTimeout(() => {
                fixedLayout.style.willChange = ''
                wrapper.style.willChange = ''
              }, 100)
            }

            // Señal global: el primer corte de altura está listo
            dispatchFixedZoomReadyOnce()
          } else {
            // Fallback si no encuentra la sección del video
            const visualHeight = Math.max(0, Math.ceil(fixedLayout.getBoundingClientRect().height))
            // Considerar también la altura necesaria por marcos
            const isMobileViewport = (window.innerWidth || 0) <= 768
            let overlayBottomCSS = 0
            
            // iOS: Fallback simplificado
            if (!isIOS) {
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
            } else {
              // iOS: Usar altura estimada más conservadora
              overlayBottomCSS = Math.max(visualHeight, 6500 * scale)
            }
            
            const needed = Math.max(visualHeight, Math.ceil(overlayBottomCSS))
            const mobileBuffer = scroller ? 200 : 0
            wrapper.style.height = `${needed + mobileBuffer}px`
            wrapper.style.minHeight = `${needed}px`
            
            // iOS: Limpiar willChange en fallback también
            if (isIOS) {
              setTimeout(() => {
                fixedLayout.style.willChange = ''
                wrapper.style.willChange = ''
              }, 100)
            }
            
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
      // iOS: Throttling más agresivo para resize
      const delay = isIOS ? 300 : 150
      resizeTimeout = setTimeout(() => {
        applyZoom()
      }, delay)
    }

    // Observa cambios en el contenido y recalcula con debounce
    const fixedLayoutEl = document.getElementById('fixed-layout')
    if (fixedLayoutEl && 'ResizeObserver' in window && !isIOS) {
      // iOS: Desactivar ResizeObserver para reducir overhead
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
    
    let timeouts: NodeJS.Timeout[] = []
    
    if (isIOS) {
      // iOS OPTIMIZADO: Estrategia conservadora para evitar crashes
      timeouts = [
        setTimeout(applyZoom, 100),   // Solo 3 timeouts espaciados
        setTimeout(applyZoom, 500),
        setTimeout(applyZoom, 1500)
      ]
      
      // iOS: Solo 2 requestAnimationFrame espaciados
      let rafCount = 0
      const iosOptimizedRaf = () => {
        if (rafCount === 0) {
          setTimeout(applyZoom, 0) // Primer RAF inmediato
        } else if (rafCount === 1) {
          setTimeout(applyZoom, 0) // Segundo RAF tras delay
        }
        
        if (rafCount++ < 2) {
          setTimeout(() => requestAnimationFrame(iosOptimizedRaf), 100) // Espaciar RAFs
        }
      }
      requestAnimationFrame(iosOptimizedRaf)
    } else {
      // DESKTOP/ANDROID: Estrategia original agresiva
      timeouts = [
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
      
      // Desktop: Animation frames agresivos originales
      let rafCount = 0
      const hardCutRaf = () => {
        applyZoom()
        if (rafCount++ < 10) {
          requestAnimationFrame(hardCutRaf)
        }
      }
      requestAnimationFrame(hardCutRaf)
    }

    // Recalcular cuando todo cargue (imágenes, etc.)
    window.addEventListener('load', applyZoom)
    // Recalcular cuando las fuentes web terminen de cargar
    // @ts-ignore FontFaceSet
    if (document.fonts && document.fonts.ready) {
      // @ts-ignore
      document.fonts.ready.then(() => applyZoom()).catch(() => {})
    }

    window.addEventListener('resize', handleResize)
    // iOS: Throttling más conservador para orientationchange
    window.addEventListener('orientationchange', () => setTimeout(applyZoom, isIOS ? 500 : 200))

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