import { useState } from 'react';
import { useVisitorMode } from '../context/VisitorModeContext';
import { useTopics } from '../hooks/useTopics';
import Header from '../components/Header';
import TopicCard from '../components/TopicCard';
import NewTopicModal from '../components/NewTopicModal';
import plusIcon from '../assets/icons/plus.svg';
import '../css/pages/HomePage.css';

export default function HomePage() {
  const { isVisitorMode } = useVisitorMode();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { topics, loading, error, createTopic, deleteTopic } = useTopics();

  const handleCreateTopic = async (newTopic) => {
    try {
      await createTopic(newTopic);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create topic:', err);
      alert('Failed to create topic. Please try again.');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic? All nodes and connections will be permanently deleted.')) {
      return;
    }

    try {
      await deleteTopic(topicId);
    } catch (err) {
      console.error('Failed to delete topic:', err);
      alert('Failed to delete topic. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="home-page">
        <Header />
        <main className="main-content">
          <div className="content-header">
            <div className="content-title-section">
              <h2 className="content-title">Your Learning Topics</h2>
              <p className="content-subtitle">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
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
    );
  }

  return (
    <div className="home-page">
      <Header />

      <main className="main-content">
        <div className="content-header">
          <div className="content-title-section">
            <h2 className="content-title">Your Learning Topics</h2>
            <p className="content-subtitle">Explore your knowledge map</p>
          </div>
          {!isVisitorMode && (
            <button className="new-topic-btn" onClick={() => setIsModalOpen(true)}>
              <img src={plusIcon} alt="" className="new-topic-icon" />
              <span>New Topic</span>
            </button>
          )}
        </div>

        <div className="topics-grid">
          {topics.map(topic => (
            <TopicCard
              key={topic.id}
              id={topic.id}
              iconBgColor={topic.iconBgColor}
              iconColor={topic.iconColor}
              title={topic.title}
              description={topic.description}
              nodeCount={topic.nodeCount}
              isVisitorMode={isVisitorMode}
              onDelete={handleDeleteTopic}
            />
          ))}
        </div>
      </main>

      <NewTopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTopic}
      />
    </div>
  );
}
