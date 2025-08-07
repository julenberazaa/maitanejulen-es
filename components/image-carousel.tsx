"use client"

import { useState, useEffect } from "react"

interface ImageCarouselProps {
  images: string[]
  alt: string
  onImageClick: (imageSrc: string, imageArray: string[], currentIndex: number, rect: DOMRect) => void
  experienceId?: string
}

export default function ImageCarousel({ images, alt, onImageClick, experienceId }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

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
    const rect = e.currentTarget.getBoundingClientRect()
    onImageClick(images[activeIndex], images, activeIndex, rect)
  }

  if (images.length === 0) return null

  return (
    <div
      className="relative w-full h-full cursor-pointer"
      onClick={handleContainerClick}
    >
      <div className="overflow-hidden w-full h-full">
      {images.map((image, index) => (
        <img
          key={`${image}-${index}`}
          src={image}
          alt={`${alt} - Imagen ${index + 1}`}
          draggable={false}
          className={`transition-transform duration-500 ease-in-out ${index === activeIndex ? 'hover:scale-105' : ''}`}
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
    </div>
  )
} 