"use client"

import { useEffect, useRef, useState } from "react"
import { Heart, Plane, MapPin, Camera, Video, Sun, Star, Ship, BellRingIcon as Ring, BookOpen, PartyPopper, X, PawPrint } from "lucide-react"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface ImageState {
  src: string | null
  rect: DOMRect | null
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
  const isMobile = useMediaQuery('(max-width: 768px)')

  useEffect(() => {
    if (selectedImage.src) {
      const timer = setTimeout(() => {
        setIsAnimating(true)
      }, 10) // Short delay to allow initial state to render
      return () => clearTimeout(timer)
    }
  }, [selectedImage.src])

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

  const openImage = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isMobile) return
    const rect = e.currentTarget.getBoundingClientRect()
    setSelectedImage({ src: e.currentTarget.src, rect })
  }

  const closeImage = () => {
    setIsClosing(true)
    setIsAnimating(false)
    setTimeout(() => {
      setSelectedImage({ src: null, rect: null })
      setIsClosing(false)
    }, 300) // Match transition duration
  }

  const getModalStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { transition: 'all 0.3s ease-in-out' }

    if (!selectedImage.rect) {
      return { ...baseStyle, opacity: 0, top: '50%', left: '50%', width: '0px', height: '0px' }
    }

    const { top, left, width, height } = selectedImage.rect
    const initialStyle = { top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }

    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const targetWidth = Math.min(screenWidth * 0.64, 960)
    const targetHeight = targetWidth * (9 / 16)
    const finalStyle = {
      top: `${(screenHeight - targetHeight) / 2}px`,
      left: `${(screenWidth - targetWidth) / 2}px`,
      width: `${targetWidth}px`,
      height: `${targetHeight}px`,
    }

    if (isClosing) return { ...baseStyle, ...initialStyle }
    return isAnimating ? { ...baseStyle, ...finalStyle } : initialStyle
  }

  return (
    <div className="min-h-screen bg-ivory text-midnight overflow-x-hidden">
      {/* Image Modal */}
      {selectedImage.src && (
        <div 
          className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${isAnimating && !isClosing ? 'bg-opacity-75' : 'bg-opacity-0'}`}
          onClick={closeImage}
        >
          <div className="relative w-full h-full">
            <img 
              src={selectedImage.src} 
              alt="Vista ampliada" 
              className="absolute object-cover rounded-2xl shadow-2xl"
              style={getModalStyle()}
            />
            <button
              onClick={closeImage}
              className={`absolute w-12 h-12 bg-terracotta rounded-full flex items-center justify-center shadow-lg text-ivory transition-all duration-300 hover:scale-110 ${isAnimating && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
              style={{
                top: `calc(${getModalStyle().top ?? '50%'} - 1.25rem)`,
                left: `calc(${getModalStyle().left ?? '50%'} + ${getModalStyle().width ?? '0px'} - 1.25rem)`,
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
          <h1 className="text-6xl md:text-8xl font-bold mb-4 font-serif">Julen & Maitane</h1>
          <p className="text-xl md:text-2xl font-light mb-8 max-w-2xl mx-auto">
            El último atardecer antes de su boda los encuentra de la mano frente al mar, celebrando casi tres décadas de recuerdos compartidos. Sus pasos sin prisa resumen la risa tímida del primer encuentro y los mapas doblados de sus viajes juntos. Cada color del cielo evoca los retos superados y los sueños cumplidos. Hoy abren este álbum infinito para compartir con quienes siempre los han acompañado.
          </p>
          <div className="text-lg md:text-xl opacity-90">¡Nos casamos!</div>
        </div>
      </section>

      {/* Timeline Sections */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* 2010 - Conocidos */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="overflow-hidden rounded-2xl shadow-xl">
            <img
                src="/a1.jpg"
                alt="Conocidos"
                className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer transition-transform duration-500 ease-in-out hover:scale-105' : ''}`}
                onClick={openImage}
            />
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-terracotta rounded-full flex items-center justify-center mr-4">
                <span className="text-ivory font-bold">14</span>
              </div>
              <h3 className="text-3xl font-serif font-bold text-terracotta">Conocidos · 2010</h3>
            </div>
            <p className="text-lg leading-relaxed text-midnight/80">
              En su primer día en tercero de ESO, Julen llega tarde y Maitane dibuja constelaciones junto a la ventana. El profesor los une en la misma fila y nace una amistad gracias a un comentario sobre música. Al intercambiar números prometen ayudarse con mates, sin imaginar que encendían algo más grande. Aquella tarde fue el inicio de un vínculo que perduraría más allá de un simple trabajo escolar.
            </p>
          </div>
        </section>

        {/* 2012 - Amigos inseparables */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 lg:pr-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-sage rounded-full flex items-center justify-center mr-4">
                <span className="text-midnight font-bold">16</span>
              </div>
              <h3 className="text-3xl font-serif font-bold text-sage">Amigos inseparables · 2012</h3>
            </div>
            <p className="text-lg leading-relaxed text-midnight/80">
              Dos años de recreos en el parque forjaron un dúo imparable entre baloncesto, patines y risas compartidas. Sueñan juntos: él diseña coches, ella escribe guiones; graban cortos y crean chistes que solo entienden ellos. Cada tarde prometen nuevas aventuras y cumplen su palabra sin excepción. Su complicidad es tan natural que nadie imagina al uno sin el otro.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-2xl shadow-xl">
            <img
                src="/a2.jpg"
                alt="Amigos inseparables"
                className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer transition-transform duration-500 ease-in-out hover:scale-105' : ''}`}
                onClick={openImage}
            />
            </div>
          </div>
        </section>

        {/* 2013 - Primera aventura */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="overflow-hidden rounded-2xl shadow-xl">
            <img
                src="/a3.jpg"
                alt="Primera aventura"
                className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer transition-transform duration-500 ease-in-out hover:scale-105' : ''}`}
                onClick={openImage}
            />
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-terracotta rounded-full flex items-center justify-center mr-4">
                <Ship className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-terracotta">Primera aventura · 2013</h3>
            </div>
            <p className="text-lg leading-relaxed text-midnight/80">
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
              <h3 className="text-3xl font-serif font-bold text-midnight">Primer beso · 2014</h3>
            </div>
            <p className="text-lg leading-relaxed text-midnight/80">
              La feria de San Antón enciende Bilbao con neones y olor a algodón de azúcar. Tras una vuelta en la noria, Julen regala a Maitane un peluche ganado en el tiro al blanco. En medio de risas y música estridente, se atreven a cerrar la distancia con un beso inolvidable. Ese instante fugaz marca un antes y un después en su historia.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-2xl shadow-xl">
            <img
                src="/a4.jpg"
                alt="Primer beso"
                className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer transition-transform duration-500 ease-in-out hover:scale-105' : ''}`}
                onClick={openImage}
            />
            </div>
          </div>
        </section>

        {/* 2015 - A distancia */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="overflow-hidden rounded-2xl shadow-xl">
            <img
                src="/a5.jpg"
                alt="A distancia"
                className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer transition-transform duration-500 ease-in-out hover:scale-105' : ''}`}
                onClick={openImage}
            />
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-sage rounded-full flex items-center justify-center mr-4">
                <Plane className="w-6 h-6 text-midnight" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-sage">A distancia · 2015</h3>
            </div>
            <p className="text-lg leading-relaxed text-midnight/80">
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
              <h3 className="text-3xl font-serif font-bold text-terracotta">Reencuentro en París · 2017</h3>
            </div>
            <p className="text-lg leading-relaxed text-midnight/80">
              Maitane sorprende a Julen en el Trocadéro durante su Erasmus y la Torre Eiffel cobra un brillo especial. Caminan abrazados junto al Sena, olvidando el frío invernal. Dejan un candado en el Pont des Arts con la promesa tácita de nunca separarse tanto. La magia de esa sorpresa consolida su compromiso sin fecha de caducidad.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-2xl shadow-xl">
            <img
                src="/a6.jpg"
                alt="Reencuentro en París"
                className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer transition-transform duration-500 ease-in-out hover:scale-105' : ''}`}
                onClick={openImage}
            />
            </div>
          </div>
        </section>

        {/* 2019 - Vuelta al mundo */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src="/a7.jpg"
                alt="Vuelta al mundo"
                className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer transition-transform duration-500 ease-in-out hover:scale-105' : ''}`}
                onClick={openImage}
              />
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-terracotta rounded-full flex items-center justify-center mr-4">
                <MapPin className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-terracotta">Vuelta al mundo · 2019</h3>
            </div>
            <p className="text-lg leading-relaxed text-midnight/80">
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
              <h3 className="text-3xl font-serif font-bold text-sage">Adopción de Ilun · 2020</h3>
            </div>
            <p className="text-lg leading-relaxed text-midnight/80">
              Un refugio local les presentó a Ilun, una bola de pelo negro con ojos color miel que necesitaba un hogar. La conexión fue instantánea. Sus días se llenaron de ladridos de bienvenida, paseos por el monte y siestas en el sofá. Ilun no solo se convirtió en su compañero fiel, sino en el corazón de su nueva familia, enseñándoles que el amor más puro a veces viene en cuatro patas.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src="/a11.jpg"
                alt="Adopción de Ilun"
                className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer transition-transform duration-500 ease-in-out hover:scale-105' : ''}`}
                onClick={openImage}
              />
            </div>
          </div>
        </section>

        {/* 2022 - Propuesta */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src="/a8.png"
                alt="Propuesta"
                className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer transition-transform duration-500 ease-in-out hover:scale-105' : ''}`}
                onClick={openImage}
              />
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-midnight rounded-full flex items-center justify-center mr-4">
                <Ring className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-midnight">Propuesta · 2022</h3>
            </div>
            <p className="text-lg leading-relaxed text-midnight/80">
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
              <h3 className="text-3xl font-serif font-bold text-terracotta">Preparativos · 2024</h3>
            </div>
            <p className="text-lg leading-relaxed text-midnight/80">
              Su sala se llena de muestrarios de flores, listas de invitados y tarjetas terracota dispuestas sobre la mesa. Debaten menú, música e invitaciones, aprendiendo a escuchar y ceder en cada detalle. Cada decisión refleja su complicidad y el deseo de celebrar no solo un día, sino todo lo vivido. El proceso revela que el verdadero regalo es planificar juntos su futuro.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src="/a9.png"
                alt="Preparativos"
                className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer transition-transform duration-500 ease-in-out hover:scale-105' : ''}`}
                onClick={openImage}
              />
            </div>
          </div>
        </section>

        {/* 2025 - La boda */}
        <section className="timeline-item mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center opacity-0 translate-y-8 transition-all duration-1000 ease-in-out">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src="/a10.jpg"
                alt="La boda"
                className={`w-full h-96 object-cover ${!isMobile ? 'cursor-pointer transition-transform duration-500 ease-in-out hover:scale-105' : ''}`}
                onClick={openImage}
              />
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-midnight rounded-full flex items-center justify-center mr-4">
                <PartyPopper className="w-6 h-6 text-ivory" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-midnight">La boda · 2025</h3>
            </div>
            <p className="text-lg leading-relaxed text-midnight/80">
              Entre encinas centenarias, sillas blancas y guirnaldas de eucalipto, los invitados se reúnen en un campo iluminado por el último rayo dorado. Julen espera con traje azul medianoche y Maitane avanza con velo ligero, sellando su historia con una promesa de amor eterno. Al confeti elevarse, cada aplauso celebra no un final, sino el prólogo de su vida en común.
            </p>
          </div>
        </section>
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
              <h2 className="text-5xl md:text-7xl font-serif font-bold">Nuestro Video</h2>
              <Heart className="w-10 h-10 ml-4 text-ivory" />
            </div>
            <p className={`text-xl md:text-2xl leading-relaxed transition-all duration-700 ease-in-out ${showVideo ? 'mb-[44px]' : 'mb-12'}`}>
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

          <div className={`w-full max-w-4xl transition-all duration-700 ease-in-out overflow-hidden ${showVideo ? 'max-h-[600px] mt-8' : 'max-h-0'}`}>
            <div className="aspect-video rounded-2xl shadow-2xl overflow-hidden">
              <video
                ref={videoRef}
                src="https://res.cloudinary.com/dlyb3ahsq/video/upload/v1751704818/garaiona_video_4_v7dq3i.mp4"
                controls
                playsInline
                className="w-full h-full"
              ></video>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
