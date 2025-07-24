"use client"

import { useState, useEffect } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface ImageCarouselProps {
  images: string[]
  alt: string
  onImageClick: (imageSrc: string, imageArray: string[], currentIndex: number, rect: DOMRect) => void
  experienceId?: string
}

export default function ImageCarousel({ images, alt, onImageClick, experienceId }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const isMobile = useMediaQuery('(max-width: 768px)')

  useEffect(() => {
    if (images.length <= 1) return
    
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, 3500) // 3.5 seconds between transitions

    return () => clearInterval(interval)
  }, [images.length])

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return
    const rect = e.currentTarget.getBoundingClientRect()
    onImageClick(images[activeIndex], images, activeIndex, rect)
  }

  if (images.length === 0) return null

  return (
    <div
      className={`relative overflow-hidden rounded-2xl custom-shadow-right-bottom hover:custom-shadow-right-bottom-hover transition-all duration-500 ${!isMobile ? 'cursor-pointer' : ''}`}
      onClick={handleContainerClick}
      style={{ height: '384px' }} // 24rem = h-96
    >
      {images.map((image, index) => (
        <img
          key={`${image}-${index}`}
          src={image}
          alt={`${alt} - Imagen ${index + 1}`}
          draggable={false}
          className={`${!isMobile ? 'hover:scale-105' : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: index === activeIndex ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out, transform 0.5s ease-in-out',
            zIndex: index === activeIndex ? 20 : 10
          }}
        />
      ))}
    </div>
  )
} 