import { useState } from 'react';
import Header from '../components/Header';
import TopicCard from '../components/TopicCard';
import NewTopicModal from '../components/NewTopicModal';
import plusIcon from '../assets/icons/plus.svg';
import '../css/pages/HomePage.css';

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topics, setTopics] = useState([
    {
      id: 1,
      iconBgColor: 'rgba(59, 130, 246, 0.13)',
      iconColor: '#3b82f6',
      title: 'Web Development',
      description: 'Learning modern web technologies',
      nodeCount: 3
    },
    {
      id: 2,
      iconBgColor: 'rgba(139, 92, 246, 0.13)',
      iconColor: '#8b5cf6',
      title: 'Data Science',
      description: 'Exploring data analysis and ML',
      nodeCount: 2
    }
  ]);

  const handleCreateTopic = (newTopic) => {
    const topic = {
      id: Date.now(),
      ...newTopic
    };
    setTopics([...topics, topic]);
  };

  return (
    <div className="home-page">
      <Header />

      <main className="main-content">
        <div className="content-header">
          <div className="content-title-section">
            <h2 className="content-title">Your Learning Topics</h2>
            <p className="content-subtitle">Explore your knowledge map</p>
          </div>
          <button className="new-topic-btn" onClick={() => setIsModalOpen(true)}>
            <img src={plusIcon} alt="" className="new-topic-icon" />
            <span>New Topic</span>
          </button>
        </div>

        <div className="topics-grid">
          {topics.map(topic => (
            <TopicCard
              key={topic.id}
              iconBgColor={topic.iconBgColor}
              iconColor={topic.iconColor}
              title={topic.title}
              description={topic.description}
              nodeCount={topic.nodeCount}
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
