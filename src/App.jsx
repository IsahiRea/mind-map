import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { VisitorModeProvider } from './context/VisitorModeContext'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import TopicMapPage from './pages/TopicMapPage'
import NotFoundPage from './pages/NotFoundPage'
import './css/App.css'

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <VisitorModeProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/topic/:topicId" element={<TopicMapPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </VisitorModeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
