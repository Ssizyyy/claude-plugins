import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// CSS (keyframes etc.) that the registry items ship with; absent until `npm run gallery:fetch` has run
import.meta.glob('./items/_items.css', { eager: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
