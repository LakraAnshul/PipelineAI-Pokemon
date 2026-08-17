import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CompareProvider } from './contexts/CompareContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './styles/index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found in index.html')

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <FavoritesProvider>
          <CompareProvider>
            <App />
          </CompareProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
