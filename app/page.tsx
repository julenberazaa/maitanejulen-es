"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Heart, Plane, MapPin, Camera, Video, Sun, Star, Ship, BellRingIcon as Ring, BookOpen, PartyPopper, X, PawPrint, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react"
import ImageCarousel from "@/components/image-carousel"
import FramesOverlay from "@/components/frames-overlay"
import { iOSDebugLog } from "@/components/ios-debug-logger"

interface ImageState {
  src: string | null
  rect: DOMRect | null
  images?: string[]
  currentIndex?: number
}


export default function TimelinePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLIFrameElement>(null)
  const finalSectionRef = useRef<HTMLElement>(null)
  const finalSectionBgRef = useRef<HTMLDivElement>(null)
  const finalSectionImageRef = useRef<HTMLDivElement>(null)
  const [selectedImage, setSelectedImage] = useState<ImageState>({ src: null, rect: null })
  const [isAnimating, setIsAnimating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<{ src: string | null, rect: DOMRect | null }>({ src: null, rect: null })
  const [isAnimatingVideo, setIsAnimatingVideo] = useState(false)
  const [isClosingVideo, setIsClosingVideo] = useState(false)
  const modalVideoRef = useRef<HTMLVideoElement>(null)
  // Unified media modal state
  type MediaItem = { type: 'image' | 'video', src: string }
  const [selectedMedia, setSelectedMedia] = useState<{ items: MediaItem[]; startIndex: number; rect: DOMRect | null } | null>(null)
  const [mediaActiveIndex, setMediaActiveIndex] = useState(0)
  const [isAnimatingMedia, setIsAnimatingMedia] = useState(false)
  const [isClosingMedia, setIsClosingMedia] = useState(false)
  const mediaVideoRefs = useRef<Record<number, HTMLVideoElement | null>>({})
  const [showVideo, setShowVideo] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [tuentiStarted, setTuentiStarted] = useState(false)
  // HARD CUT aplicado en FixedZoom - no necesitamos lógica de scroll compleja

  // Overlay de contraseña (pantalla previa)
  const [overlayVisible, setOverlayVisible] = useState(true)
  const [inputPass, setInputPass] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isShakingOverlay, setIsShakingOverlay] = useState(false)
  const [overlayError, setOverlayError] = useState('')
  const [fadeToBlack, setFadeToBlack] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const overlayVisibleRef = useRef(overlayVisible)
  useEffect(() => { overlayVisibleRef.current = overlayVisible }, [overlayVisible])
  useEffect(() => { setHasMounted(true) }, [])

  // Forzar scroll al top en cada recarga de la página sin animación
  useEffect(() => {
    // Detección de iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    
    iOSDebugLog('info', 'Page initialization started', 'TimelinePage', { isIOS })
    
    // Evitar que el navegador restaure la posición de scroll anterior
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
      iOSDebugLog('info', 'Scroll restoration set to manual', 'TimelinePage')
    }
    
    // Forzar posición al top inmediatamente sin animación
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    iOSDebugLog('dom', 'Forced scroll to top', 'TimelinePage')

    // Bloquear scroll durante el primer segundo para estabilizar marcos
    const prevHtmlOverflowY = document.documentElement.style.overflowY
    const prevBodyOverflowY = document.body.style.overflowY
    // Bloquear scroll en html y body durante overlay
    document.documentElement.style.overflowY = 'hidden'
    document.body.style.overflowY = 'hidden'
    iOSDebugLog('dom', 'Scroll blocked during overlay', 'TimelinePage')
    
    // iOS: Timeout más conservador para desbloqueo
    const unlockDelay = isIOS ? 1500 : 1000
    iOSDebugLog('info', `Setting unlock delay: ${unlockDelay}ms`, 'TimelinePage')
    
    const unlock = setTimeout(() => {
      // Mantener bloqueo si el overlay sigue visible
      if (!overlayVisibleRef.current) {
        document.documentElement.style.overflowY = prevHtmlOverflowY || ''
        document.body.style.overflowY = prevBodyOverflowY || ''
        iOSDebugLog('dom', 'Scroll unlocked after timeout', 'TimelinePage')
      } else {
        iOSDebugLog('info', 'Scroll unlock skipped - overlay still visible', 'TimelinePage')
      }
    }, unlockDelay)
    return () => clearTimeout(unlock)
  }, [])

  // HARD CUT: La lógica de corte de scroll ahora está en FixedZoom.
  // El documento se corta físicamente a la altura del video, eliminando scroll extra.

  useEffect(() => {
    if (selectedImage.src) {
      const timer = setTimeout(() => {
        setIsAnimating(true)
      }, 10) // Short delay to allow initial state to render
      return () => clearTimeout(timer)
    }
  }, [selectedImage.src])

  // Unified media modal mount animation
  useEffect(() => {
    if (!selectedMedia) return
    setMediaActiveIndex(selectedMedia.startIndex)
    const t = setTimeout(() => setIsAnimatingMedia(true), 10)
    return () => clearTimeout(t)
  }, [selectedMedia])

  // Auto-advance for images inside unified modal
  const currentMediaItem: MediaItem | null = useMemo(() => {
    if (!selectedMedia) return null
    return selectedMedia.items[mediaActiveIndex] ?? null
  }, [selectedMedia, mediaActiveIndex])

  useEffect(() => {
    if (!selectedMedia || selectedMedia.items.length <= 1) return
    if (!currentMediaItem || currentMediaItem.type !== 'image') return
    const interval = setInterval(() => {
      setMediaActiveIndex((prev) => (prev === selectedMedia.items.length - 1 ? 0 : prev + 1))
    }, 4000)
    return () => clearInterval(interval)
  }, [selectedMedia, currentMediaItem])

  // Handle video playback + advance when ended in modal
  useEffect(() => {
    if (!selectedMedia || !currentMediaItem || currentMediaItem.type !== 'video') return
    const vid = mediaVideoRefs.current[mediaActiveIndex]
    if (!vid) return
    try { vid.currentTime = 0 } catch {}
    vid.muted = true
    const onEnded = () => setMediaActiveIndex((prev) => (prev === selectedMedia.items.length - 1 ? 0 : prev + 1))
    vid.addEventListener('ended', onEnded)
    const p = vid.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
    return () => {
      vid.removeEventListener('ended', onEnded)
      try { vid.pause() } catch {}
    }
  }, [selectedMedia, currentMediaItem, mediaActiveIndex])

  // Animación de apertura para el video modal
  useEffect(() => {
    if (selectedVideo.src) {
      const timer = setTimeout(() => {
        setIsAnimatingVideo(true)
        // Intentar reproducir automáticamente
        if (modalVideoRef.current) {
          try { modalVideoRef.current.currentTime = 0 } catch {}
          const playP = modalVideoRef.current.play()
          if (playP && typeof playP.catch === 'function') playP.catch(() => {})
        }
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [selectedVideo.src])

  // Modal carousel rotation effect
  useEffect(() => {
    if (selectedImage.images && selectedImage.images.length > 1) {
      const interval = setInterval(() => {
        setModalImageIndex((prevIndex) => {
          const nextIndex = prevIndex === selectedImage.images!.length - 1 ? 0 : prevIndex + 1
          setSelectedImage(prev => ({ 
            ...prev, 
            src: selectedImage.images![nextIndex],
            currentIndex: nextIndex 
          }))
          return nextIndex
        })
      }, 4000) // Match carousel timing

      return () => clearInterval(interval)
    }
  }, [selectedImage.images])

  useEffect(() => {
    if (showVideo && videoRef.current) {
      // YouTube iframe will handle playback controls automatically
      // videoRef.current.play() // Not available for iframe elements
    }
  }, [showVideo])

  useEffect(() => {
    if (overlayVisible) return
    // Initialize scroll animations cuando el overlay ya no está visible
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in")
        }
      })
    }, observerOptions)

    // Observe all timeline items
    document.querySelectorAll(".timeline-item").forEach((item) => {
      observer.observe(item)
    })

    // Zoom effect for hero on scroll
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.pageYOffset
        const scale = 1 + scrolled * 0.0005
        heroRef.current.style.transform = `scale(${scale})`
      }

      if (finalSectionRef.current && finalSectionBgRef.current && finalSectionImageRef.current) {
        const rect = finalSectionRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        if (rect.top <= viewportHeight && rect.bottom >= 0) {
          const scrollProgress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
          
          const gradientScale = 1 + scrollProgress * 0.3;
          const translateX = -50 + scrollProgress * 100;
          finalSectionBgRef.current.style.transform = `scale(${gradientScale}) translateX(${translateX}px)`;

          const imageScale = 2 - scrollProgress;
          finalSectionImageRef.current.style.transform = `scale(${imageScale})`;
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      observer.disconnect()
    }
  }, [overlayVisible])

  // Leer permiso previo desde localStorage y omitir contraseña en localhost
  useEffect(() => {
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || /^192\.168\./.test(hostname) || /^10\./.test(hostname)

      if (isLocalhost) {
        try { localStorage.setItem('access-granted', '1') } catch {}
        setOverlayVisible(false)
        return
      }

      const granted = localStorage.getItem('access-granted')
      if (granted === '1') setOverlayVisible(false)
    } catch {}
  }, [])

  // Bloquear scroll mientras el overlay esté visible (Política scroller único: #scroll-root)
  useEffect(() => {
    const scroller = document.getElementById('scroll-root') as HTMLElement | null
    if (!scroller) return
    if (overlayVisible) scroller.style.overflowY = 'hidden'
    else scroller.style.overflowY = 'auto'
  }, [overlayVisible])

  const handleOverlaySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    iOSDebugLog('info', 'Password submit initiated', 'TimelinePage', { 
      overlayVisible, inputPassLength: inputPass.length 
    })
    
    try {
      const res = await fetch('/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass: inputPass })
      })
      
      iOSDebugLog('info', `Password verification response: ${res.status}`, 'TimelinePage')
      
      if (res.ok) {
        setOverlayError('')
        setFadeToBlack(true)
        
        iOSDebugLog('info', 'Password correct - starting fade to black', 'TimelinePage')
        
        setTimeout(() => {
          try { 
            localStorage.setItem('access-granted', '1') 
            iOSDebugLog('info', 'localStorage access-granted set', 'TimelinePage')
          } catch (e) {
            iOSDebugLog('error', `localStorage failed: ${e}`, 'TimelinePage')
          }
          
          iOSDebugLog('warning', 'About to hide overlay - CRITICAL POINT', 'TimelinePage')
          setOverlayVisible(false)
          
          // Forzar reflujo y reactivar scroll tras ocultar el overlay
          requestAnimationFrame(() => {
            iOSDebugLog('dom', 'Reactivating scroll after overlay hidden', 'TimelinePage')
            document.documentElement.style.overflowY = ''
            document.body.style.overflowY = ''
            window.dispatchEvent(new Event('scroll'))
            iOSDebugLog('info', 'Scroll reactivation completed', 'TimelinePage')
          })
        }, 1000) // Mantener fade 1s completo
      } else {
        setOverlayError('Contraseña incorrecta')
        setIsShakingOverlay(true)
        setTimeout(() => setIsShakingOverlay(false), 600)
      }
    } catch {
      setOverlayError('Error de conexión')
      setIsShakingOverlay(true)
      setTimeout(() => setIsShakingOverlay(false), 600)
    }
  }

  // Sin overlay dinámico. Los marcos se renderizan estáticamente dentro de cada carrusel.

  // Iniciar el chat de Tuenti cuando la sección sea visible
  useEffect(() => {
    const section = document.getElementById('conocidos-2010')
    if (!section) return

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTuentiStarted(true)
            obs.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // Lógica del chat de Tuenti
  useEffect(() => {
    if (!tuentiStarted) return

    const timeouts: NodeJS.Timeout[] = []

    const start = () => {
      // Array de mensajes del chat - 3 enviados por Maitane, 1 respuesta de Julen
      const messages = [
        {from: 'out', sender: 'Maitane', text: 'Hola guapo'},
        {from: 'out', sender: 'Maitane', text: 'Me gustas guapo'},
        {from: 'out', sender: 'Maitane', text: '¿quieres quedar un día?'},
        {from: 'in', sender: 'Julen', text: 'Hoy no puedo, me voy a Olabeaga con mis amigos'}
      ];

      // Función para insertar un mensaje en el chat
      const insertMessage = (message: {from: string, sender: string, text: string}, index: number) => {
        const chatBody = document.getElementById('chat-body');
        if (!chatBody) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `tuenti-message ${message.from === 'in' ? 'incoming' : 'outgoing'}`;
        messageDiv.innerHTML = `<div class="tuenti-message-bubble"><span class="tuenti-sender-name">${message.sender}:</span> ${message.text}</div>`;
        
        // Configurar la animación con delay incremental
        messageDiv.style.animationDelay = `${index * 0.9}s`;
        
        chatBody.appendChild(messageDiv);
      };

      // Función para insertar indicador de "escribiendo"
      const insertTypingIndicator = () => {
        const chatBody = document.getElementById('chat-body');
        if (!chatBody) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'tuenti-message incoming';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
          <div class="tuenti-typing-indicator">
            <div class="tuenti-typing-dot"></div>
            <div class="tuenti-typing-dot"></div>
            <div class="tuenti-typing-dot"></div>
          </div>
        `;
        
        // Sin animation delay - debe aparecer inmediatamente cuando se crea
        typingDiv.style.animationDelay = '0s';
        
        chatBody.appendChild(typingDiv);
      };

      // Función para reemplazar indicador con mensaje real
      const replaceTypingWithMessage = (message: {from: string, sender: string, text: string}) => {
        const chatBody = document.getElementById('chat-body');
        const typingIndicator = document.getElementById('typing-indicator');
        
        if (!chatBody || !typingIndicator) return;
        
        // Remover indicador
        chatBody.removeChild(typingIndicator);
        
        // Insertar mensaje real
        const messageDiv = document.createElement('div');
        messageDiv.className = `tuenti-message ${message.from === 'in' ? 'incoming' : 'outgoing'}`;
        messageDiv.innerHTML = `<div class=\"tuenti-message-bubble\"><span class=\"tuenti-sender-name\">${message.sender}:</span> ${message.text}</div>`;
        
        // Sin delay porque aparece inmediatamente después de remover el indicador
        messageDiv.style.animationDelay = '0s';
        
        chatBody.appendChild(messageDiv);
      };

      // Insertar mensajes con delay progresivo
      messages.forEach((message, index) => {
        if (index < 3) {
          // Primeros 3 mensajes (Maitane) - comportamiento normal
          const timeout = setTimeout(() => {
            insertMessage(message, index);
          }, index * 900); // 0.9 segundos de delay entre mensajes
          
          timeouts.push(timeout);
        } else if (index === 3) {
          // Mensaje de Julen - proceso de 2 pasos
          
          // Paso 1: Mostrar indicador de "escribiendo" a los 6.7s
          const typingTimeout = setTimeout(() => {
            insertTypingIndicator();
          }, 6700); // 4700 + 2000ms adicionales
          
          timeouts.push(typingTimeout);
          
          // Paso 2: Reemplazar con mensaje real a los 9s
          const messageTimeout = setTimeout(() => {
            replaceTypingWithMessage(message);
          }, 9000); // 6000 + 2000ms adicionales + 1000ms más de carga
          
          timeouts.push(messageTimeout);
        }
      });
    }

    // Iniciar todo con un retraso inicial de 500ms
    const initialTimeout = setTimeout(start, 300)
    timeouts.push(initialTimeout)

    // Cleanup function para limpiar timeouts
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [tuentiStarted])

  // Removed old dynamic overlay logic; frames are now rendered via FramesOverlay

  // Get current FixedZoom scale factor
  const getCurrentScale = (): number => {
    const fixedLayout = document.getElementById('fixed-layout')
    if (!fixedLayout) return 1
    
    const computedStyle = window.getComputedStyle(fixedLayout)
    const transform = computedStyle.transform
    
    if (transform && transform !== 'none') {
      // Parse matrix(scaleX, 0, 0, scaleY, translateX, translateY)
      const values = transform.match(/matrix\(([^)]+)\)/)
      if (values) {
        const matrix = values[1].split(',').map(v => parseFloat(v.trim()))
        return matrix[0] // scaleX value
      }
    }
    return 1
  }

  const openImage = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // Use viewport coordinates directly for fixed-position modal
    setSelectedImage({ src: e.currentTarget.src, rect })
  }

  const openImageCarousel = (imageSrc: string, imageArray: string[], currentIndex: number, rect: DOMRect) => {
    // Use viewport coordinates directly for fixed-position modal
    setSelectedImage({ src: imageSrc, rect, images: imageArray, currentIndex })
    setModalImageIndex(currentIndex)
  }

  const closeImage = () => {
    setIsClosing(true)
    setIsAnimating(false)
    setTimeout(() => {
      setSelectedImage({ src: null, rect: null })
      setModalImageIndex(0)
      setIsClosing(false)
    }, 300) // Match transition duration
  }

  const nextImage = () => {
    if (!selectedImage.images || selectedImage.images.length <= 1) return
    setModalImageIndex((prevIndex) => {
      const nextIndex = prevIndex === selectedImage.images!.length - 1 ? 0 : prevIndex + 1
      setSelectedImage(prev => ({ 
        ...prev, 
        src: selectedImage.images![nextIndex],
        currentIndex: nextIndex 
      }))
      return nextIndex
    })
  }

  const prevImage = () => {
    if (!selectedImage.images || selectedImage.images.length <= 1) return
    setModalImageIndex((prevIndex) => {
      const nextIndex = prevIndex === 0 ? selectedImage.images!.length - 1 : prevIndex - 1
      setSelectedImage(prev => ({ 
        ...prev, 
        src: selectedImage.images![nextIndex],
        currentIndex: nextIndex 
      }))
      return nextIndex
    })
  }

  const openVideoFromCarousel = (_videoSrc: string, rect: DOMRect) => {
    setSelectedVideo({ src: _videoSrc, rect })
  }

  const closeVideo = () => {
    setIsClosingVideo(true)
    setIsAnimatingVideo(false)
    setTimeout(() => {
      setSelectedVideo({ src: null, rect: null })
      setIsClosingVideo(false)
    }, 300)
  }

  const getCloseButtonStyle = () => {
    if (!selectedImage.images || selectedImage.images.length <= 1) {
      // Para imagen individual
      return {
        top: `calc(${getModalStyle().top ?? '50%'} - 1.25rem)`,
        left: `calc(${getModalStyle().left ?? '50%'} + ${getModalStyle().width ?? '0px'} - 1.25rem)`,
      }
    }
    
    // Para carrusel
    const currentImageSrc = selectedImage.images[modalImageIndex]
    const modalStyle = getModalStyle(currentImageSrc)
    return {
      top: `${window.innerHeight * 0.05 - 24}px`,
      left: `calc(${modalStyle.left ?? '50%'} + ${modalStyle.width ?? '0px'} - 1.25rem)`,
    }
  }

  const getModalStyle = (imageSrc?: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { transition: 'all 0.3s ease-in-out' }

    if (!selectedImage.rect) {
      return { ...baseStyle, opacity: 0, top: '50%', left: '50%', width: '0px', height: '0px' }
    }

    const { top, left, width, height } = selectedImage.rect
    const initialStyle = { top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }

    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Si la imagen viene del carrusel, usar altura auto para mantener proporciones naturales
    const isCarouselImage = selectedImage.images && selectedImage.images.length > 1
    let targetWidth: number
    let targetHeight: number
    
    if (isCarouselImage) {
      // Para imágenes del carrusel, calcular espacio disponible
      const topPosition = screenHeight * 0.05 // 5% desde arriba
      const bottomMargin = screenHeight * 0.05 + 20 // 5% adicional + 20px desde el borde inferior
      const maxAvailableHeight = screenHeight - topPosition - bottomMargin - 60 // 60px menos de altura para más espacio inferior
      const maxAvailableWidth = Math.min(screenWidth * 0.64, 960)
      
      // Todas las imágenes del carrusel tendrán la misma altura máxima
      targetHeight = maxAvailableHeight
      
      // Para imágenes verticales, mantener la misma altura pero ajustar el ancho proporcionalmente
      const isVerticalImage = imageSrc && (
        imageSrc.includes('primeras-escapadas-01') || 
        imageSrc.includes('vertical') ||
        // Aquí se pueden añadir más nombres de imágenes verticales si es necesario
        false
      )
      
      if (isVerticalImage) {
        // Para imágenes verticales, usar un ancho que permita mantener la altura máxima
        // Esto permitirá que la imagen se escale automáticamente manteniendo proporciones
        targetWidth = Math.min(screenWidth * 0.5, 700) // Ancho moderado para verticales
      } else {
        // Para imágenes horizontales, usar el ancho estándar
        targetWidth = maxAvailableWidth
      }
    } else {
      // Para imágenes individuales, mantener proporción 16:9
      targetWidth = Math.min(screenWidth * 0.64, 960)
      targetHeight = targetWidth * (9 / 16)
    }
    
    const finalStyle = {
      // Para imágenes del carrusel, posicionar más arriba (5% desde la parte superior)
      top: isCarouselImage ? `${screenHeight * 0.05}px` : `${(screenHeight - targetHeight) / 2}px`,
      left: `${(screenWidth - targetWidth) / 2}px`,
      width: `${targetWidth}px`,
      height: isCarouselImage ? 'auto' : `${targetHeight}px`,
      maxHeight: isCarouselImage ? `${screenHeight - (screenHeight * 0.05) - (screenHeight * 0.05 + 20) - 60}px` : undefined,
      maxWidth: isCarouselImage ? `${targetWidth}px` : undefined,
    }

    if (isClosing) return { ...baseStyle, ...initialStyle }
    return isAnimating ? { ...baseStyle, ...finalStyle } : initialStyle
  }

  const getVideoModalStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { transition: 'all 0.3s ease-in-out' }
    if (!selectedVideo.rect) {
      return { ...baseStyle, opacity: 0, top: '50%', left: '50%', width: '0px', height: '0px' }
    }
    const { top, left, width, height } = selectedVideo.rect
    const initialStyle = { top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    // Usar proporción 16:9 como base para video
    const targetWidth = Math.min(screenWidth * 0.64, 960)
    const targetHeight = targetWidth * (9 / 16)
    const finalStyle = {
      top: `${(screenHeight - targetHeight) / 2}px`,
      left: `${(screenWidth - targetWidth) / 2}px`,
      width: `${targetWidth}px`,
      height: `${targetHeight}px`,
    }
    if (isClosingVideo) return { ...baseStyle, ...initialStyle }
    return isAnimatingVideo ? { ...baseStyle, ...finalStyle } : initialStyle
  }

  const getVideoCloseButtonStyle = () => {
    const modalStyle = getVideoModalStyle()
    return {
      top: `calc(${modalStyle.top ?? '50%'} - 1.25rem)`,
      left: `calc(${modalStyle.left ?? '50%'} + ${modalStyle.width ?? '0px'} - 1.25rem)`,
    }
  }

  // Unified modal styles
  const getUnifiedModalStyle = (itemSrc?: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { transition: 'all 0.3s ease-in-out' }
    if (!selectedMedia?.rect) {
      return { ...baseStyle, opacity: 0, top: '50%', left: '50%', width: '0px', height: '0px' }
    }
    const { top, left, width, height } = selectedMedia.rect
    const initialStyle = { top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    const topPosition = screenHeight * 0.05
    const bottomMargin = screenHeight * 0.05 + 20
    const maxAvailableHeight = screenHeight - topPosition - bottomMargin - 60
    const maxAvailableWidth = Math.min(screenWidth * 0.64, 960)

    const isVertical = itemSrc && (itemSrc.includes('primeras-escapadas-01') || itemSrc.includes('vertical'))
    const targetHeight = maxAvailableHeight
    const targetWidth = isVertical ? Math.min(screenWidth * 0.5, 700) : maxAvailableWidth

    const finalStyle = {
      top: `${topPosition}px`,
      left: `${(screenWidth - targetWidth) / 2}px`,
      width: `${targetWidth}px`,
      height: 'auto' as const,
      maxHeight: `${maxAvailableHeight}px`,
      maxWidth: `${targetWidth}px`,
    }
    if (isClosingMedia) return { ...baseStyle, ...initialStyle }
    return isAnimatingMedia ? { ...baseStyle, ...finalStyle } : initialStyle
  }

  const getUnifiedCloseButtonStyle = () => {
    const modalStyle = getUnifiedModalStyle()
    return {
      top: `${window.innerHeight * 0.05 - 24}px`,
      left: `calc(${modalStyle.left ?? '50%'} + ${modalStyle.width ?? '0px'} - 1.25rem)`,
    }
  }

  const openUnifiedMediaCarousel = (items: { type: 'image' | 'video', src: string }[], startIndex: number, rect: DOMRect) => {
    setSelectedMedia({ items, startIndex, rect })
  }

  const closeUnifiedMedia = () => {
    setIsClosingMedia(true)
    setIsAnimatingMedia(false)
    setTimeout(() => {
      setSelectedMedia(null)
      setIsClosingMedia(false)
      setMediaActiveIndex(0)
    }, 300)
  }

  const nextMediaItem = () => {
    if (!selectedMedia || selectedMedia.items.length <= 1) return
    setMediaActiveIndex((prev) => (prev === selectedMedia.items.length - 1 ? 0 : prev + 1))
  }

  const prevMediaItem = () => {
    if (!selectedMedia || selectedMedia.items.length <= 1) return
    setMediaActiveIndex((prev) => (prev === 0 ? selectedMedia.items.length - 1 : prev - 1))
  }

  return (
    <div className="bg-ivory text-midnight overflow-x-hidden relative">
      {/* Overlay inline SSR (antes del montaje) para evitar FOUC */}
      {!hasMounted && (
        <div className={`fixed inset-0 z-[1000] ${fadeToBlack ? 'pointer-events-none' : ''}`}>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('/a12.jpg')` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,_#E2A17A,_#BB8269,_#936357,_#432534)] opacity-90" />
          <div className="absolute inset-0 bg-black transition-opacity duration-1000" style={{ opacity: fadeToBlack ? 1 : 0.1 }} />
          <div className="relative z-10 w-full h-full flex items-center justify-center px-6 transition-opacity duration-1000" style={{ opacity: fadeToBlack ? 0 : 1 }}>
            <form
              onSubmit={(e) => { e.preventDefault() }}
              className={`${isShakingOverlay ? 'animate-shake-x' : ''}`}
            >
              <div className="flex items-center">
                <div className="bg-terracotta rounded-full p-1.5 flex items-center">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={inputPass}
                      onChange={(e) => setInputPass(e.target.value)}
                      placeholder="Contraseña"
                      className="rounded-full bg-white text-midnight placeholder-midnight/60 pl-6 pr-12 h-12 w-[260px] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-midnight/60 hover:text-midnight active:scale-95 hover:scale-110 transition-all focus:outline-none"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ml-2 bg-terracotta text-ivory rounded-full w-12 h-12 flex items-center justify-center active:scale-95 hover:scale-110 transition-transform focus:outline-none"
                    aria-label="Entrar"
                  >
                    <Heart className="w-6 h-6 -ml-1 hover:scale-125 transition-transform" />
                  </button>
                </div>
              </div>
              {overlayError && (
                <div className="text-ivory/90 text-sm mt-3 text-center">{overlayError}</div>
              )}
            </form>
          </div>
          <style jsx>{`
            @keyframes shakeX {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-10px); }
              40% { transform: translateX(10px); }
              60% { transform: translateX(-8px); }
              80% { transform: translateX(8px); }
            }
            .animate-shake-x { animation: shakeX 0.6s ease; }
          `}</style>
        </div>
      )}
      {overlayVisible && hasMounted && createPortal((
        <div className={`fixed inset-0 z-[1000] ${fadeToBlack ? 'pointer-events-none' : ''}`}>
          {/* Fondo imagen adaptativo */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('/a12.jpg')` }}
          />
          {/* Gradiente como en la sección final */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,_#E2A17A,_#BB8269,_#936357,_#432534)] opacity-90" />
          {/* Capa negra con fade de 1s completo */}
          <div className="absolute inset-0 bg-black transition-opacity duration-1000" style={{ opacity: fadeToBlack ? 1 : 0.1 }} />

          {/* Contenido central */}
          <div className="relative z-10 w-full h-full flex items-center justify-center px-6 transition-opacity duration-1000" style={{ opacity: fadeToBlack ? 0 : 1 }}>
            <form
              onSubmit={handleOverlaySubmit}
              className={`${isShakingOverlay ? 'animate-shake-x' : ''}`}
            >
              <div className="flex items-center">
                {/* Contenedor terracotta */}
                <div className="bg-terracotta rounded-full p-1.5 flex items-center">
                  <div className="relative">
                    {/* Input blanco */}
                    <input
                      type={showPassword ? "text" : "password"}
                      value={inputPass}
                      onChange={(e) => setInputPass(e.target.value)}
                      placeholder="Contraseña"
                      className="rounded-full bg-white text-midnight placeholder-midnight/60 pl-6 pr-12 h-12 w-[260px] focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleOverlaySubmit() }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-midnight/60 hover:text-midnight active:scale-95 hover:scale-110 transition-all focus:outline-none"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {/* Botón circular */}
                  <button
                    type="submit"
                    className="ml-2 bg-terracotta text-ivory rounded-full w-12 h-12 flex items-center justify-center active:scale-95 hover:scale-110 transition-transform focus:outline-none"
                    aria-label="Entrar"
                  >
                    <Heart className="w-6 h-6 -ml-1 hover:scale-125 transition-transform" />
                  </button>
                </div>
              </div>
              {overlayError && (
                <div className="text-ivory/90 text-sm mt-3 text-center">{overlayError}</div>
              )}
            </form>
          </div>

          {/* Animaciones locales */}
          <style jsx>{`
            @keyframes shakeX {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-10px); }
              40% { transform: translateX(10px); }
              60% { transform: translateX(-8px); }
              80% { transform: translateX(8px); }
            }
            .animate-shake-x { animation: shakeX 0.6s ease; }
          `}</style>
        </div>
      ), document.body)}
      {/* Static frames overlay, above base content but below modal/video */}
      {!overlayVisible && <FramesOverlay />}
      {/* Image Modal via portal to escape transformed ancestors */}
      {selectedImage.src && createPortal(
        (
        <div 
          className={`fixed inset-0 bg-black z-[100] transition-opacity duration-300 ${isAnimating && !isClosing ? 'bg-opacity-75' : 'bg-opacity-0'}`}
          onClick={closeImage}
        >
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
            {/* Render all carousel images with fade or single image */}
            {selectedImage.images && selectedImage.images.length > 1 ? (
              selectedImage.images.map((image, index) => (
                <div
                  key={`modal-container-${image}-${index}`}
                  className="absolute rounded-2xl shadow-2xl overflow-hidden"
                  style={{
                    ...getModalStyle(image),
                    backgroundColor: '#ffffff',
                    opacity: index === modalImageIndex ? 1 : 0,
                    transition: 'opacity 1.5s ease-in-out, all 0.3s ease-in-out',
                    zIndex: index === modalImageIndex ? 20 : 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={image}
                    alt={`Vista ampliada - Imagen ${index + 1}`}
                      className="max-w-full max-h-full object-contain"
                    style={{
                        borderRadius: '1rem'
                    }}
                  />
                </div>
              ))
            ) : (
                <div
                  className="absolute rounded-2xl shadow-2xl overflow-hidden"
                  style={{ ...getModalStyle(), backgroundColor: '#ffffff' }}
                >
                  <img 
                    src={selectedImage.src} 
                    alt="Vista ampliada" 
                    className="w-full h-full object-cover"
                    style={{
                      borderRadius: '1rem'
                    }}
                  />
                </div>
            )}
            <button
              onClick={closeImage}
              className={`absolute w-12 h-12 bg-terracotta rounded-full flex items-center justify-center shadow-lg text-ivory transition-all duration-300 hover:scale-110 ${isAnimating && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
              style={{
                ...getCloseButtonStyle(),
                zIndex: 101
              }}
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Navigation buttons for carousel */}
            {selectedImage.images && selectedImage.images.length > 1 && (
              <>
                {/* Previous button */}
                <button
                  onClick={prevImage}
                  className={`absolute w-8 h-8 bg-terracotta/80 hover:bg-terracotta rounded-full flex items-center justify-center shadow-lg text-ivory transition-all duration-300 hover:scale-110 ${isAnimating && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                  style={{
                    top: '50%',
                    left: '20px',
                    transform: 'translateY(-50%)',
                    zIndex: 101
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {/* Next button */}
                <button
                  onClick={nextImage}
                  className={`absolute w-8 h-8 bg-terracotta/80 hover:bg-terracotta rounded-full flex items-center justify-center shadow-lg text-ivory transition-all duration-300 hover:scale-110 ${isAnimating && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                  style={{
                    top: '50%',
                    right: '20px',
                    transform: 'translateY(-50%)',
                    zIndex: 101
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        ),
        document.body
      )}

      {/* Video Modal via portal */}
      {selectedVideo.src && createPortal(
        (
        <div 
          className={`fixed inset-0 bg-black z-[100] transition-opacity duration-300 ${isAnimatingVideo && !isClosingVideo ? 'bg-opacity-75' : 'bg-opacity-0'}`}
          onClick={closeVideo}
        >
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
              <div
                className="absolute rounded-2xl shadow-2xl overflow-hidden bg-white"
                style={{ ...getVideoModalStyle() }}
              >
                <video
                  ref={modalVideoRef}
                  src={selectedVideo.src || undefined}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={closeVideo}
                className={`absolute w-12 h-12 bg-terracotta rounded-full flex items-center justify-center shadow-lg text-ivory transition-all duration-300 hover:scale-110 ${isAnimatingVideo && !isClosingVideo ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                style={{
                  ...getVideoCloseButtonStyle(),
                  zIndex: 101
                }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
        </div>
        ),
        document.body
      )}

      {/* Unified Media Modal (images + video, no interactions on video) */}
      {selectedMedia && createPortal(
        (
        <div 
          className={`fixed inset-0 bg-black z-[100] transition-opacity duration-300 ${isAnimatingMedia && !isClosingMedia ? 'bg-opacity-75' : 'bg-opacity-0'}`}
          onClick={closeUnifiedMedia}
        >
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
              {/* Render all media items with fade, advancing index */}
              {selectedMedia.items.map((item, index) => (
                <div
                  key={`unified-${item.type}-${item.src}-${index}`}
                  className="absolute rounded-2xl shadow-2xl overflow-hidden"
                  style={{
                    ...getUnifiedModalStyle(item.src),
                    backgroundColor: '#ffffff',
                    opacity: index === mediaActiveIndex ? 1 : 0,
                    transition: 'opacity 1.5s ease-in-out, all 0.3s ease-in-out',
                    zIndex: index === mediaActiveIndex ? 20 : 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.src}
                      alt={`Vista ampliada - Media ${index + 1}`}
                      className="max-w-full max-h-full object-contain"
                      style={{ borderRadius: '1rem' }}
                    />
                  ) : (
                    <video
                      ref={(el) => { mediaVideoRefs.current[index] = el }}
                      src={item.src}
                      playsInline
                      muted
                      controls={false}
                      className="max-w-full max-h-full object-contain"
                      style={{ borderRadius: '1rem', pointerEvents: 'none' }}
                    />
                  )}
                </div>
              ))}
              <button
                onClick={closeUnifiedMedia}
                className={`absolute w-12 h-12 bg-terracotta rounded-full flex items-center justify-center shadow-lg text-ivory transition-all duration-300 hover:scale-110 ${isAnimatingMedia && !isClosingMedia ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                style={{
                  ...getUnifiedCloseButtonStyle(),
                  zIndex: 101
                }}
              >
                <X className="w-6 h-6" />
              </button>
              
              {/* Navigation buttons for unified media carousel */}
              {selectedMedia && selectedMedia.items.length > 1 && (
                <>
                  {/* Previous button */}
                  <button
                    onClick={prevMediaItem}
                    className={`absolute w-8 h-8 bg-terracotta/80 hover:bg-terracotta rounded-full flex items-center justify-center shadow-lg text-ivory transition-all duration-300 hover:scale-110 ${isAnimatingMedia && !isClosingMedia ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                    style={{
                      top: '50%',
                      left: '20px',
                      transform: 'translateY(-50%)',
                      zIndex: 101
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Next button */}
                  <button
                    onClick={nextMediaItem}
                    className={`absolute w-8 h-8 bg-terracotta/80 hover:bg-terracotta rounded-full flex items-center justify-center shadow-lg text-ivory transition-all duration-300 hover:scale-110 ${isAnimatingMedia && !isClosingMedia ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                    style={{
                      top: '50%',
                      right: '20px',
                      transform: 'translateY(-50%)',
                      zIndex: 101
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
        </div>
        ),
        document.body
      )}

      {/* Hero Section */}
      <section className="relative py-32 bg-gradient-to-br from-terracotta to-sage overflow-hidden" style={{ height: 'var(--hero-height, 680px)' }}>
        <div
          ref={heroRef}
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url('/2_9_imageninicial.png')`,
          }}
        />
        <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 text-center text-ivory px-4 flex flex-col justify-center h-full" style={{ marginTop: '30px' }}>
          <div className="mb-8">
              <Heart className="w-16 h-16 mx-auto mb-0 animate-pulse" style={{ marginTop: '0px' }} />
          </div>
          <div className="inline-block mx-auto px-6 py-2">
            <h1 className="text-8xl font-bold mb-4 font-elegant">Maitane & Julen</h1>
            <p
              className="text-2xl max-w-3xl mx-auto font-manuscript hero-intro-text"
              style={{
                // Ancho un poco mayor (max-w-3xl) y márgenes extra arriba y abajo
                
                marginTop: '2.25rem',
                marginBottom: '4.5rem',
                // Permite ajustar manualmente el tamaño si se desea (1 = por defecto)
                // Cambia este valor para escalar solo este texto
                // @ts-ignore
                ['--hero-intro-scale' as any]: 1,
                // Interlineado algo mayor para esta intro
                // @ts-ignore
                ['--hero-intro-leading' as any]: 1.4,
                lineHeight: 'var(--hero-intro-leading, 1.6)',
              }}
            >
              Con toda la ilusion del mundo hemos tejido este pequeño regalo: un mosaico de risas y recuerdos para agradeceros el amor, la alegría y la inspiración que sembrais en cada uno de nosotros. Que estos pedacitos de vuestra vida os devuelvan multiplicado el cariño que hoy nos une para celebrar vuestra historia.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Sections */}
      <div 
        className="w-full relative"
        style={{
          backgroundColor: '#fff9f4',
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/sandpaper.png")',
          backgroundRepeat: 'repeat',
          backgroundSize: '35%',
          backgroundAttachment: 'local',
          opacity: 1
        }}
      >
        {/* OVERLAY DE TEXTURA - Ahora con z-0 para que esté en el fondo */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/sandpaper.png")',
            backgroundRepeat: 'repeat',
            backgroundSize: '35%',
            backgroundAttachment: 'local',
            opacity: 0.4,
            mixBlendMode: 'luminosity'
          }}
        />
        
        {/* Flores decorativas en las esquinas */}
        <img 
          src="/flores/sup_izq.png" 
          alt="" 
          className="absolute top-12 left-12 w-48 h-48 opacity-70 z-10 pointer-events-none"
        />
        <img 
          src="/flores/sup_der.png" 
          alt="" 
          className="absolute top-12 right-12 w-48 h-48 opacity-70 z-10 pointer-events-none"
        />
        <img 
          src="/flores/inf_izq.png" 
          alt="" 
          className="absolute bottom-12 left-12 w-48 h-48 opacity-70 z-10 pointer-events-none"
        />
        <img 
          src="/flores/inf_der.png" 
          alt="" 
          className="absolute bottom-12 right-12 w-48 h-48 opacity-70 z-10 pointer-events-none"
        />
        
        <div className="max-w-7xl mx-auto px-4 py-32 relative z-20">
        {/* 2010 - Conocidos - Chat Tuenti */}
        <section id="conocidos-2010" className="timeline-item mb-32 grid grid-cols-12 sm:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out pt-24">
          <div className="col-span-6 pr-8">
            {/* Chat de Tuenti */}
            <div className="p-6">
              <div className="tuenti-chat rounded-2xl custom-shadow-right-bottom hover:custom-shadow-right-bottom-hover transition-all duration-500 overflow-hidden" id="tuenti-chat-widget">
                <div className="tc-header">
                  <div className="tc-status" id="status-dot"></div>
                  <span className="tc-title">Julen Baños Martín</span>
                  <div className="tc-window-controls">
                    <button className="tc-btn tc-minimize" title="Minimizar">−</button>
                    <button className="tc-btn tc-maximize" title="Maximizar">□</button>
                    <button className="tc-btn tc-close" title="Cerrar">×</button>
                  </div>
                </div>
                <div className="tc-body" id="chat-body">
                  {/* Aquí se insertarán las burbujas via JavaScript */}
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-6 pl-8">
            <div className="flex items-center mb-6">
              <div className="timeline-icon-circle bg-terracotta mr-4">
                <svg className="w-6 h-6" viewBox="145.5 144.8 609 609.7" xmlns="http://www.w3.org/2000/svg">
                  <path d="m269.2 146.1c-64.7 6.2-109.9 47.5-121.4 111l-2.3 12.4v360l2.3 12.6c5.7 31.6 17.9 55 39.3 75.4 17.5 16.7 39.4 28 63.8 32.9 19.7 4 23.3 4.1 201.1 4.1 161 0 172.2-.1 183.5-1.8 36.1-5.5 60.5-17.3 81.6-39.4 19.1-20 29.9-42 35.2-71.7l2.2-12.1v-361l-2.3-12c-5.9-31-18.9-55.8-39.3-75-22-20.6-48.3-31.9-82.9-35.5-11.5-1.2-348.5-1.1-360.8.1zm262.8 129.6c5.9 2.7 8.6 5.3 14.7 13.8 21.3 30 37.8 73.7 44.4 117.5 3.1 21 3.2 56.1 0 78-5.6 39.6-17.9 74.3-38.3 108.6-11.4 19.2-19 25.3-32.3 26.2-17.5 1.1-32.2-11.8-33.3-29.2-.6-9.6.6-13.3 8.4-25.6 46.2-73.1 45.6-168.9-1.6-240-5.8-8.7-7.3-13.8-6.8-22.2.9-13.8 9.4-24.5 22.8-28.9 4.4-1.5 17.1-.4 22 1.8zm-135 37.7c32 6.9 42.9 47.6 18.8 70.2-20.4 19-53.1 12.9-65.5-12.4-3.6-7.2-3.8-8.1-3.8-17.1 0-12.9 2.5-19.7 10.7-28.5 10.5-11.6 23.8-15.6 39.8-12.2zm1.8 154.1c7.3 2.2 15 8.8 18.7 16 2.7 5.3 3 6.8 3 14.9v9.1l-7.2 14.5c-3.9 8-12.1 24.8-18.2 37.5-20.4 41.9-22.1 45.1-26.4 49.3-7.1 6.9-11.8 8.7-22.2 8.7-7.8 0-9.7-.4-14.7-2.8-6.3-3.1-11.5-8.5-15-15.6-1.8-3.7-2.2-6.3-2.3-13.1v-8.5l8.2-17c9.4-19.8 32.1-66.3 36.5-75 4.7-9.4 11.9-15.8 20.8-18.6 4.3-1.3 13.4-1 18.8.6z" 
                        fill="white"/>
                </svg>
              </div>
              <h3 className="text-5xl font-script text-terracotta">Los inicios... · 2009</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Todo empezó con un reto entre amigas, donde Maitane se fijó en Julen y se armó de valor para hablarle por Tuenti. Después de varios intentos, finalmente acabaron quedando y cuando ya estaban frente a frente Maitane pensó: "¿y ahora que?" 😨 Y a partir de aquel 17 de enero de 2009 comenzó todo….
            </p>
          </div>
        </section>

        {/* 2012 - Amigos inseparables */}
        <section className="timeline-item mb-32 grid grid-cols-12 sm:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="col-span-6 pr-12">
            <div className="flex items-center mb-6">
              <div className="timeline-icon-circle bg-escape mr-4">
                <img src="/pareja4.svg" alt="Pareja" className="w-8 h-8" />
              </div>
              <h3 className="text-5xl font-script text-escape">Primeras escapadas</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Al principio mantuvieron la relación en secreto; cuando quedaban mentían a sus padres, hasta que un día les pillaron y tuvieron que dar la cara. Poco a poco se consolidó, pese a alguna crisis, y llegaron los primeros viajes: con el carnet recién sacado, Julen pedía el coche para ir a la playa con Maitane, luego a Noja y, más tarde, su primer vuelo a Mallorca 🏝️. También viajó a Málaga sin que ella lo supiera para sorprenderla y pasar unos días juntos ❤️.
            </p>
          </div>
          <div className="col-span-6">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                <div style={{ height: 'calc(384px - 0px)', overflow: 'hidden', position: 'relative' }}>
                  <ImageCarousel
                    images={[
                      "/primeras-escapadas-01.png",
                      "/experiences/experience-02/primeras-escapadas-02.jpg",
                      "/experiences/experience-02/primeras-escapadas-03.jpg",
                      "/experiences/experience-02/escapadas.png",
                      "/experiences/experience-02/escapadas2.png"
                    ]}
                    alt="Primeras escapadas"
                    experienceId="02"
                    onImageClick={(imageSrc, imageArray, currentIndex, rect) => {
                      openImageCarousel(imageSrc, imageArray, currentIndex, rect)
                    }}
                    data-frame-anchor="carousel-frame-anchor"
                  />
                  
                </div>
                
              </div>
            </div>
          </div>
        </section>

        {/* 2015-2018 - Estudios universitarios */}
        <section className="timeline-item mb-32 grid grid-cols-12 sm:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="col-span-6 order-1">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                <div className="overflow-hidden" style={{ height: 'calc(384px - 0px)', overflow: 'hidden', position: 'relative' }}>
                  <ImageCarousel
                    images={[
                      "/estudios/ESTUDIOS.jpeg",
                      "/estudios/ESTUDIOS.png",
                      "/estudios_.png",
                      "/estudios_2.png",
                      "/mir/MIR4.jpeg",
                    ]}
                    alt="Estudios universitarios"
                    experienceId="estudios"
                    onImageClick={(imageSrc, imageArray, currentIndex, rect) => {
                      openImageCarousel(imageSrc, imageArray, currentIndex, rect)
                    }}
                    data-frame-anchor="carousel-frame-anchor-estudios"
                  />
                  
                </div>
                
                
              </div>
            </div>
          </div>
          <div className="col-span-6 order-2 pl-12">
            <div className="flex items-center mb-6">
              <div className="timeline-icon-circle bg-terracotta mr-4">
                <BookOpen className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-5xl font-script text-terracotta">Estudios universitarios</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Julen y Maitane se conocieron en la ikastola Kirikiño, donde estudiaron juntos. Julen cursó un grado en Publicidad y Recursos Humanos. Maitane, con vocación médica, afrontó un camino más duro: no logró la nota para Medicina, entró en Odontología y, tras un año, inició por fin Medicina. Fueron años exigentes📚: la distancia y el ritmo de estudio convertían cada encuentro en un esfuerzo compartido. Ella pasaba horas entre libros; él compaginaba clases con entrenamientos y partidos de fútbol⚽.
            </p>
          </div>
        </section>

        {/* 2019-2022 - Oposiciones de policía */}
        <section className="timeline-item mb-32 grid grid-cols-12 sm:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="col-span-6 pr-12">
            <div className="flex items-center mb-6">
              <div className="timeline-icon-circle bg-midnight mr-4">
                <Star className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-5xl font-script text-midnight">Oposiciones de policía · 2019-2022</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Al terminar el grado, Julen sorprendió a todos inscribiéndose a oposiciones de Policía Local de Bilbao👮‍♂️, sin contarlo ni a su padre, que había ocupado ese puesto durante años. Se volcó: horas de estudio, recorridos por Bilbao para memorizar calles, apoyo de Maitane en el temario y entrenamiento físico riguroso. Incluso dejó el fútbol para evitar lesiones. Aprobó la oposición y, tras siete meses de academia, empezó de policía con 24 años💪.
            </p>
          </div>
          <div className="col-span-6">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                <div className="rounded-2xl" style={{ height: 'calc(384px - 0px)', overflow: 'hidden', position: 'relative' }}>
                  <ImageCarousel
                    images={[
                      "/estudios-oposiciones-01.png",
                      "/estudios-oposiciones-02.jpg",
                      "/estudios-oposiciones-03.png",
                      "/estudios-oposiciones-04.png",
                      "/policia/POLICIA.png"
                    ]}
                    alt="Oposiciones de policía"
                    experienceId="03"
                    onImageClick={(imageSrc, imageArray, currentIndex, rect) => {
                      openImageCarousel(imageSrc, imageArray, currentIndex, rect)
                    }}
                    data-frame-anchor="frame-anchor-policia"
                  />
                  
                </div>
                
                
              </div>
            </div>
          </div>
        </section>

        {/* 2020-2023 - MIR  */}
        <section className="timeline-item mb-32 grid grid-cols-12 sm:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="col-span-6 order-1">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                <div className="overflow-hidden rounded-2xl" style={{ height: 'calc(384px - 0px)', overflow: 'hidden', position: 'relative' }}>
                  <ImageCarousel
                    images={[
                      "/mir/MIR.png",
                      "/mir/MIR2.png",
                      "/mir/MIR3.png",
                      "/medicina-graduacion.png",
                    ]}
                    alt="MIR"
                    experienceId="mir"
                    onImageClick={(imageSrc, imageArray, currentIndex, rect) => {
                      openImageCarousel(imageSrc, imageArray, currentIndex, rect)
                    }}
                    data-frame-anchor="frame-anchor-medicina"
                  />
                  
                </div>
                
                
              </div>
            </div>
          </div>
          <div className="col-span-6 order-2 pl-12">
            <div className="flex items-center mb-6">
              <div className="timeline-icon-circle bg-moss mr-4">
                <Heart className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-5xl font-script text-moss">MIR · 2020-2023</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Mientras tanto, Maitane seguía volcada en su carrera🩺. La exigencia continuó tras titularse: para ejercer en la sanidad pública y quedarse cerca de Julen, necesitaba buena nota en el MIR. Eso implicó un año de estudio intensivo📖, casi sin pausas. Julen, cuando no trabajaba, aprovechaba cada respiro para acompañarla unos minutos y apoyarla. Aunque no logró el objetivo a la primera, repitió otro año con mayor serenidad. Fue una prueba de amor y compromiso mutuo.
            </p>
          </div>
        </section>

        {/* 2017 - Reencuentro en París */}
        <section className="timeline-item mb-32 grid grid-cols-12 sm:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="col-span-6 pr-12">
            <div className="flex items-center mb-6">
              <div className="timeline-icon-circle bg-pine mr-4">
                <Sun className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-5xl font-script text-pine">Hobbies</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Los hobbies son clave para la salud física y mental: permiten salir de las “obligaciones” y disfrutar por elección. A lo largo de su vida, Julen y Maitane han tenido varios. A Maitane le gustan la decoración y la pintura🎨, y durante años practicó equitación, actividad que añora y retomaría si pudiera. Hoy Julen dedica horas al crossfit, aunque durante mucho tiempo su gran pasión fue el fútbol⚽: vivía pegado al balón y disfrutaba chutar y marcar.
            </p>
          </div>
          <div className="col-span-6">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                <div className="overflow-hidden" style={{ height: 'calc(384px - 0px)', overflow: 'hidden', position: 'relative' }}>
                  <ImageCarousel
                    images={[
                      "/hobbies/HOBBIES.jpeg",
                      "/hobbies/HOBBIES.png",
                      "/hobbie_.png",
                      "/hobbie_2.png",
                      "/hobbies/HOBBIE_FUTBOL.jpeg",
                    ]}
                    alt="Hobbies"
                    experienceId="hobbies"
                    onImageClick={(imageSrc, imageArray, currentIndex, rect) => {
                      openImageCarousel(imageSrc, imageArray, currentIndex, rect)
                    }}
                    data-frame-anchor="carousel-frame-anchor-hobbies"
                  />
                  
                </div>
                
              </div>
            </div>
          </div>
        </section>

        {/* Independizarse */}
        <section className="timeline-item mb-32 grid grid-cols-12 sm:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="col-span-6 order-1">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                <div className="overflow-hidden" style={{ height: 'calc(384px - 0px)', overflow: 'hidden', position: 'relative' }}>
                  <ImageCarousel
                    images={[
                      "/independizarse/INDEP.png",
                      "/independizarse/INDEP2.png",
                      "/independizarse/INDEP3.png",
                      "/independizarse/INDEP4.png",
                      "/independizarse/INDEP5.png",
                      "/independizarse/INDEP6.png",
                      "/independizarse/casa.png",
                    ]}
                    alt="Independizarse"
                    experienceId="independizarse"
                    onImageClick={(imageSrc, imageArray, currentIndex, rect) => {
                      openImageCarousel(imageSrc, imageArray, currentIndex, rect)
                    }}
                    data-frame-anchor="carousel-frame-anchor-indep"
                  />
                  
                </div>
                
              </div>
            </div>
          </div>
          <div className="col-span-6 order-2 pl-12">
            <div className="flex items-center mb-6">
              <div className="timeline-icon-circle bg-terracotta mr-4">
                <MapPin className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-5xl font-script text-terracotta">Independizarse</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Tras 12 años juntos, con Julen asentado en su trabajo y Maitane centrada en su segundo MIR, sintieron que necesitaban más tiempo y decidieron buscar su primer "nidito de amor"🏠. Vieron la opción de instalarse en un piso de la prima de Maitane, antes de su abuela, y tras adaptarlo iniciaron su vida como pareja independizada. Todo marchó de maravilla, eran felices y empezaron a vislumbrar sus años compartiéndolo todo. Maitane realizó el examen que le abrió la posibilidad de quedarse en Bilbao y añadieron a la pareja algo que les dio un plus de felicidad, Ilun🐶.
            </p>
          </div>
        </section>

        {/* Ilun */}
        <section className="timeline-item mb-32 grid grid-cols-12 sm:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="col-span-6 pr-12">
            <div className="flex items-center mb-6">
              <div className="timeline-icon-circle bg-moss mr-4">
                <PawPrint className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-5xl font-script text-moss">Ilun</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Ilun nació el 25 de agosto de 2021🐾. Antes ya habían decidido que querían un labrador retriever chocolate🤎. Lo recogieron en Espinosa de los Monteros y camino a casa ya estaban llenos de amor. La familia se llevó una gran sorpresa al encontrarlo en su camita en la casa de Trauko. De cachorro hizo travesuras pero le enseñaron a comportarse para una buena convivencia. Lo más difícil sigue siendo que mantenga la compostura con comida cerca. Tras cuatro años sigue siendo un amor. Es dócil, juguetón, tranquilo y sociable, se adapta a todo y puede ir a cualquier sitio. Julen y Maitane disfrutan de su compañía y él les muestra lo feliz que es. Con Ilun son una pareja de tres.
            </p>
          </div>
          <div className="col-span-6">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                <div className="overflow-hidden" style={{ height: 'calc(384px - 0px)', overflow: 'hidden', position: 'relative' }}>
                  <ImageCarousel
                    media={[
                      { type: 'image', src: '/ilun/ILUN.png' },
                      { type: 'image', src: '/ilun/ILUN2.png' },
                      { type: 'image', src: '/ilun_.jpeg' },
                      { type: 'image', src: '/ilun_2.png' },
                      { type: 'image', src: '/ilun/ILUN3.png' },
                      { type: 'image', src: '/ilun_3.png' },
                      { type: 'image', src: '/ilun/ILUN4.png' },
                      { type: 'image', src: '/ilun_4.png' },
                      { type: 'image', src: '/ilun/ILUN5.png' },
                      { type: 'image', src: '/ilun_5.png' },
                      { type: 'image', src: '/ilun/ILUN_01.jpeg' },
                      { type: 'image', src: '/ilun_6.png' },
                      { type: 'video', src: 'https://res.cloudinary.com/dgevq0wwq/video/upload/v1755357104/VID-20250816-WA0014_fwf3ov.mp4' },
                      { type: 'image', src: '/ilun/ILUN6.png' },
                      { type: 'image', src: '/ilun/ILUN7.png' },
                      { type: 'image', src: '/ilun/ILUN8.png' },
                      { type: 'image', src: '/ilun/ILUN9.png' },
                      { type: 'image', src: '/ilun/ILUN10.png' },
                    ]}
                    alt="Ilun"
                    experienceId="ilun"
                    onImageClick={(imageSrc, imageArray, currentIndex, rect) => {
                      openImageCarousel(imageSrc, imageArray, currentIndex, rect)
                    }}
                    onVideoClick={(videoSrc, rect) => {
                      openVideoFromCarousel(videoSrc, rect)
                    }}
                    onOpenMediaCarousel={(items, startIndex, rect) => {
                      openUnifiedMediaCarousel(items, startIndex, rect)
                    }}
                    data-frame-anchor="carousel-frame-anchor-ilun"
                  />
                  
                </div>
                
              </div>
            </div>
          </div>
        </section>

        {/* Pedida de mano */}
        <section className="timeline-item mb-32 grid grid-cols-12 sm:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="col-span-6 order-1">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                <div className="overflow-hidden" style={{ height: 'calc(384px - 0px)', overflow: 'hidden', position: 'relative' }}>
                  <ImageCarousel
                    images={[
                      "/pedida/PEDIDA_MANO.png",
                    ]}
                    alt="Pedida de mano"
                    experienceId="pedida"
                    onImageClick={(imageSrc, imageArray, currentIndex, rect) => {
                      openImageCarousel(imageSrc, imageArray, currentIndex, rect)
                    }}
                    data-frame-anchor="carousel-frame-anchor-pedida"
                  />
                  
                </div>
                
              </div>
            </div>
          </div>
          <div className="col-span-6 order-2 pl-12">
            <div className="flex items-center mb-6">
              <div className="timeline-icon-circle bg-midnight mr-4">
                <img src="/pedida/anillos.svg" className="w-7 h-5" alt="Anillos" />
              </div>
              <h3 className="text-5xl font-script text-midnight">Pedida de mano</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              En cuanto tuvieron su vivienda en Bolueta, en febrero de 2022, Julen, Maitane e Ilun se mudaron. Antes de entrar distribuyeron el piso a su gusto y añadieron muebles, accesorios y detalles hasta crear un hogar acogedor y con personalidad para los tres. Además de disfrutarlo, han recibido a familia y amigos, que aprecian el piso y a sus anfitriones. Ya asentados, llegó el momento de avanzar. El 9 de enero de 2024, día que Maitane cumplía 29, Julen se arrodilló y le pidió matrimonio💍. Ella dijo que sí. Durante 19 meses han organizado el gran día. Hoy, 23 de agosto de 2025, nos reunimos para celebrar que su amor, nacido hace 16 años, sigue como al principio y con la ilusión de seguir haciendo grandes cosas juntos✨.
            </p>
          </div>
        </section>
        </div>
        
        
      </div>

      {/* Final Section - Video */}
      <section 
        id="final-video-section"
        ref={finalSectionRef}
        className="relative py-32 bg-midnight text-center overflow-hidden"
        style={{ minHeight: '600px' }}
      >
        <div
          ref={finalSectionImageRef}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/a12.jpg)' }}
        />
        <div 
          ref={finalSectionBgRef}
          className="absolute inset-0 bg-[linear-gradient(to_bottom_right,_#E2A17A,_#BB8269,_#936357,_#432534)] opacity-90"
        />
        <div className={`relative z-[80] text-ivory px-4 max-w-4xl w-full mx-auto transition-all duration-700 ease-in-out ${showVideo ? 'py-20' : ''}`}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <h2 className="text-7xl font-script">Nuestro Video</h2>
              <Heart className="w-10 h-10 ml-4 text-ivory" />
            </div>
          </div>

          {!showVideo && (
            <button 
              onClick={() => {
                setShowVideo(true)
                // Scroll automático 60px hacia abajo después de la animación
                setTimeout(() => {
                  window.scrollBy({
                    top: 160,
                    behavior: 'smooth'
                  })
                }, 750) // Esperar 750ms para que termine la animación de 700ms
              }}
              className="bg-terracotta hover:bg-terracotta/90 text-ivory px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
            >
              <Video className="w-6 h-6" />
              Ver Video
            </button>
          )}

          <div className={`w-full max-w-4xl transition-all duration-700 ease-in-out ${showVideo ? 'max-h-[600px] mt-8' : 'max-h-0 overflow-hidden'}`}>
            <div className="p-6">
              <div className="overflow-hidden rounded-2xl custom-shadow-right-bottom-large hover:custom-shadow-right-bottom-large-hover transition-all duration-500">
                <iframe
                  ref={videoRef}
                  src="https://drive.google.com/file/d/1MoYgCEV_2CkhkUU8jZjIK9ZU5WXqbFGN/preview"
                  title="Video de la boda"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full aspect-video"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
