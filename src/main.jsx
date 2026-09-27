import React from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import 'maplibre-gl/dist/maplibre-gl.css'
import './styles.css'
import './styles/nearby.css'
import './styles/detail.css'

registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)