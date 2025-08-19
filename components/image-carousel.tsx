"use client"

import { useEffect, useMemo, useRef, useState } from "react"

interface MediaItem {
  type: 'image' | 'video'
  src: string
}

interface ImageCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  images?: string[]
  media?: MediaItem[]
  alt: string
  onImageClick: (imageSrc: string, imageArray: string[], currentIndex: number, rect: DOMRect) => void
  onVideoClick?: (videoSrc: string, rect: DOMRect) => void
  onOpenMediaCarousel?: (items: MediaItem[], startIndex: number, rect: DOMRect) => void
  experienceId?: string
}

export default function ImageCarousel({ images, media, alt, onImageClick, onVideoClick, onOpenMediaCarousel, experienceId, className, ...rest }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const previousActiveIndexRef = useRef<number>(0)
  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({})
  const [bgIndex, setBgIndex] = useState(0)
  const bgTimerRef = useRef<number | null>(null)
  const FADE_MS = 700

  // Build media list with backward compatibility
  const mediaItems: MediaItem[] = useMemo(() => {
    if (media && media.length) return media
    const imageItems = (images ?? []).map((src) => ({ type: 'image' as const, src }))
    return imageItems
  }, [images, media])

  const totalItems = mediaItems.length
  const isVideoActive = totalItems > 0 && mediaItems[activeIndex]?.type === 'video'

  // Keep refs for possible multiple videos
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({})

  // Auto-advance for images only; for video wait until it finishes.
  // Switch only when the next image is confirmed loaded to avoid white flashes on iOS.
  useEffect(() => {
    if (totalItems <= 1) return
    if (isVideoActive) return // do not auto-advance while video is active

    let timer: number | undefined
    const schedule = (delay: number) => {
      timer = window.setTimeout(tick, delay)
    }
    const tick = () => {
      const nextIndex = (activeIndex + 1) % totalItems
      const nextItem = mediaItems[nextIndex]
      if (nextItem?.type === 'image' && !loadedMap[nextIndex]) {
        // Ensure prefetch and retry soon until it's ready
        const img = new Image()
        img.decoding = 'async' as any
        img.loading = 'eager' as any
        img.onload = () => setLoadedMap((m) => ({ ...m, [nextIndex]: true }))
        img.src = nextItem.src
        schedule(200)
        return
      }
      setActiveIndex(nextIndex)
      schedule(4000)
    }
    schedule(4000)
    return () => { if (timer) clearTimeout(timer) }
  }, [totalItems, isVideoActive, activeIndex, mediaItems, loadedMap])

  // Handle video playback when its slide becomes active
  useEffect(() => {
    // Pause previously active video if any
    const prev = previousActiveIndexRef.current
    if (prev !== activeIndex) {
      const prevVideo = videoRefs.current[prev]
      if (prevVideo) {
        try { prevVideo.pause() } catch {}
      }
    }

    if (!isVideoActive) return
    const videoEl = videoRefs.current[activeIndex]
    if (!videoEl) return

    // Ensure start from beginning
    try {
      videoEl.currentTime = 0
    } catch {}
    // Autoplay policies require muted
    videoEl.muted = true
    const onEnded = () => {
      setActiveIndex((prev) => (prev === totalItems - 1 ? 0 : prev + 1))
    }
    videoEl.addEventListener('ended', onEnded)
    // Try to play; ignore promise rejections for autoplay
    const playPromise = videoEl.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {})
    }
    return () => {
      videoEl.removeEventListener('ended', onEnded)
      try {
        videoEl.pause()
      } catch {}
    }
  }, [activeIndex, isVideoActive, totalItems])

  // Track previous active index
  useEffect(() => {
    previousActiveIndexRef.current = activeIndex
  }, [activeIndex])

  // Delay background switch to preserve visible cross‑fade
  useEffect(() => {
    if (bgTimerRef.current) {
      clearTimeout(bgTimerRef.current)
      bgTimerRef.current = null
    }
    bgTimerRef.current = window.setTimeout(() => {
      setBgIndex(activeIndex)
      bgTimerRef.current = null
    }, FADE_MS)
    return () => {
      if (bgTimerRef.current) {
        clearTimeout(bgTimerRef.current)
        bgTimerRef.current = null
      }
    }
  }, [activeIndex])

  // Preload the next image only to reduce memory footprint
  useEffect(() => {
    if (totalItems <= 1) return
    const nextIndex = (activeIndex + 1) % totalItems
    const nextItem = mediaItems[nextIndex]
    if (nextItem && nextItem.type === 'image') {
      const img = new Image()
      img.decoding = 'async' as any
      img.loading = 'eager' as any
      img.src = nextItem.src
    }
  }, [activeIndex, totalItems, mediaItems])

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const current = mediaItems[activeIndex]
    const rect = e.currentTarget.getBoundingClientRect()
    // Prefer unified media carousel if provided
    if (onOpenMediaCarousel) {
      onOpenMediaCarousel(mediaItems, activeIndex, rect)
      return
    }
    if (current?.type === 'video') {
      if (onVideoClick) onVideoClick(current.src, rect)
      return
    }
    if (current?.type === 'image') {
      const imageOnlyArray = mediaItems.filter((m) => m.type === 'image').map((m) => m.src)
      // Map activeIndex to the corresponding index among images only
      const imagesBeforeCurrent = mediaItems.slice(0, activeIndex).filter((m) => m.type === 'image').length
      onImageClick(current.src, imageOnlyArray, imagesBeforeCurrent, rect)
    }
  }

  if (totalItems === 0) return null

  return (
    <div
      {...rest}
      className={`relative w-full h-full cursor-pointer${className ? ` ${className}` : ''}`}
      onClick={handleContainerClick}
    >
      <div
        className="overflow-hidden w-full h-full relative"
        style={{
          backgroundImage: mediaItems[bgIndex]?.type === 'image' ? `url(${mediaItems[bgIndex].src})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          // Small dark base to avoid any light flash while decoding
          backgroundColor: '#000',
        }}
      >
        {/* Background layer above ensures no gap; overlays cross-fade on top */}
        {(() => {
          const indicesToRender = new Set<number>()
          indicesToRender.add(activeIndex)
          if (totalItems > 1) {
            indicesToRender.add((activeIndex - 1 + totalItems) % totalItems)
            indicesToRender.add((activeIndex + 1) % totalItems)
          }

          return Array.from(indicesToRender).map((index) => {
            const item = mediaItems[index]
            const commonStyle: React.CSSProperties = {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: index === activeIndex ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease-in-out`,
              zIndex: index === activeIndex ? 20 : 10,
            }
            if (item.type === 'image') {
              return (
                <img
                  key={`img-${item.src}-${index}`}
                  src={item.src}
                  alt={`${alt} - Imagen ${index + 1}`}
                  draggable={false}
                  className={``}
                  style={commonStyle}
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 768px) 92vw, 640px"
                  onLoad={() => setLoadedMap((m) => (m[index] ? m : { ...m, [index]: true }))}
                />
              )
            }
            return (
              <video
                key={`vid-${item.src}-${index}`}
                ref={(el) => { videoRefs.current[index] = el }}
                src={item.src}
                playsInline
                controls={false}
                muted
                className={``}
                style={commonStyle}
                preload={index === activeIndex ? 'auto' : 'none'}
              />
            )
          })
        })()}
      </div>
    </div>
  )
}