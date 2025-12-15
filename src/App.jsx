import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { VisitorModeProvider } from './features/auth/context/VisitorModeContext'
import { ThemeProvider } from './shared/context/ThemeContext'
import { queryClient } from './lib/queryClient'
import { ErrorBoundary, LoadingSpinner } from './shared'
import './css/App.css'

// Lazy load page components for code splitting
const HomePage = lazy(() => import('./features/topics/pages/HomePage'))
const TopicMapPage = lazy(() => import('./features/nodes/pages/TopicMapPage'))
const NotFoundPage = lazy(() => import('./shared/components/NotFoundPage'))

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <ThemeProvider>
            <VisitorModeProvider>
              <Suspense fallback={<LoadingSpinner size="large" text="Loading..." />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/topic/:topicId" element={<TopicMapPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </VisitorModeProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
