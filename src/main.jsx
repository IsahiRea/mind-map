import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.jsx'
import { validateEnv } from './lib/env'

// Validate environment variables before rendering the app
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  document.getElementById('root').innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    ">
      <div style="
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        max-width: 600px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      ">
        <div style="font-size: 3rem; text-align: center; margin-bottom: 1rem;">⚠️</div>
        <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #1f2937; text-align: center;">
          Configuration Error
        </h1>
        <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6; white-space: pre-wrap;">
          ${error.message}
        </p>
      </div>
    </div>
  `;
  throw error;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
