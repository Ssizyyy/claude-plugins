import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// WebGL canvases clear after each frame, so the "renders blank" check could not read them. Keep the buffer.
const getContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, attrs?: unknown) {
  const webgl = type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl'
  return (getContext as (t: string, a?: unknown) => unknown).call(this, type, webgl ? { ...(attrs as object), preserveDrawingBuffer: true } : attrs)
} as typeof getContext
import App from './App'

// CSS (keyframes etc.) that the registry items ship with; absent until `npm run gallery:fetch` has run
import.meta.glob('./items/_items.css', { eager: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
