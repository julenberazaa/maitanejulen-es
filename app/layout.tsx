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
              margin: 0;
              padding: 0;
            }
            
            body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
              width: 100vw;
            }
            
            #fixed-layout {
              width: 1920px;
              min-height: 100vh;
              transform-origin: top left;
              position: relative;
            }
          `
        }} />
      </head>
      <body>
        <div id="fixed-layout">
          {children}
        </div>
        <FixedZoom />
      </body>
    </html>
  )
}
