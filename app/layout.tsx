import type { Metadata } from 'next'
import './globals.css'
import FixedZoom from '@/components/fixed-zoom'

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Pinyon+Script&family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Sistema de zoom fijo - CSS base */
            html {
              overflow-x: hidden;
              overflow-y: hidden; /* evita segunda barra en html */
              margin: 0;
              padding: 0;
              scroll-behavior: smooth; /* scroll suave */
              overscroll-behavior: none; /* evita estiramiento */
              /* HARD CUT controla la altura - no fijar min-height aquí */
            }
            
            body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
              overflow-y: auto;
              width: 100vw;
              /* HARD CUT controla la altura - no fijar min-height aquí */
              -webkit-overflow-scrolling: touch; /* suaviza en iOS */
              background: #ffffff; /* coherente */
            }
            
            #fixed-layout-wrapper {
              position: relative;
              width: 100vw;
              /* HARD CUT en FixedZoom controla la altura exacta */
              overflow-x: hidden; /* solo evita scroll horizontal */
            }
            
            #fixed-layout {
              width: 1920px;
              /* HARD CUT en FixedZoom mide y controla la altura total */
              transform-origin: top left;
              position: relative;
              display: flow-root; /* evita colapso de márgenes */
            }
          `
        }} />
      </head>
      <body>
        <div id="fixed-layout-wrapper">
          <div id="fixed-layout">
            {children}
          </div>
        </div>
        <FixedZoom />
      </body>
    </html>
  )
}
