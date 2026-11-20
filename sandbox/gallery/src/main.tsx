import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

captureConsole()

// WebGL canvases clear after each frame, so the "renders blank" check could not read them. Keep the buffer.
const getContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, attrs?: unknown) {
  const webgl = type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl'
  return (getContext as (t: string, a?: unknown) => unknown).call(this, type, webgl ? { ...(attrs as object), preserveDrawingBuffer: true } : attrs)
} as typeof getContext
import App from './App'
import { captureConsole } from './reports'
import { Review, Select } from './Run'

// design-pass handoff routes (#/select/<run>, #/review/<run>) replace the grid; everything else is the gallery
function Root() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => setHash(location.hash)
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  const m = /^#\/(select|review)\/([\w.-]+)/.exec(hash)
  return m ? m[1] === 'select' ? <Select id={m[2]} /> : <Review id={m[2]} /> : <App />
}

// CSS (keyframes etc.) that the registry items ship with; absent until `npm run gallery:fetch` has run
import.meta.glob('./items/_items.css', { eager: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
