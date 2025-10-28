import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { VisitorModeProvider } from './context/VisitorModeContext'
import HomePage from './pages/HomePage'
import TopicMapPage from './pages/TopicMapPage'
import NotFoundPage from './pages/NotFoundPage'
import './css/App.css'

function App() {
  return (
    <BrowserRouter>
      <VisitorModeProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/topic/:topicId" element={<TopicMapPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </VisitorModeProvider>
    </BrowserRouter>
  )
}

export default App
