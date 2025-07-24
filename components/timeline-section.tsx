"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import type { TimelineItem } from "@/lib/timeline-data"

interface TimelineSectionProps extends TimelineItem {
  index: number
  isReversed: boolean
}

export default function TimelineSection({
  year,
  age,
  title,
  content,
  imageSide,
  imageUrl,
  animation,
  background,
  icon,
  index,
  isReversed,
}: TimelineSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const handleScroll = () => {
      const rect = section.getBoundingClientRect()
      const scrolled = window.scrollY
      const rate = scrolled * -0.15

      const image = section.querySelector(".parallax-image") as HTMLElement
      if (image) {
        image.style.transform = `translateY(${rate}px)`
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section ref={sectionRef} className={`min-h-screen flex items-center py-20 px-4 ${background}`}>
      <div className="max-w-7xl mx-auto w-full">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
            isReversed ? "lg:grid-flow-col-dense" : ""
          }`}
        >
          {/* Image Side */}
          <div className={`relative ${isReversed ? "lg:col-start-2" : ""}`} data-aos={animation}>
            <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={`${title} - ${year}`}
                width={600}
                height={400}
                className="w-full h-96 object-cover parallax-image transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {icon && (
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-terracotta rounded-full flex items-center justify-center shadow-lg animate-bounce">
                {icon}
              </div>
            )}
          </div>

          {/* Content Side */}
          <div
            className={`space-y-6 ${isReversed ? "lg:col-start-1" : ""}`}
            data-aos={`fade-${isReversed ? "right" : "left"}`}
            data-aos-delay="100"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-sage-green rounded-full flex items-center justify-center">
                <span className="text-midnight font-bold text-lg">{age}</span>
              </div>
              <div>
                <div className="text-terracotta font-medium text-lg">{year}</div>
                <div className="w-12 h-0.5 bg-terracotta mt-1" />
              </div>
            </div>

            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-midnight mb-6">{title}</h2>

            <div className="prose prose-lg text-midnight/80 leading-relaxed text-justify">
              {content.split("\n").map((paragraph, i) => (
                <p key={i} className="mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
