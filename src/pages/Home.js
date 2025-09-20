import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import TopicCard from '../components/TopicCard';
import Loader from '../components/Loader';

const Home = () => {
  // State management
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch topics function with proper error handling
  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/topics/root');
      
      // Validate response data
      if (response.data && Array.isArray(response.data.topics)) {
        setTopics(response.data.topics);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err);
      setError(err.message || 'Failed to load topics. Please try again.');
      setTopics([]); // Reset topics on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to fetch topics on component mount
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Retry handler for error state
  const handleRetry = useCallback(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <Loader />
            <p className="text-muted mt-3 mb-0">Loading topics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <svg width="64" height="64" fill="currentColor" className="text-danger" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                </div>
                <h4 className="text-danger mb-3">Oops! Something went wrong</h4>
                <p className="text-muted mb-4">{error}</p>
                <button 
                  type="button" 
                  className="btn btn-danger px-4 py-2"
                  onClick={handleRetry}
                >
                  <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!topics.length) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <svg 
                    width="80" 
                    height="80" 
                    fill="currentColor" 
                    className="text-muted" 
                    viewBox="0 0 16 16"
                  >
                    <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z"/>
                    <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z"/>
                  </svg>
                </div>
                <h4 className="text-muted mb-3">No Topics Available</h4>
                <p className="text-muted mb-4">
                  There are currently no topics to explore. Check back later!
                </p>
                <button 
                  type="button" 
                  className="btn btn-primary px-4 py-2"
                  onClick={handleRetry}
                >
                  <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="container-fluid px-4 py-4">
      <div className="row g-4">
        {/* Main Content - Full Width */}
        <div className="col-12">
          {/* Header Section */}
          <div className="row mb-5">
            <div className="col-12">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 p-4 bg-light rounded-3 shadow-sm">
                <div className="flex-grow-1">
                  <h1 className="h2 mb-2 text-primary fw-bold">Explore Topics</h1>
                  <p className="text-muted mb-0 fs-6">
                    Discover and learn about various subjects through our curated collection
                  </p>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary fs-6 px-3 py-2 rounded-pill">
                      {topics.length} {topics.length === 1 ? 'Topic' : 'Topics'}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 px-3 py-2"
                    onClick={handleRetry}
                    title="Refresh topics"
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                      <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                    </svg>
                    <span className="d-none d-sm-inline">Refresh</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Topics Grid Section */}
          <div className="row">
            <div className="col-12">
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4">
                {topics.map((topic, index) => (
                  <div key={topic.id || `topic-${index}`} className="col">
                    <div className="card h-100 shadow-sm border-0 topic-card position-relative overflow-hidden">
                      <div className="card-body p-0 d-flex flex-column h-100">
                        <div className="topic-card-wrapper" style={{ aspectRatio: '1/1' }}>
                          <TopicCard t={topic} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Load More Section */}
          {topics.length > 0 && topics.length >= 10 && (
            <div className="row mt-5">
              <div className="col-12">
                <div className="text-center">
                  <button 
                    type="button" 
                    className="btn btn-outline-primary btn-lg px-5 py-3"
                    onClick={handleRetry}
                  >
                    <svg width="20" height="20" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                    Load More Topics
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for square cards and hover effects */}
      <style jsx>{`
        .topic-card {
          transition: all 0.3s ease;
          border-radius: 12px !important;
        }
        
        .topic-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
        }
        
        .topic-card-wrapper {
          width: 100%;
          position: relative;
          overflow: hidden;
          border-radius: 12px;
        }
        
        @media (max-width: 576px) {
          .topic-card-wrapper {
            aspect-ratio: 4/3 !important;
          }
        }
        
        .bg-light {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
        }
        
        .card {
          border-radius: 12px !important;
        }
        
        .btn {
          border-radius: 8px !important;
        }
        
        .badge {
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
};

export default Home;