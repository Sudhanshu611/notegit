import React from 'react'
import ReactDOM from 'react-dom/client'
import AppShell from './components/layout/AppShell.jsx'
import './styles/tokens.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>,
)
