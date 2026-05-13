import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MockDataProvider } from './context/MockDataContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MockDataProvider>
      <App />
    </MockDataProvider>
  </StrictMode>,
)
