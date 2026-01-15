import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Note: StrictMode removed to prevent double execution in Chrome extension
// StrictMode causes state updates to run twice, which duplicates queue items
createRoot(document.getElementById('root')).render(<App />)
