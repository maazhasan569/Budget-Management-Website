import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthSessionProvider } from './components/auth/auth-session-provider.jsx'
import "./index.css"

document.documentElement.classList.add("dark")
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <StrictMode>
    <AuthSessionProvider>
      <App />
    </AuthSessionProvider>
  </StrictMode>
  </BrowserRouter>
)
