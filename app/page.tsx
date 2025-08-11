"use client"

import { useEffect, useRef, useState } from "react"
import { Heart, Plane, MapPin, Camera, Video, Sun, Star, Ship, BellRingIcon as Ring, BookOpen, PartyPopper, X, PawPrint } from "lucide-react"
import ImageCarousel from "@/components/image-carousel"
import FramesOverlay from "@/components/frames-overlay"

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
  const [tuentiStarted, setTuentiStarted] = useState(false)

  // Forzar scroll al top en cada recarga de la página sin animación
  useEffect(() => {
    // Evitar que el navegador restaure la posición de scroll anterior
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    
    // Forzar posición al top inmediatamente sin animación
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    // Bloquear scroll durante el primer segundo para estabilizar marcos
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const unlock = setTimeout(() => {
      document.body.style.overflow = prevOverflow || 'auto'
    }, 1000)
    return () => clearTimeout(unlock)
  }, [])

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
      observer.disconnect()
    }
  }, [])

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

  const openImage = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setSelectedImage({ src: e.currentTarget.src, rect })
  }

  const openImageCarousel = (imageSrc: string, imageArray: string[], currentIndex: number, rect: DOMRect) => {
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
    <div className="min-h-screen bg-ivory text-midnight overflow-x-hidden relative">
      {/* Static frames overlay, above base content but below modal/video */}
      <FramesOverlay />
      {/* Image Modal */}
      {selectedImage.src && (
        <div 
          className={`fixed inset-0 bg-black z-[100] transition-opacity duration-300 ${isAnimating && !isClosing ? 'bg-opacity-75' : 'bg-opacity-0'}`}
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
                zIndex: 101
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
          <h1 className="text-8xl font-bold mb-4 font-elegant">Julen & Maitane</h1>
          <p className="text-2xl mb-8 max-w-2xl mx-auto mt-2 font-manuscript">
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
              <div className="timeline-icon-circle bg-sage mr-4">
                <img src="/pareja4.svg" alt="Pareja" className="w-8 h-8" />
              </div>
              <h3 className="text-5xl font-script text-sage">Primeras escapadas</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Al principio mantenían la relación en secreto y cuando quedaban tenían que mentir a sus padres, con tan mala suerte, que en una ocasión les pillaron… ¡y tuvieron que dar la cara! Poco a poco, la relación se fue consolidando, a pesar de existir alguna crisis…. 
              y empezaron los primeros viajes: cuando Julen se sacó el carnet y pedía el coche a sus padres para ir a la playa con Maitane, después a Noja y  luego su primer viaje en avión a Mallorca 🏝️. Julen viajó hasta Málaga sin que Maitane lo supiera, y se plantó ahí para darle una sorpresa y pasar unos días juntos❤️.
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
              Julen y Maitane comenzaron su historia en la ikastola Kirikiño, donde estudiaron juntos. Julen continuó su formación con un grado en Publicidad y Recursos Humanos, mientras que Maitane, con una clara vocación por la medicina, se enfrentó a un camino más exigente. Aunque en su primer intento no logró la nota necesaria para entrar en Medicina, accedió a Odontología y, tras un año más de esfuerzo, consiguió finalmente comenzar la carrera de sus sueños. Durante estos años, la pareja atravesó momentos duros: la distancia y la intensidad de los estudios hicieron que cada encuentro fuera un esfuerzo compartido. Maitane pasaba horas entre libros y Julen, además de sus estudios, mantenía un ritmo exigente con entrenamientos y partidos de fútbol.
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
              Al finalizar su grado, Julen sorprendió a todos inscribiéndose a las oposiciones para Policía Local de Bilbao, sin haberlo comentado ni siquiera con su padre, que había ocupado ese mismo puesto durante años. En su preparación, se volcó como nunca: horas de estudio, caminatas por Bilbao para memorizar calles, ayuda de Maitane en la organización del temario y entrenamiento físico riguroso. Incluso dejó el fútbol para evitar lesiones. El esfuerzo dio fruto: aprobó la oposición y, tras siete meses de academia, comenzó a trabajar como policía a los 24 años.
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
                      "/mir/MIR4.jpeg",
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
              <div className="timeline-icon-circle bg-sage mr-4">
                <Heart className="w-6 h-6 text-midnight" />
              </div>
              <h3 className="text-5xl font-script text-sage">MIR · 2020-2023</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Mientras tanto, Maitane seguía dedicada por completo a su carrera. La exigencia no acabó al obtener el título: para ejercer en la sanidad pública y poder quedarse cerca de Julen, necesitaba una buena nota en el examen MIR. Esto supuso un año de estudio intensivo, sin apenas pausas. Julen, cuando no trabajaba, aprovechaba cada respiro de Maitane para acompañarla unos minutos y apoyarla. Aunque no logró su objetivo en el primer intento, repitió el proceso un año más, esta vez con mayor serenidad. Toda esta etapa fue una verdadera prueba de amor y compromiso mutuo entre ambos.
            </p>
          </div>
        </section>

        {/* 2017 - Reencuentro en París */}
        <section className="timeline-item mb-32 grid grid-cols-12 sm:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="col-span-6 pr-12">
            <div className="flex items-center mb-6">
              <div className="timeline-icon-circle bg-sage mr-4">
                <Sun className="w-6 h-6 text-midnight" />
              </div>
              <h3 className="text-5xl font-script text-sage">Hobbies</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Entre semanas de trabajo y estudio, aprendieron a celebrar lo cotidiano: cocinar recetas nuevas, perderse con la cámara por Bilbao y compartir rutas en bici al atardecer. Descubrieron que sus aficiones, más que pasatiempos, eran pequeñas anclas que les unían sin prisa, construyendo momentos que hoy recuerdan con una sonrisa.
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
              Llegó la primera llave compartida y con ella las pequeñas grandes decisiones: pintar la pared del salón, elegir una mesa con historia y aprender a combinar agendas y silencios. El piso se convirtió en hogar cuando entendieron que el mejor lugar siempre era el que construían juntos.
            </p>
          </div>
        </section>

        {/* Ilun */}
        <section className="timeline-item mb-32 grid grid-cols-12 sm:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="col-span-6 pr-12">
            <div className="flex items-center mb-6">
              <div className="timeline-icon-circle bg-sage mr-4">
                <PawPrint className="w-6 h-6 text-midnight" />
              </div>
              <h3 className="text-5xl font-script text-sage">Ilun</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Entonces apareció Ilun, un torbellino negro de ojos dulces. Con él llegaron paseos bajo la lluvia, sofás compartidos y risas mañaneras. No tardaron en darse cuenta de que Ilun no llenó la casa: la multiplicó.
            </p>
          </div>
          <div className="col-span-6">
            <div className="p-6 flex justify-center">
              <div className="relative" style={{ width: '96%' }}>
                <div className="overflow-hidden" style={{ height: 'calc(384px - 0px)', overflow: 'hidden', position: 'relative' }}>
                  <ImageCarousel
                    images={[
                      "/ilun/ILUN.png",
                      "/ilun/ILUN2.png",
                      "/ilun/ILUN3.png",
                      "/ilun/ILUN4.png",
                      "/ilun/ILUN5.png",
                      "/ilun/ILUN6.png",
                      "/ilun/ILUN7.png",
                      "/ilun/ILUN8.png",
                      "/ilun/ILUN9.png",
                      "/ilun/ILUN10.png",
                    ]}
                    alt="Ilun"
                    experienceId="ilun"
                    onImageClick={(imageSrc, imageArray, currentIndex, rect) => {
                      openImageCarousel(imageSrc, imageArray, currentIndex, rect)
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
                <Ring className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-5xl font-script text-midnight">Pedida de mano</h3>
            </div>
            <p className="text-xl font-semibold leading-relaxed text-midnight/80 text-justify font-manuscript">
              Sin focos ni guión, solo el rumor del mar y dos manos temblorosas. Una pregunta sencilla, una respuesta que lo cambia todo. Desde entonces, cada campanada les recuerda que el sí fue, es y será su mejor decisión.
            </p>
          </div>
        </section>
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
        <div className={`relative z-[80] text-ivory px-4 max-w-4xl w-full flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${showVideo ? 'py-20' : ''}`}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <h2 className="text-7xl font-script">Nuestro Video</h2>
              <Heart className="w-10 h-10 ml-4 text-ivory" />
            </div>
            <p className={`text-2xl leading-relaxed transition-all duration-700 ease-in-out font-manuscript ${showVideo ? 'mb-[44px]' : 'mb-12'}`}>
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
