"use client"

import { useEffect, useState } from 'react'
import { OVERLAY_FRAMES } from '@/lib/frame-config'
import { iOSDebugLog } from './ios-debug-logger'

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

    // Detección específica de iOS Safari + iPhone específico
    const isIOSSafari = () => {
      const userAgent = navigator.userAgent
      return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
    }

    const isIPhone = () => {
      const userAgent = navigator.userAgent
      return /iPhone/.test(userAgent) && !(window as any).MSStream
    }

    const isIOS = isIOSSafari()
    // Usar detección ultra-temprana si está disponible
    const isIPhoneDevice = (window as any).__isIPhone || isIPhone()
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
      // iPhone: Use simplified approach without "hard cut" to prevent crashes
      if (isIPhoneDevice) {
        iOSDebugLog('info', 'iPhone: Using simplified zoom without hard cut', 'FixedZoom')
        
        const viewport = window.innerWidth
        const scale = viewport / EFFECTIVE_BASE_WIDTH
        const fixedLayout = document.getElementById('fixed-layout') as HTMLElement | null
        const wrapper = document.getElementById('fixed-layout-wrapper') as HTMLElement | null
        
        if (fixedLayout && wrapper) {
          // Simple scaling without complex height calculations
          fixedLayout.style.width = `${EFFECTIVE_BASE_WIDTH}px`
          fixedLayout.style.transform = `scale(${scale})`
          fixedLayout.style.transformOrigin = 'top left'
          
          // Allow natural height - no hard cut
          wrapper.style.height = 'auto'
          wrapper.style.maxHeight = 'none'
          wrapper.style.minHeight = 'auto'
          wrapper.style.overflow = 'visible'
          wrapper.style.overflowY = 'visible'
          
          iOSDebugLog('info', 'iPhone: Simple scaling applied successfully', 'FixedZoom')
        }
        
        dispatchFixedZoomReadyOnce()
        return
      }
      
      // iPhone: Prevenir ejecuciones múltiples (for non-iPhone logic below)
      if (isIPhoneDevice && (window as any).__iPhoneFixedZoomComplete) {
        iOSDebugLog('info', 'iPhone: applyZoom skipped - already completed', 'FixedZoom')
        return
      }
      
      try {
        iOSDebugLog('info', 'FixedZoom applyZoom() started', 'FixedZoom')
        
        const documentWidth = document.documentElement.clientWidth
        const innerWidth = window.innerWidth
        const viewport = documentWidth || innerWidth
        const scale = viewport / EFFECTIVE_BASE_WIDTH
        const fixedLayout = document.getElementById('fixed-layout') as HTMLElement | null
        const wrapper = document.getElementById('fixed-layout-wrapper') as HTMLElement | null
        const scroller = document.getElementById('scroll-root') as HTMLElement | null
        
        iOSDebugLog('info', `Elements found - fixedLayout: ${!!fixedLayout}, wrapper: ${!!wrapper}, scroller: ${!!scroller}`, 'FixedZoom', {
          viewport, scale, documentWidth, innerWidth
        })
        
        if (fixedLayout && wrapper) {
          // iPhone-específico: DOM operations ultra-conservativas
          if (isIPhoneDevice) {
            // iPhone: No usar willChange - causa memory leaks en iOS Safari
            fixedLayout.style.willChange = ''
            wrapper.style.willChange = ''
          } else if (isIOS) {
            // iPad: Mantener optimizaciones moderadas
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
            
            // iPhone-específico: Cálculos ultra-simplificados para evitar crashes
            if (isIPhoneDevice) {
              // iPhone: Usar altura fija estimada - no calcular frames dinámicamente
              overlayBottomCSS = Math.max(6500 * scale, videoBottomAbsolute + 500)
              iOSDebugLog('info', 'iPhone: Using static overlay calculation to prevent crashes', 'FixedZoom', {
                overlayBottomCSS, videoBottomAbsolute, scale
              })
            } else if (!isIOS) {
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
              // iPad: Cálculo simplificado usando solo el último frame visible
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
            iOSDebugLog('dom', `Applying HARD CUT: ${totalDocumentHeight}px`, 'FixedZoom', {
              videoBottomAbsolute, framesBottomAbsolute, totalDocumentHeight, mobileBuffer
            })
            
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

            // iPhone-específico: No usar timers adicionales - causan memory pressure
            if (isIPhoneDevice) {
              // iPhone: No limpiar willChange con timers
              iOSDebugLog('info', 'iPhone: Skipping willChange cleanup timer', 'FixedZoom')
            } else if (isIOS) {
              // iPad: Mantener limpieza moderada
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
            
            // iPhone-específico: Fallback ultra-conservador
            if (isIPhoneDevice) {
              // iPhone: Altura fija muy conservadora
              overlayBottomCSS = Math.max(visualHeight, 7000 * scale)
              iOSDebugLog('info', 'iPhone: Using ultra-conservative height fallback', 'FixedZoom', {
                visualHeight, overlayBottomCSS
              })
            } else if (!isIOS) {
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
              // iPad: Usar altura estimada más conservadora
              overlayBottomCSS = Math.max(visualHeight, 6500 * scale)
            }
            
            const needed = Math.max(visualHeight, Math.ceil(overlayBottomCSS))
            const mobileBuffer = scroller ? 200 : 0
            wrapper.style.height = `${needed + mobileBuffer}px`
            wrapper.style.minHeight = `${needed}px`
            
            // iPhone-específico: No timers de limpieza en fallback
            if (isIPhoneDevice) {
              // iPhone: Evitar timers completamente
            } else if (isIOS) {
              // iPad: Mantener limpieza moderada
              setTimeout(() => {
                fixedLayout.style.willChange = ''
                wrapper.style.willChange = ''
              }, 100)
            }
            
            // También podemos despachar en fallback para no bloquear
            dispatchFixedZoomReadyOnce()
          }
        }
        
        iOSDebugLog('info', 'FixedZoom applyZoom() completed successfully', 'FixedZoom')
      } catch (error) {
        console.error('❌ FixedZoom - Error:', error)
        iOSDebugLog('error', `FixedZoom critical error: ${error}`, 'FixedZoom', {
          error: error,
          stack: (error as Error).stack
        })
      }
    }

    function handleResize() {
      // iPhone: NO manejar resize después de completado
      if (isIPhoneDevice) {
        if ((window as any).__iPhoneFixedZoomComplete) {
          iOSDebugLog('info', 'iPhone: Resize ignored - FixedZoom completed', 'FixedZoom')
          return
        }
        // Si no está completado, usar delay extremo
        if (resizeTimeout) clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
          applyZoom()
        }, 1200) // iPhone: Delay muy largo
        iOSDebugLog('info', 'iPhone: Using ultra-conservative resize throttling (1200ms)', 'FixedZoom')
        return
      }
      
      // Otros dispositivos: comportamiento original
      if (resizeTimeout) clearTimeout(resizeTimeout)
      const delay = isIOS ? 300 : 150
      resizeTimeout = setTimeout(() => {
        applyZoom()
      }, delay)
    }

    // iPhone-específico: ResizeObserver completamente deshabilitado
    const fixedLayoutEl = document.getElementById('fixed-layout')
    if (fixedLayoutEl && 'ResizeObserver' in window && !isIOS) {
      // Solo desktop/Android: ResizeObserver habilitado
      resizeObserver = new ResizeObserver(() => {
        if (observerTimeout) clearTimeout(observerTimeout)
        observerTimeout = setTimeout(() => {
          applyZoom()
        }, 150)
      })
      resizeObserver.observe(fixedLayoutEl)
    } else if (isIPhoneDevice) {
      iOSDebugLog('info', 'iPhone: ResizeObserver disabled to prevent loops', 'FixedZoom')
    }

    // HARD CUT AGRESIVO: Aplicar corte inmediato y múltiples refuerzos
    // Ejecutar inmediatamente sin delay
    applyZoom()
    
    let timeouts: NodeJS.Timeout[] = []
    
    if (isIPhoneDevice) {
      // iPhone SIMPLIFIED: Single execution without aggressive timeouts
      iOSDebugLog('info', 'iPhone detected - using simplified single execution', 'FixedZoom')
      
      // Apply zoom once after DOM is ready
      const singleTimeout = setTimeout(() => {
        iOSDebugLog('info', 'iPhone: Single simplified zoom execution', 'FixedZoom')
        applyZoom()
      }, 100) // Minimal delay
      
      timeouts = [singleTimeout]
    } else if (isIOS) {
      // iPad: Estrategia moderadamente conservadora
      iOSDebugLog('info', 'iPad detected - using conservative HARD CUT strategy', 'FixedZoom')
      timeouts = [
        setTimeout(() => {
          iOSDebugLog('info', 'iPad HARD CUT timeout 1/3 (100ms)', 'FixedZoom')
          applyZoom()
        }, 100),
        setTimeout(() => {
          iOSDebugLog('info', 'iPad HARD CUT timeout 2/3 (500ms)', 'FixedZoom')
          applyZoom()
        }, 500),
        setTimeout(() => {
          iOSDebugLog('info', 'iPad HARD CUT timeout 3/3 (1500ms)', 'FixedZoom')
          applyZoom()
        }, 1500)
      ]
      
      // iPad: Solo 2 requestAnimationFrame espaciados
      let rafCount = 0
      const iosOptimizedRaf = () => {
        iOSDebugLog('performance', `iPad RAF ${rafCount + 1}/2`, 'FixedZoom')
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
    // iPhone-específico: Orientationchange solo si no está completado
    window.addEventListener('orientationchange', () => {
      if (isIPhoneDevice) {
        if ((window as any).__iPhoneFixedZoomComplete) {
          iOSDebugLog('info', 'iPhone: Orientation change ignored - FixedZoom completed', 'FixedZoom')
          return
        }
        iOSDebugLog('info', 'iPhone: Handling orientation change with 1500ms delay', 'FixedZoom')
        setTimeout(applyZoom, 1500)
      } else {
        // Otros dispositivos: delay original
        const delay = isIOS ? 500 : 200
        setTimeout(applyZoom, delay)
      }
    })

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