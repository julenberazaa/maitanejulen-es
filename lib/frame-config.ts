export type OverlayFrame = {
  // Stable identifier for the frame (we reuse previous anchor names)
  id: string
  // Image source path
  src: string
  // Object fit strategy for the image. Defaults to 'cover' to preserve previous behavior.
  fit?: 'cover' | 'contain' | 'fill'
  // Offset from viewport center (px)
  x?: number
  y?: number
  // Desired rendered size (px). If one is omitted, the browser keeps aspect ratio.
  width?: number
  height?: number
  // Non-uniform scale factors (applied after centering). Defaults to 1.
  scaleX?: number
  scaleY?: number
  // Mobile-specific vertical offset to fix alignment issues (px)
  mobileOffsetY?: number
  // Visibility toggle
  visible?: boolean
}

// Initial defaults: centered with moderate size. Tune per-frame manually.
const DEFAULT_WIDTH = 600
const DEFAULT_HEIGHT = 400

export const OVERLAY_FRAMES: OverlayFrame[] = [
  // Primeras escapadas
  { id: 'carousel-frame-anchor', src: '/frames/frame-02.png', x: 138, y: 1706, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.45, scaleY: 1.455, mobileOffsetY: 0, visible: true },
  // Estudios universitarios
  { id: 'carousel-frame-anchor-estudios', src: '/frames/frame-03.png', x: -498, y: 2328, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.36, scaleY: 1.45, mobileOffsetY: 0, visible: true },
  // Policía (custom)
  { id: 'frame-anchor-policia', src: '/frames/udaltzaingoa_marco_real.png', fit: 'contain', x: 152, y: 2980, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.55, scaleY: 1.85, mobileOffsetY: 0, visible: true },
  // Medicina / MIR (custom)
  { id: 'frame-anchor-medicina', src: '/medicina-marco.png', x: -492, y: 3590, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.225, scaleY: 1.45, mobileOffsetY: 0, visible: true },
  // Hobbies
  { id: 'carousel-frame-anchor-hobbies', src: '/frames/frame-05.png', x: 152, y: 4218, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.44, scaleY: 1.50, mobileOffsetY: 0, visible: true },
  // Independizarse - Ahora usa el marco que antes tenía Pedida de mano
  { id: 'carousel-frame-anchor-indep', src: '/frames/frame-04.png', x: -496, y: 4872, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.44, scaleY: 1.54, mobileOffsetY: 0, visible: true },
  // Ilun
  { id: 'carousel-frame-anchor-ilun', src: '/frames/frame-07.png', x: 150, y: 5552, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.36, scaleY: 1.45, mobileOffsetY: 0, visible: true },
  // Pedida - Ahora usa la nueva imagen
  { id: 'carousel-frame-anchor-pedida', src: '/frames/ChatGPT Image 17 ago 2025, 18_48_23.webp', x: -488, y: 6304, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.44, scaleY: 1.54, mobileOffsetY: 0, visible: true },
]