export type OverlayFrame = {
  // Stable identifier for the frame (we reuse previous anchor names)
  id: string
  // Image source path
  src: string
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
  { id: 'carousel-frame-anchor', src: '/frames/frame-02.png', x: 146, y: 1690, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.45, scaleY: 1.455, mobileOffsetY: 100, visible: true },
  // Estudios universitarios
  { id: 'carousel-frame-anchor-estudios', src: '/frames/frame-03.png', x: -490, y: 2250, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.36, scaleY: 1.45, mobileOffsetY: 80, visible: true },
  // Policía (custom)
  { id: 'frame-anchor-policia', src: '/udaltzaingoa_marco.png', x: 348, y: 2401, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.225, scaleY: 1.45, mobileOffsetY: 0, visible: true },
  // Medicina / MIR (custom)
  { id: 'frame-anchor-medicina', src: '/medicina-marco.png', x: -295, y: 2960, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.225, scaleY: 1.45, mobileOffsetY: 0, visible: true },
  // Hobbies
  { id: 'carousel-frame-anchor-hobbies', src: '/frames/frame-05.png', x: 351, y: 3524, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.44, scaleY: 1.50, mobileOffsetY: 0, visible: true },
  // Independizarse
  { id: 'carousel-frame-anchor-indep', src: '/frames/frame-06.png', x: -302, y: 4088, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.45, scaleY: 1.455, mobileOffsetY: 0, visible: true },
  // Ilun
  { id: 'carousel-frame-anchor-ilun', src: '/frames/frame-07.png', x: 342, y: 4685, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.36, scaleY: 1.45, mobileOffsetY: 0, visible: true },
  // Pedida
  { id: 'carousel-frame-anchor-pedida', src: '/frames/frame-04.png', x: -297, y: 5243, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, scaleX: 1.44, scaleY: 1.545, mobileOffsetY: 0, visible: true },
]