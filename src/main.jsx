import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'

const UPDATE_CHECK_INTERVAL_MS = 60 * 1000

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // GitHub Pages cache file sw.js toi 10 phut, nen tu chu dong
      // kiem tra ban moi thuong xuyen thay vi cho trinh duyet tu kiem tra
      setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS)
    }
  })

  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
