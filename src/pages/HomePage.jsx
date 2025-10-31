import { useState, useMemo } from 'react'
import { useVisitorMode } from '../context/VisitorModeContext'
import { useTopics } from '../hooks/useTopics'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import Header from '../components/Header'
import TopicCard from '../components/TopicCard'
import NewTopicModal from '../components/NewTopicModal'
import DeleteTopicModal from '../components/DeleteTopicModal'
import SearchBar from '../components/SearchBar'
import FilterControls from '../components/FilterControls'
import { TopicCardSkeleton } from '../components/Skeleton'
import plusIcon from '../assets/icons/plus.svg'
import '../css/pages/HomePage.css'

export default function HomePage() {
  const { isVisitorMode } = useVisitorMode()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const { topics, loading, error, createTopic, deleteTopic } = useTopics()

  const handleCreateTopic = async newTopic => {
    try {
      await createTopic(newTopic)
      setIsModalOpen(false)
    } catch (err) {
      console.error('Failed to create topic:', err)
      alert('Failed to create topic. Please try again.')
    }
  }

  const handleDeleteClick = topicId => {
    const topic = topics.find(t => t.id === topicId)
    setTopicToDelete(topic)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!topicToDelete) return

    try {
      await deleteTopic(topicToDelete.id)
      setTopicToDelete(null)
    } catch (err) {
      console.error('Failed to delete topic:', err)
      alert('Failed to delete topic. Please try again.')
    }
  }

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false)
    setTopicToDelete(null)
  }

  // Filter and sort topics
  const filteredAndSortedTopics = useMemo(() => {
    let result = [...topics]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        topic =>
          topic.title.toLowerCase().includes(query) ||
          topic.description.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt)
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt)
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
        case 'nodes-desc':
          return (b.nodeCount || 0) - (a.nodeCount || 0)
        case 'nodes-asc':
          return (a.nodeCount || 0) - (b.nodeCount || 0)
        default:
          return 0
      }
    })

    return result
  }, [topics, searchQuery, sortBy])

  // Keyboard shortcuts
  useKeyboardShortcuts(
    {
      'Ctrl+n': () => {
        if (!isVisitorMode) {
          setIsModalOpen(true)
        }
      },
      'Ctrl+k': e => {
        e.preventDefault()
        document.querySelector('.search-input')?.focus()
      },
      Escape: () => {
        if (isModalOpen) {
          setIsModalOpen(false)
        }
        if (deleteModalOpen) {
          handleCloseDeleteModal()
        }
        if (searchQuery) {
          setSearchQuery('')
        }
      },
    },
    true
  )

  if (loading) {
    return (
      <div className="home-page">
        <Header />
        <main className="main-content">
          <div className="content-header">
            <div className="content-title-section">
              <h2 className="content-title">Your Learning Topics</h2>
              <p className="content-subtitle">Loading your topics...</p>
            </div>
          </div>
          <div className="topics-grid">
            {[...Array(6)].map((_, i) => (
              <TopicCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="home-page">
        <Header />
        <main className="main-content">
          <div className="content-header">
            <div className="content-title-section">
              <h2 className="content-title">Error</h2>
              <p className="content-subtitle" style={{ color: '#ef4444' }}>
                Failed to load topics: {error}
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="home-page">
      <Header />

      <main className="main-content">
        <div className="content-header">
          <div className="content-title-section">
            <h2 className="content-title">Your Learning Topics</h2>
            <p className="content-subtitle">
              {filteredAndSortedTopics.length}{' '}
              {filteredAndSortedTopics.length === 1 ? 'topic' : 'topics'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
          {!isVisitorMode && (
            <button className="new-topic-btn" onClick={() => setIsModalOpen(true)}>
              <img src={plusIcon} alt="" className="new-topic-icon" />
              <span>New Topic</span>
            </button>
          )}
        </div>

        <div className="search-filter-container">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search topics..." />
          <FilterControls sortBy={sortBy} onSortChange={setSortBy} />
        </div>

        {filteredAndSortedTopics.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-message">
              {searchQuery
                ? 'No topics match your search. Try a different search term.'
                : 'No topics yet. Create your first topic to get started!'}
            </p>
          </div>
        ) : (
          <div className="topics-grid">
            {filteredAndSortedTopics.map(topic => (
              <TopicCard
                key={topic.id}
                id={topic.id}
                iconBgColor={topic.iconBgColor}
                iconColor={topic.iconColor}
                title={topic.title}
                description={topic.description}
                nodeCount={topic.nodeCount}
                isVisitorMode={isVisitorMode}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </main>

      <NewTopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTopic}
      />

      <DeleteTopicModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        topicTitle={topicToDelete?.title || ''}
      />
    </div>
  )
}
