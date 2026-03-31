import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Clerk is disabled - using demo mode for authentication
// This avoids regional restrictions and API limits

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App clerkEnabled={false} />
    </BrowserRouter>
  </React.StrictMode>,
)
