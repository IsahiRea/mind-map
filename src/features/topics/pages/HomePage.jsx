import { useState, useMemo } from 'react'
import { useVisitorMode } from '../../auth/context/VisitorModeContext'
import { useTopics } from '../hooks/useTopics'
import { useKeyboardShortcuts } from '../../../shared/hooks/useKeyboardShortcuts'
import { Header, SearchBar, FilterControls, Skeleton } from '../../../shared'
import TopicCard from '../components/TopicCard'
import NewTopicModal from '../components/NewTopicModal'
import DeleteTopicModal from '../components/DeleteTopicModal'
import plusIcon from '../../../assets/icons/plus.svg'
import '../../../css/pages/HomePage.css'

const { TopicCardSkeleton } = Skeleton

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

      <section className="hero-section">
        <div className="hero-content">
          <h2 className="hero-headline">Your Learning Topics</h2>
          <p className="hero-subheadline">
            {topics.length} {topics.length === 1 ? 'topic' : 'topics'} in your collection
          </p>
        </div>
        <div className="hero-decoration" aria-hidden="true">
          <svg
            className="hero-nodes"
            viewBox="0 0 200 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="40" cy="60" r="8" fill="currentColor" opacity="0.15" />
            <circle cx="100" cy="30" r="6" fill="currentColor" opacity="0.2" />
            <circle cx="160" cy="70" r="10" fill="currentColor" opacity="0.1" />
            <circle cx="130" cy="100" r="5" fill="currentColor" opacity="0.15" />
            <circle cx="70" cy="90" r="7" fill="currentColor" opacity="0.12" />
            <path
              d="M40 60 L100 30 M100 30 L160 70 M160 70 L130 100 M130 100 L70 90 M70 90 L40 60"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.1"
            />
          </svg>
        </div>
      </section>

      <main className="main-content">
        <div className="content-header">
          <div className="content-actions">
            {!isVisitorMode && (
              <button className="new-topic-btn" onClick={() => setIsModalOpen(true)}>
                <img src={plusIcon} alt="" className="new-topic-icon" />
                <span>New Topic</span>
              </button>
            )}
          </div>
        </div>

        <div className="search-filter-container">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search topics..." />
          <FilterControls sortBy={sortBy} onSortChange={setSortBy} />
        </div>

        {searchQuery && (
          <p className="search-results-info">
            {filteredAndSortedTopics.length}{' '}
            {filteredAndSortedTopics.length === 1 ? 'result' : 'results'} for "{searchQuery}"
          </p>
        )}

        {filteredAndSortedTopics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.2"
                />
                <circle cx="32" cy="32" r="8" fill="currentColor" opacity="0.15" />
                <path
                  d="M32 4v12M32 48v12M4 32h12M48 32h12"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.15"
                />
              </svg>
            </div>
            <h3 className="empty-state-title">
              {searchQuery ? 'No matches found' : 'Start Your Journey'}
            </h3>
            <p className="empty-state-message">
              {searchQuery
                ? 'No topics match your search. Try a different search term.'
                : 'Create your first topic to begin mapping your learning path.'}
            </p>
            {!searchQuery && !isVisitorMode && (
              <button className="empty-state-cta" onClick={() => setIsModalOpen(true)}>
                <img src={plusIcon} alt="" className="empty-state-cta-icon" />
                <span>Create First Topic</span>
              </button>
            )}
          </div>
        ) : (
          <div className="topics-grid">
            {filteredAndSortedTopics.map((topic, index) => (
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
                style={{ '--card-index': index }}
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
