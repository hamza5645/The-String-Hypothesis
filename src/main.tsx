import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './styles/ui.css'
import { CHAPTERS } from './chapters'
import { registerChapters } from './core/journey'
import { App } from './App'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
registerChapters(CHAPTERS)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
