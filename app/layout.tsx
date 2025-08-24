import type { Metadata } from 'next'
import './globals.css'
import FixedZoom from '@/components/fixed-zoom'
import IOSDebugLogger from '@/components/ios-debug-logger'

export const metadata: Metadata = {
  title: 'Boda J&M',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* CRÍTICO: iPhone detection ULTRA-TEMPRANO - antes de cualquier CSS */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Detección iPhone inmediata
              var isIPhone = typeof navigator !== 'undefined' && /iPhone/.test(navigator.userAgent) && !window.MSStream;
              
              if (isIPhone) {
                // Aplicar clase inmediatamente
                document.documentElement.className += ' ios-scroll-native';
                
                // Global flag para otros componentes
                window.__isIPhone = true;
                window.__iphoneScrollNative = true;
                
                // Forzar scroll position inmediatamente
                if (typeof window !== 'undefined') {
                  window.scrollTo(0, 0);
                  document.documentElement.scrollTop = 0;
                  document.body.scrollTop = 0;
                }
                
                console.log('🍎 ULTRA-EARLY iPhone Detection: Native scroll mode activated');
              } else {
                window.__isIPhone = false;
              }
            })();
          `
        }} />
        
        {/* Favicon links */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Pinyon+Script&family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* iPhone-específico: Detección por user agent en CSS (via CSS.supports fallback) */
            
            /* Sistema de zoom fijo - CSS base para Desktop/Android */
            html { overflow: hidden; margin: 0; padding: 0; }
            body { margin: 0; padding: 0; overflow: hidden; background: #ffffff; }

            /* Único scroller explícito para Desktop/Android */
            #scroll-root {
              position: relative;
              height: 100vh;
              width: 100vw;
              overflow-y: auto; /* barra buena aquí */
              overflow-x: hidden;
              overscroll-behavior: none;
              -webkit-overflow-scrolling: touch;
            }

            /* iPhone-específico: Override para usar scroll nativo simple */
            @supports (-webkit-touch-callout: none) {
              /* Esta regla solo se aplica en iOS Safari */
              .ios-scroll-native html {
                overflow: auto !important;
                height: auto !important;
              }
              
              .ios-scroll-native body {
                overflow: auto !important;
                height: auto !important;
              }
              
              .ios-scroll-native #scroll-root {
                position: static !important;
                height: auto !important;
                overflow: visible !important;
                -webkit-overflow-scrolling: auto !important;
              }
              
              /* iPhone: Simplify wrapper to prevent conflicts */
              .ios-scroll-native #fixed-layout-wrapper {
                height: auto !important;
                max-height: none !important;
                min-height: auto !important;
                overflow: visible !important;
                overflow-y: visible !important;
              }
            }
            
            #fixed-layout-wrapper {
              position: relative;
              width: 100vw;
              /* HARD CUT en FixedZoom controla la altura exacta */
              overflow-x: hidden; /* solo evita scroll horizontal */
              overflow-y: hidden; /* evita segunda barra en wrapper */
            }
            
            #fixed-layout {
              width: 1920px;
              /* HARD CUT en FixedZoom mide y controla la altura total */
              transform-origin: top left;
              position: relative;
              display: flow-root; /* evita colapso de márgenes */
              overflow: hidden; /* evita scroll interno secundario en el lienzo */
            }
            
            /* iPhone-específico: Layout más simple */
            @supports (-webkit-touch-callout: none) {
              .ios-scroll-native #fixed-layout {
                overflow: visible !important;
              }
              
              .ios-scroll-native #fixed-layout-wrapper {
                overflow: visible !important;
                height: auto !important;
              }
              
              /* iPhone: Optimizaciones anti-crash */
              .ios-scroll-native .transform-gpu {
                transform: none !important;
                will-change: auto !important;
              }
              
              .ios-scroll-native .emergency-cleanup {
                animation: none !important;
                transition: opacity 0.3s ease !important;
                transform: none !important;
              }
              
              /* iPhone: Scroll suave y sin conflictos */
              .ios-scroll-native * {
                -webkit-overflow-scrolling: auto !important;
                overscroll-behavior: contain !important;
              }
              
              /* iPhone: Reducir complejidad de animaciones */
              .ios-scroll-native .timeline-item {
                animation-duration: 0.5s !important;
              }
              
              /* iPhone: Simplificar carouseles */
              .ios-scroll-native .relative img,
              .ios-scroll-native .relative video {
                transition: opacity 0.8s ease !important;
              }
              
              /* iPhone: Prevenir scroll bouncing y problemas de posicionamiento */
              .ios-scroll-native html,
              .ios-scroll-native body {
                position: relative !important;
                -webkit-overflow-scrolling: auto !important;
                overscroll-behavior: none !important;
                overflow-anchor: none !important;
                scroll-behavior: auto !important;
              }
              
              /* iPhone: Forzar posición inicial */
              .ios-scroll-native body {
                transform: translateZ(0) !important;
                backface-visibility: hidden !important;
              }
              
              /* iPhone: Prevenir reflows durante scroll */
              .ios-scroll-native * {
                backface-visibility: hidden !important;
              }
              
              /* iPhone: Elementos que causan problemas de scroll */
              .ios-scroll-native .timeline-item,
              .ios-scroll-native .hero-section,
              .ios-scroll-native #final-video-section {
                will-change: auto !important;
                transform: translateZ(0) !important;
              }
            }
          `
        }} />
      </head>
      <body>
        <div id="scroll-root">
          <div id="fixed-layout-wrapper">
            <div id="fixed-layout">
              {children}
            </div>
          </div>
        </div>
        <FixedZoom />
        <IOSDebugLogger />
      </body>
    </html>
  )
}
