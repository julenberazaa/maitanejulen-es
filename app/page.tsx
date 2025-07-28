"use client"

import { useEffect, useRef, useState } from "react"
import { Heart, Plane, MapPin, Camera, Video, Sun, Star, Ship, BellRingIcon as Ring, BookOpen, PartyPopper, X, PawPrint } from "lucide-react"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import ImageCarousel from "@/components/image-carousel"

interface ImageState {
  src: string | null
  rect: DOMRect | null
  images?: string[]
  currentIndex?: number
}


export default function TimelinePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const finalSectionRef = useRef<HTMLElement>(null)
  const finalSectionBgRef = useRef<HTMLDivElement>(null)
  const finalSectionImageRef = useRef<HTMLDivElement>(null)
  const [selectedImage, setSelectedImage] = useState<ImageState>({ src: null, rect: null })
  const [isAnimating, setIsAnimating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const isMobile = useMediaQuery('(max-width: 768px)')

  useEffect(() => {
    if (selectedImage.src) {
      const timer = setTimeout(() => {
        setIsAnimating(true)
      }, 10) // Short delay to allow initial state to render
      return () => clearTimeout(timer)
    }
  }, [selectedImage.src])

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
      }, 3500) // Match carousel timing

      return () => clearInterval(interval)
    }
  }, [selectedImage.images])

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play()
    }
  }, [showVideo])

  useEffect(() => {
    // Position all frames dynamically
    const positionAllFrames = () => {
      // Position carousel frame
      const carouselAnchor = document.getElementById('carousel-frame-anchor')
      const carouselFrame = document.getElementById('carousel-frame-image')
      
      if (carouselAnchor && carouselFrame) {
        const rect = carouselAnchor.getBoundingClientRect()
        carouselFrame.style.left = `${rect.left}px`
        carouselFrame.style.top = `${rect.top}px`
        carouselFrame.style.width = `${rect.width}px`
        carouselFrame.style.height = `${rect.height + 2}px`
        carouselFrame.style.opacity = '1'
      }

      // Position individual image frames
      const imageIds = ['a3', 'a4', 'a5', 'a6', 'a7', 'a11', 'a8', 'a9', 'a10']
      imageIds.forEach(imageId => {
        const anchor = document.getElementById(`image-frame-anchor-${imageId}`)
        const frame = document.getElementById(`image-frame-${imageId}`)
        
        if (anchor && frame) {
          const rect = anchor.getBoundingClientRect()
          frame.style.left = `${rect.left}px`
          frame.style.top = `${rect.top}px`
          frame.style.width = `${rect.width}px`
          frame.style.height = `${rect.height + 2}px`
          frame.style.opacity = '1'
        }
      })
    }

    // Position on load and scroll
    positionAllFrames()
    window.addEventListener('scroll', positionAllFrames)
    window.addEventListener('resize', positionAllFrames)

    // Initialize scroll animations
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

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("scroll", positionAllFrames)
      window.removeEventListener("resize", positionAllFrames)
      observer.disconnect()
    }
  }, [])

  // Lógica del chat de Tuenti
  useEffect(() => {
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
      messageDiv.innerHTML = `<div class="tuenti-message-bubble"><span class="tuenti-sender-name">${message.sender}:</span> ${message.text}</div>`;
      
      // Sin delay porque aparece inmediatamente después de remover el indicador
      messageDiv.style.animationDelay = '0s';
      
      chatBody.appendChild(messageDiv);
    };

    // Insertar mensajes con delay progresivo
    const timeouts: NodeJS.Timeout[] = [];
    messages.forEach((message, index) => {
      if (index < 3) {
        // Primeros 3 mensajes (Maitane) - comportamiento normal
        const timeout = setTimeout(() => {
          insertMessage(message, index);
          
                  // Status dot ya no parpadea como se solicitó
          

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

    // Cleanup function para limpiar timeouts
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [])

  const openImage = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isMobile) return
    const rect = e.currentTarget.getBoundingClientRect()
    setSelectedImage({ src: e.currentTarget.src, rect })
  }

  const openImageCarousel = (imageSrc: string, imageArray: string[], currentIndex: number, rect: DOMRect) => {
    if (isMobile) return
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

  return (
    <div className="min-h-screen bg-ivory text-midnight overflow-x-hidden">
      {/* Image Modal */}
      {selectedImage.src && (
        <div 
          className={`fixed inset-0 bg-black z-[60] transition-opacity duration-300 ${isAnimating && !isClosing ? 'bg-opacity-75' : 'bg-opacity-0'}`}
          onClick={closeImage}
        >
          <div className="relative w-full h-full">
            {/* Render all carousel images with fade or single image */}
            {selectedImage.images && selectedImage.images.length > 1 ? (
              selectedImage.images.map((image, index) => (
                <div
                  key={`modal-container-${image}-${index}`}
                  className="absolute rounded-2xl shadow-2xl overflow-hidden"
                  style={{
                    ...getModalStyle(image),
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
              <img 
                src={selectedImage.src} 
                alt="Vista ampliada" 
                className="absolute object-cover rounded-2xl shadow-2xl"
                style={getModalStyle()}
              />
            )}
            <button
              onClick={closeImage}
              className={`absolute w-12 h-12 bg-terracotta rounded-full flex items-center justify-center shadow-lg text-ivory transition-all duration-300 hover:scale-110 ${isAnimating && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
              style={{
                ...getCloseButtonStyle(),
                zIndex: 30
              }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-terracotta to-sage overflow-hidden">
        <div
          ref={heroRef}
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('/a10.jpg')`,
          }}
        />
        <div className="relative z-10 text-center text-ivory px-4">
          <div className="mb-8">
            <Heart className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-4 font-elegant">Julen & Maitane</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto mt-2 font-manuscript">
            Con toda la ilusion del mundo hemos tejido este pequeño regalo: un mosaico de risas y recuerdos para agradeceros el amor, la alegría y la inspiración que sembrais en cada uno de nosotros. Que estos pedacitos de vuestra vida os devuelvan multiplicado el cariño que hoy nos une para celebrar vuestra historia.
          </p>
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
        {/* Paper texture overlay - solo textura sin color */}
        <div 
          className="absolute inset-0 pointer-events-none z-50"
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
          className="absolute top-8 left-8 md:top-12 md:left-12 w-32 h-32 md:w-48 md:h-48 opacity-70 z-10 pointer-events-none"
        />
        <img 
          src="/flores/sup_der.png" 
          alt="" 
          className="absolute top-8 right-8 md:top-12 md:right-12 w-32 h-32 md:w-48 md:h-48 opacity-70 z-10 pointer-events-none"
        />
        <img 
          src="/flores/inf_izq.png" 
          alt="" 
          className="absolute bottom-8 left-8 md:bottom-12 md:left-12 w-32 h-32 md:w-48 md:h-48 opacity-70 z-10 pointer-events-none"
        />
        <img 
          src="/flores/inf_der.png" 
          alt="" 
          className="absolute bottom-8 right-8 md:bottom-12 md:right-12 w-32 h-32 md:w-48 md:h-48 opacity-70 z-10 pointer-events-none"
        />
        
        <div className="max-w-7xl mx-auto px-4 py-32 relative z-20">
        {/* 2010 - Conocidos - Chat Tuenti */}
        <section id="conocidos-2010" className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out pt-16 md:pt-24">
          <div className="lg:col-span-6 lg:pr-8">
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
          <div className="lg:col-span-6 lg:pl-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-terracotta rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6" viewBox="145.5 144.8 609 609.7" xmlns="http://www.w3.org/2000/svg">
                  <path d="m269.2 146.1c-64.7 6.2-109.9 47.5-121.4 111l-2.3 12.4v360l2.3 12.6c5.7 31.6 17.9 55 39.3 75.4 17.5 16.7 39.4 28 63.8 32.9 19.7 4 23.3 4.1 201.1 4.1 161 0 172.2-.1 183.5-1.8 36.1-5.5 60.5-17.3 81.6-39.4 19.1-20 29.9-42 35.2-71.7l2.2-12.1v-361l-2.3-12c-5.9-31-18.9-55.8-39.3-75-22-20.6-48.3-31.9-82.9-35.5-11.5-1.2-348.5-1.1-360.8.1zm262.8 129.6c5.9 2.7 8.6 5.3 14.7 13.8 21.3 30 37.8 73.7 44.4 117.5 3.1 21 3.2 56.1 0 78-5.6 39.6-17.9 74.3-38.3 108.6-11.4 19.2-19 25.3-32.3 26.2-17.5 1.1-32.2-11.8-33.3-29.2-.6-9.6.6-13.3 8.4-25.6 46.2-73.1 45.6-168.9-1.6-240-5.8-8.7-7.3-13.8-6.8-22.2.9-13.8 9.4-24.5 22.8-28.9 4.4-1.5 17.1-.4 22 1.8zm-135 37.7c32 6.9 42.9 47.6 18.8 70.2-20.4 19-53.1 12.9-65.5-12.4-3.6-7.2-3.8-8.1-3.8-17.1 0-12.9 2.5-19.7 10.7-28.5 10.5-11.6 23.8-15.6 39.8-12.2zm1.8 154.1c7.3 2.2 15 8.8 18.7 16 2.7 5.3 3 6.8 3 14.9v9.1l-7.2 14.5c-3.9 8-12.1 24.8-18.2 37.5-20.4 41.9-22.1 45.1-26.4 49.3-7.1 6.9-11.8 8.7-22.2 8.7-7.8 0-9.7-.4-14.7-2.8-6.3-3.1-11.5-8.5-15-15.6-1.8-3.7-2.2-6.3-2.3-13.1v-8.5l8.2-17c9.4-19.8 32.1-66.3 36.5-75 4.7-9.4 11.9-15.8 20.8-18.6 4.3-1.3 13.4-1 18.8.6z" 
                        fill="white"/>
                </svg>
              </div>
              <h3 className="text-4xl md:text-5xl font-script text-terracotta">Los inicios... · 2009</h3>
            </div>
            <p className="text-lg md:text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Todo empezó con un reto entre amigas, donde Maitane se fijó en Julen y se armó de valor para hablarle por Tuenti. Después de varios intentos, finalmente acabaron quedando y cuando ya estaban frente a frente Maitane pensó: "¿y ahora que?" 😨 Y a partir de aquel 17 de enero de 2009 comenzó todo….
            </p>
          </div>
        </section>

        {/* 2012 - Amigos inseparables */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 lg:pr-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-sage rounded-full flex items-center justify-center mr-4">
                <img src="/pareja4.svg" alt="Pareja" className="w-8 h-8" />
              </div>
              <h3 className="text-4xl md:text-5xl font-script text-sage">Primeras escapadas</h3>
            </div>
            <p className="text-lg md:text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Al principio mantenían la relación en secreto y cuando quedaban tenían que mentir a sus padres, con tan mala suerte, que en una ocasión les pillaron… ¡y tuvieron que dar la cara! Poco a poco, la relación se fue consolidando, a pesar de existir alguna crisis…. 
              y empezaron los primeros viajes: cuando Julen se sacó el carnet y pedía el coche a sus padres para ir a la playa con Maitane, después a Noja y  luego su primer viaje en avión a Mallorca 🏝️. Julen viajó hasta Málaga sin que Maitane lo supiera, y se plantó ahí para darle una sorpresa y pasar unos días juntos❤️.
            </p>
          </div>
          <div className="lg:col-span-6">
                        <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                <div className="custom-shadow-right-bottom" style={{ height: 'calc(384px - 0px)', overflow: 'hidden' }}>
                  <ImageCarousel
                    images={[
                      "/experiences/experience-02/primeras-escapadas-01.jpg",
                      "/experiences/experience-02/primeras-escapadas-02.jpg",
                      "/experiences/experience-02/primeras-escapadas-03.jpg"
                    ]}
                    alt="Primeras escapadas"
                    experienceId="02"
                    onImageClick={(imageSrc, imageArray, currentIndex, rect) => {
                      openImageCarousel(imageSrc, imageArray, currentIndex, rect)
                    }}
                  />
                </div>
                {/* Marcador invisible para posicionar el marco */}
                <div id="carousel-frame-anchor" className="absolute inset-0 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* 2013 - Primera aventura */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                                <div className="overflow-hidden custom-shadow-right-bottom hover:custom-shadow-right-bottom-hover transition-all duration-500" style={{ height: 'calc(384px - 0px)' }}>
                  <img
                      src="/a3.jpg"
                      alt="Primera aventura"
                      className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer hover:scale-105 transition-transform duration-500 ease-in-out' : ''}`}
                      onClick={openImage}
                  />
                </div>
                {/* Marcador invisible para posicionar el marco */}
                <div id="image-frame-anchor-a3" className="absolute inset-0 pointer-events-none"></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-terracotta rounded-full flex items-center justify-center mr-4">
                <Ship className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-4xl md:text-5xl font-script text-terracotta">Primera aventura · 2013</h3>
            </div>
            <p className="text-lg md:text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Con sus ahorros de verano, se apuntan a un campamento de kayak por el Sella, la primera experiencia lejos de casa. Amanecen en tienda de campaña con café soluble y nervios compartidos. Aprenden a remar sincronizados: cuando ella canta, él esquiva rocas; cuando él cede, ella lo anima. Sin saberlo, descubren que llevan años remando hacia el mismo destino.
            </p>
          </div>
        </section>

        {/* 2014 - Primer beso */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 lg:pr-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-midnight rounded-full flex items-center justify-center mr-4">
                <Heart className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-4xl md:text-5xl font-script text-midnight">Primer beso · 2014</h3>
            </div>
            <p className="text-lg md:text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              La feria de San Antón enciende Bilbao con neones y olor a algodón de azúcar. Tras una vuelta en la noria, Julen regala a Maitane un peluche ganado en el tiro al blanco. En medio de risas y música estridente, se atreven a cerrar la distancia con un beso inolvidable. Ese instante fugaz marca un antes y un después en su historia.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                                <div className="overflow-hidden custom-shadow-right-bottom hover:custom-shadow-right-bottom-hover transition-all duration-500" style={{ height: 'calc(384px - 0px)' }}>
                  <img
                      src="/a4.jpg"
                      alt="Primer beso"
                      className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer hover:scale-105 transition-transform duration-500 ease-in-out' : ''}`}
                      onClick={openImage}
                  />
                </div>
                {/* Marcador invisible para posicionar el marco */}
                <div id="image-frame-anchor-a4" className="absolute inset-0 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* 2015 - A distancia */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                                <div className="overflow-hidden custom-shadow-right-bottom hover:custom-shadow-right-bottom-hover transition-all duration-500" style={{ height: 'calc(384px - 0px)' }}>
                  <img
                      src="/a5.jpg"
                      alt="A distancia"
                      className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer hover:scale-105 transition-transform duration-500 ease-in-out' : ''}`}
                      onClick={openImage}
                  />
                </div>
                {/* Marcador invisible para posicionar el marco */}
                <div id="image-frame-anchor-a5" className="absolute inset-0 pointer-events-none"></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-sage rounded-full flex items-center justify-center mr-4">
                <Plane className="w-6 h-6 text-midnight" />
              </div>
              <h3 className="text-4xl md:text-5xl font-script text-sage">A distancia · 2015</h3>
            </div>
            <p className="text-lg md:text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              La universidad los separa entre Madrid y Bilbao, pero las videollamadas se convierten en su nuevo ritual. Entre trenes nocturnos y cartas perfumadas de salvia, aprenden a medir la nostalgia en megas y husos horarios. Cada "buenas noches" incluye un "falta un día menos" que acorta kilómetros. La distancia demuestra que su amor es, más que un lugar, un lazo irrompible.
            </p>
          </div>
        </section>

        {/* 2017 - Reencuentro en París */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 lg:pr-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-terracotta rounded-full flex items-center justify-center mr-4">
                <Camera className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-4xl md:text-5xl font-script text-terracotta">Reencuentro en París · 2017</h3>
            </div>
            <p className="text-lg md:text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Maitane sorprende a Julen en el Trocadéro durante su Erasmus y la Torre Eiffel cobra un brillo especial. Caminan abrazados junto al Sena, olvidando el frío invernal. Dejan un candado en el Pont des Arts con la promesa tácita de nunca separarse tanto. La magia de esa sorpresa consolida su compromiso sin fecha de caducidad.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                                <div className="overflow-hidden custom-shadow-right-bottom hover:custom-shadow-right-bottom-hover transition-all duration-500" style={{ height: 'calc(384px - 0px)' }}>
                  <img
                      src="/a6.jpg"
                      alt="Reencuentro en París"
                      className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer hover:scale-105 transition-transform duration-500 ease-in-out' : ''}`}
                      onClick={openImage}
                  />
                </div>
                {/* Marcador invisible para posicionar el marco */}
                <div id="image-frame-anchor-a6" className="absolute inset-0 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* 2019 - Vuelta al mundo */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                                <div className="overflow-hidden custom-shadow-right-bottom hover:custom-shadow-right-bottom-hover transition-all duration-500" style={{ height: 'calc(384px - 0px)' }}>
                  <img
                      src="/a7.jpg"
                      alt="Vuelta al mundo"
                      className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer hover:scale-105 transition-transform duration-500 ease-in-out' : ''}`}
                      onClick={openImage}
                  />
                </div>
                {/* Marcador invisible para posicionar el marco */}
                <div id="image-frame-anchor-a7" className="absolute inset-0 pointer-events-none"></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-terracotta rounded-full flex items-center justify-center mr-4">
                <MapPin className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-4xl md:text-5xl font-script text-terracotta">Vuelta al mundo · 2019</h3>
            </div>
            <p className="text-lg md:text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Con pasaportes en mano y mochilas al hombro, abandonan el mapa convencional rumbo a Bangkok, Sydney y Ciudad de México. Cada Polaroid pegada en su diario capta motos atestadas, surf en Bondi y luchadores de lucha libre. Aprenden a pedir menú vegetariano en cinco idiomas y a reírse de vuelos retrasados. Descubren que su hogar es inseparable de su compañía mutua.
            </p>
          </div>
        </section>

        {/* 2020 - Adopción de Ilun */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 lg:pr-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-sage rounded-full flex items-center justify-center mr-4">
                <PawPrint className="w-6 h-6 text-midnight" />
              </div>
              <h3 className="text-4xl md:text-5xl font-script text-sage">Adopción de Ilun · 2020</h3>
            </div>
            <p className="text-lg md:text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Un refugio local les presentó a Ilun, una bola de pelo negro con ojos color miel que necesitaba un hogar. La conexión fue instantánea. Sus días se llenaron de ladridos de bienvenida, paseos por el monte y siestas en el sofá. Ilun no solo se convirtió en su compañero fiel, sino en el corazón de su nueva familia, enseñándoles que el amor más puro a veces viene en cuatro patas.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                                <div className="overflow-hidden custom-shadow-right-bottom hover:custom-shadow-right-bottom-hover transition-all duration-500" style={{ height: 'calc(384px - 0px)' }}>
                  <img
                      src="/a11.jpg"
                      alt="Adopción de Ilun"
                      className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer hover:scale-105 transition-transform duration-500 ease-in-out' : ''}`}
                      onClick={openImage}
                  />
                </div>
                {/* Marcador invisible para posicionar el marco */}
                <div id="image-frame-anchor-a11" className="absolute inset-0 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* 2022 - Propuesta */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                                <div className="overflow-hidden custom-shadow-right-bottom hover:custom-shadow-right-bottom-hover transition-all duration-500" style={{ height: 'calc(384px - 0px)' }}>
                  <img
                      src="/a8.png"
                      alt="Propuesta"
                      className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer hover:scale-105 transition-transform duration-500 ease-in-out' : ''}`}
                      onClick={openImage}
                  />
                </div>
                {/* Marcador invisible para posicionar el marco */}
                <div id="image-frame-anchor-a8" className="absolute inset-0 pointer-events-none"></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-midnight rounded-full flex items-center justify-center mr-4">
                <Ring className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-4xl md:text-5xl font-script text-midnight">Propuesta · 2022</h3>
            </div>
            <p className="text-lg md:text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Suben al amanecer los 241 peldaños de Gaztelugatxe sin imaginar lo que les espera. En la cima, Julen se arrodilla con un anillo grabado "Kontuan izan nauzu" bajo el rugido del Cantábrico. Las lágrimas de Maitane mezclan sal y felicidad mientras la campana repica por segunda vez. Ese momento sella el inicio de un nuevo capítulo en su viaje conjunto.
            </p>
          </div>
        </section>

        {/* 2024 - Preparativos */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 lg:pr-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-terracotta rounded-full flex items-center justify-center mr-4">
                <BookOpen className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-4xl md:text-5xl font-script text-terracotta">Preparativos · 2024</h3>
            </div>
            <p className="text-lg md:text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Su sala se llena de muestrarios de flores, listas de invitados y tarjetas terracota dispuestas sobre la mesa. Debaten menú, música e invitaciones, aprendiendo a escuchar y ceder en cada detalle. Cada decisión refleja su complicidad y el deseo de celebrar no solo un día, sino todo lo vivido. El proceso revela que el verdadero regalo es planificar juntos su futuro.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                                <div className="overflow-hidden custom-shadow-right-bottom hover:custom-shadow-right-bottom-hover transition-all duration-500" style={{ height: 'calc(384px - 0px)' }}>
                  <img
                      src="/a9.png"
                      alt="Preparativos"
                      className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer hover:scale-105 transition-transform duration-500 ease-in-out' : ''}`}
                      onClick={openImage}
                  />
                </div>
                {/* Marcador invisible para posicionar el marco */}
                <div id="image-frame-anchor-a9" className="absolute inset-0 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* 2025 - La boda */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                                <div className="overflow-hidden custom-shadow-right-bottom hover:custom-shadow-right-bottom-hover transition-all duration-500" style={{ height: 'calc(384px - 0px)' }}>
                  <img
                      src="/a10.jpg"
                      alt="La boda"
                      className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer hover:scale-105 transition-transform duration-500 ease-in-out' : ''}`}
                      onClick={openImage}
                  />
                </div>
                {/* Marcador invisible para posicionar el marco */}
                <div id="image-frame-anchor-a10" className="absolute inset-0 pointer-events-none"></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-midnight rounded-full flex items-center justify-center mr-4">
                <PartyPopper className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-4xl md:text-5xl font-script text-midnight">La boda · 2025</h3>
            </div>
            <p className="text-lg md:text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Entre encinas centenarias, sillas blancas y guirnaldas de eucalipto, los invitados se reúnen en un campo iluminado por el último rayo dorado. Julen espera con traje azul medianoche y Maitane avanza con velo ligero, sellando su historia con una promesa de amor eterno. Al confeti elevarse, cada aplauso celebra no un final, sino el prólogo de su vida en común.
            </p>
          </div>
        </section>
        </div>
        
        {/* Marcos florales - renderizados fuera del max-w-7xl */}
        <div 
          id="frames-portal" 
          className="fixed pointer-events-none"
          style={{ 
            zIndex: 30,
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            overflow: 'visible'
          }}
        >
          {/* Marco del carrusel */}
          <img
            id="carousel-frame-image"
            src="/marco_floral.png"
            alt=""
            className="absolute pointer-events-none"
            style={{ 
              width: '0px',
              height: '0px',
              objectFit: 'cover',
              transform: 'scale(1.5) translateX(-3px)',
              opacity: 0,
              transition: 'opacity 0.3s ease'
            }}
          />
          {/* Marcos de imágenes individuales */}
          {['a3', 'a4', 'a5', 'a6', 'a7', 'a11', 'a8', 'a9', 'a10'].map(imageId => (
            <img
              key={imageId}
              id={`image-frame-${imageId}`}
              src="/marco_floral.png"
              alt=""
              className="absolute pointer-events-none"
              style={{ 
                width: '0px',
                height: '0px',
                objectFit: 'cover',
                transform: 'scale(1.5) translateX(-3px)',
                opacity: 0,
                transition: 'opacity 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>

      {/* Final Section - Video */}
      <section 
        ref={finalSectionRef}
        className="relative min-h-screen bg-midnight flex items-center justify-center text-center overflow-hidden"
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
        <div className={`relative z-10 text-ivory px-4 max-w-4xl w-full flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${showVideo ? 'py-20' : ''}`}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <h2 className="text-5xl md:text-7xl font-script">Nuestro Video</h2>
              <Heart className="w-10 h-10 ml-4 text-ivory" />
            </div>
            <p className={`text-xl md:text-2xl leading-relaxed transition-all duration-700 ease-in-out font-manuscript ${showVideo ? 'mb-[44px]' : 'mb-12'}`}>
              Un pequeño resumen de un día inolvidable. Gracias por formar parte de él.
            </p>
          </div>

          {!showVideo && (
            <button 
              onClick={() => setShowVideo(true)}
              className="bg-terracotta hover:bg-terracotta/90 text-ivory px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
            >
              <Video className="w-6 h-6" />
              Ver Video
            </button>
          )}

          <div className={`w-full max-w-4xl transition-all duration-700 ease-in-out ${showVideo ? 'max-h-[600px] mt-8' : 'max-h-0 overflow-hidden'}`}>
            <div className="p-6">
              <div className="overflow-hidden rounded-2xl custom-shadow-right-bottom-large hover:custom-shadow-right-bottom-large-hover transition-all duration-500">
                <video
                  ref={videoRef}
                  src="https://res.cloudinary.com/dlyb3ahsq/video/upload/v1751704818/garaiona_video_4_v7dq3i.mp4"
                  controls
                  playsInline
                  className="w-full aspect-video"
                ></video>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
