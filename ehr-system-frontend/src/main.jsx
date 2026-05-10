import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { MetaMaskProvider } from './context/MetaMaskContext'
import * as ethers from 'ethers'

// Expose ethers globally for metamask.js to use
window.ethers = ethers

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MetaMaskProvider>
        <App />
      </MetaMaskProvider>
    </BrowserRouter>
  </StrictMode>,
)
