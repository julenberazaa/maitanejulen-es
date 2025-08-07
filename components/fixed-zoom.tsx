"use client"

import { useEffect, useState } from 'react'

export default function FixedZoom() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const BASE_WIDTH = 1920
    let resizeTimeout: NodeJS.Timeout

    function applyZoom() {
      try {
        // Usar el ancho real de la ventana del navegador
        const documentWidth = document.documentElement.clientWidth
        const innerWidth = window.innerWidth
        const viewport = documentWidth || innerWidth
        const scale = viewport / BASE_WIDTH
        const fixedLayout = document.getElementById('fixed-layout')
        
        if (fixedLayout) {
          // Resetear transform para medir altura natural
          fixedLayout.style.transform = 'none'
          const naturalHeight = fixedLayout.scrollHeight
          
          // Aplicar zoom
          fixedLayout.style.transform = `scale(${scale})`
          fixedLayout.style.transformOrigin = 'top left'
          
          // Ajustar el body
          const scaledHeight = naturalHeight * scale
          document.body.style.height = `${scaledHeight}px`
          document.body.style.overflow = 'auto'
        }
      } catch (error) {
        console.error('❌ FixedZoom - Error:', error)
      }
    }

    function handleResize() {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        applyZoom()
      }, 100)
    }

    // Aplicar zoom inicial con múltiples intentos
    const timeouts = [
      setTimeout(applyZoom, 100),
      setTimeout(applyZoom, 500),
      setTimeout(applyZoom, 1000),
      setTimeout(applyZoom, 2000)
    ]

    // Agregar listener de resize
    window.addEventListener('resize', handleResize)
    
    // También escuchar cambios de orientación
    window.addEventListener('orientationchange', () => {
      setTimeout(applyZoom, 200)
    })

    return () => {
      timeouts.forEach(clearTimeout)
      if (resizeTimeout) clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  // No renderizar nada - solo funcionalidad
  return null
} 