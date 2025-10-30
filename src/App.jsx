import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { VisitorModeProvider } from './context/VisitorModeContext'
import { queryClient } from './lib/queryClient'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import './css/App.css'

// Lazy load page components for code splitting
const HomePage = lazy(() => import('./pages/HomePage'))
const TopicMapPage = lazy(() => import('./pages/TopicMapPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <VisitorModeProvider>
            <Suspense fallback={<LoadingSpinner size="large" text="Loading..." />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/topic/:topicId" element={<TopicMapPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </VisitorModeProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
