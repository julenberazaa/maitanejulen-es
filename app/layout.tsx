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
            /* Sistema de zoom fijo - CSS base */
            html { overflow: hidden; margin: 0; padding: 0; }
            body { margin: 0; padding: 0; overflow: hidden; background: #ffffff; }

            /* Único scroller explícito */
            #scroll-root {
              position: relative;
              height: 100vh;
              width: 100vw;
              overflow-y: auto; /* barra buena aquí */
              overflow-x: hidden;
              overscroll-behavior: none;
              -webkit-overflow-scrolling: touch;
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
