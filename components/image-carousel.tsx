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

  // Auto-advance for images only; for video wait until it finishes
  useEffect(() => {
    if (totalItems <= 1) return
    if (isVideoActive) return // do not auto-advance while video is active

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex === totalItems - 1 ? 0 : prevIndex + 1))
    }, 4000)
    return () => clearInterval(interval)
  }, [totalItems, isVideoActive])

  // Handle video playback when its slide becomes active
  useEffect(() => {
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
      <div className="overflow-hidden w-full h-full">
        {mediaItems.map((item, index) => {
          const commonStyle: React.CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: index === activeIndex ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out, transform 0.5s ease-in-out',
            zIndex: index === activeIndex ? 20 : 10,
          }
          if (item.type === 'image') {
            return (
              <img
                key={`img-${item.src}-${index}`}
                src={item.src}
                alt={`${alt} - Imagen ${index + 1}`}
                draggable={false}
                className={`transition-transform duration-500 ease-in-out ${index === activeIndex ? 'hover:scale-105' : ''}`}
                style={commonStyle}
                loading="lazy"
                decoding="async"
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
              className={`transition-transform duration-500 ease-in-out ${index === activeIndex ? 'hover:scale-105' : ''}`}
              style={commonStyle}
              preload={index === activeIndex ? 'auto' : 'metadata'}
            />
          )
        })}
      </div>
    </div>
  )
}