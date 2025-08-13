"use client"

import { Play } from "lucide-react"
import { useState } from "react"

export default function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section className="h-screen flex items-center justify-center bg-midnight relative overflow-hidden">
      {/* Confetti Animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <div className={`w-2 h-2 ${Math.random() > 0.5 ? "bg-terracotta" : "bg-sage"} rotate-45`} />
          </div>
        ))}
      </div>

      <div className="text-center z-10" data-aos="zoom-in">
        <h2 className="font-playfair text-4xl md:text-6xl font-bold text-ivory mb-8">Nuestra Historia</h2>

        <p className="text-ivory/80 text-xl mb-12 max-w-2xl mx-auto px-4">
          Un minuto que resume 22 años de amor, amistad y aventuras juntas
        </p>

        <div className="relative inline-block">
          <video
            className="rounded-2xl shadow-2xl w-full max-w-4xl"
            poster="/placeholder.svg?height=600&width=800"
            controls={isPlaying}
            onPlay={() => setIsPlaying(true)}
          >
            <source src="/video_historia.mp4" type="video/mp4" />
            Tu navegador no soporta video HTML5.
          </video>

          {!isPlaying && (
            <button
              className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl hover:bg-black/20 transition-colors group"
              onClick={() => setIsPlaying(true)}
            >
              <div className="w-20 h-20 bg-terracotta rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                <Play className="w-8 h-8 text-ivory ml-1" fill="currentColor" />
              </div>
            </button>
          )}
        </div>

        <div className="mt-12">
          <h3 className="font-playfair text-2xl md:text-3xl text-ivory mb-4">2025 · La Boda</h3>
          <p className="text-ivory/60 text-lg">El capítulo más hermoso está por escribirse...</p>
        </div>
      </div>
    </section>
  )
}
