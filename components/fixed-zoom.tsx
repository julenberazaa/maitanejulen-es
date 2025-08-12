"use client"

import { useEffect, useState } from 'react'

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

          // Bloquear overflow horizontal global
          document.documentElement.style.overflowX = 'hidden'
          document.body.style.overflowX = 'hidden'
          document.documentElement.style.width = '100vw'
          document.body.style.width = '100vw'

          // NO actualizar altura del wrapper - dejar que el contenido determine la altura naturalmente
          // El wrapper tendrá altura automática basada en el contenido escalado
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

    // Aplicar zoom inicial con múltiples intentos para cubrir carga diferida
    const timeouts = [
      setTimeout(applyZoom, 50),
      setTimeout(applyZoom, 200),
      setTimeout(applyZoom, 600),
      setTimeout(applyZoom, 1200)
    ]

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