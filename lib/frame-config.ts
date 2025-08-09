export type FrameConfig = {
  src: string
  scale?: number
  scaleX?: number
  scaleY?: number
  offsetX?: number
  offsetY?: number
}

const DEFAULT_SCALE = 1.6

const FRAME_CONFIGS: Record<string, FrameConfig> = {
  // Primeras escapadas
  'carousel-frame-anchor': { src: '/frames/frame-02.png', scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 },
  // Estudios universitarios
  'carousel-frame-anchor-estudios': { src: '/frames/frame-03.png', scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 },
  // Policía (custom)
  'frame-anchor-policia': { src: '/policia-marco.png', scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 },
  // Medicina / MIR (custom)
  'frame-anchor-medicina': { src: '/medicina-marco.png', scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 },
  // Hobbies
  'carousel-frame-anchor-hobbies': { src: '/frames/frame-05.png', scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 },
  // Independizarse
  'carousel-frame-anchor-indep': { src: '/frames/frame-06.png', scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 },
  // Ilun
  'carousel-frame-anchor-ilun': { src: '/frames/frame-07.png', scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 },
  // Pedida
  'carousel-frame-anchor-pedida': { src: '/frames/frame-04.png', scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 },
}

export function getFrameConfig(anchorName: string): FrameConfig {
  return FRAME_CONFIGS[anchorName] ?? { src: '/frames/frame-02.png', scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 }
}

export function setFrameConfig(anchorName: string, config: Partial<FrameConfig>) {
  const current = FRAME_CONFIGS[anchorName] ?? { src: '/frames/frame-02.png', scale: DEFAULT_SCALE, offsetX: 0, offsetY: 0 }
  FRAME_CONFIGS[anchorName] = { ...current, ...config }
} 