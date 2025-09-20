import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Loader from '../components/Loader';

const TopicDetail = () => {
  const { '*': slugPath } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date helper
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Fetch topic data with proper error handling
  const fetchTopicData = useCallback(async () => {
    if (!slugPath) {
      setError('Invalid topic path');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/topics/slug/${slugPath}/`);
      
      if (response.data) {
        setData(response.data);
      } else {
        throw new Error('No data received');
      }
    } catch (err) {
      console.error('Error fetching topic:', err);
      setError(err.response?.status === 404 ? 'Topic not found' : 'Failed to load topic data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slugPath]);

  // Effect to fetch data on component mount or slug change
  useEffect(() => {
    fetchTopicData();
  }, [fetchTopicData]);

  // Retry handler
  const handleRetry = useCallback(() => {
    fetchTopicData();
  }, [fetchTopicData]);

  // Breadcrumb generation
  const generateBreadcrumbs = () => {
    if (!slugPath) return [];
    
    const parts = slugPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', path: '/' }];
    
    let currentPath = '/topic';
    parts.forEach((part, index) => {
      currentPath += `/${part}`;
      breadcrumbs.push({
        name: part.charAt(0).toUpperCase() + part.slice(1),
        path: currentPath,
        isLast: index === parts.length - 1
      });
    });
    
    return breadcrumbs;
  };

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="text-center">
            <Loader />
            <p className="text-muted mt-3 mb-0">Loading topic details...</p>
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
                  <svg width="64" height="64" fill="currentColor" className="text-warning" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                </div>
                <h4 className="text-warning mb-3">{error}</h4>
                <p className="text-muted mb-4">
                  {error === 'Topic not found' 
                    ? 'The topic you\'re looking for doesn\'t exist or may have been moved.'
                    : 'Unable to load topic details. Please check your connection and try again.'
                  }
                </p>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <button 
                    type="button" 
                    className="btn btn-warning px-4"
                    onClick={handleRetry}
                  >
                    <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                      <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                    </svg>
                    Try Again
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary px-4"
                    onClick={() => navigate('/')}
                  >
                    <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                      <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                    </svg>
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { topic, children = [], blocks = [] } = data || {};

  if (!topic) {
    return (
      <div className="container-fluid py-5">
        <div className="alert alert-info text-center">
          <h5>No Topic Data</h5>
          <p className="mb-0">Topic information is not available.</p>
        </div>
      </div>
    );
  }

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="container-fluid px-4 py-4">
      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 1 && (
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb bg-light p-3 rounded-3 shadow-sm">
            {breadcrumbs.map((crumb, index) => (
              <li 
                key={index}
                className={`breadcrumb-item ${crumb.isLast ? 'active' : ''}`}
                {...(crumb.isLast && { 'aria-current': 'page' })}
              >
                {crumb.isLast ? (
                  <span className="fw-medium">{crumb.name}</span>
                ) : (
                  <Link to={crumb.path} className="text-decoration-none">
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Main Content Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 pb-0">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div className="flex-grow-1">
              <h1 className="h2 mb-2 text-primary fw-bold">{topic.title}</h1>
              <p className="text-muted mb-0 fs-6">
                {topic.description || 'No description provided.'}
              </p>
            </div>
            <div className="d-flex flex-column align-items-end">
              <small className="text-muted">
                <svg width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                </svg>
                Created: {formatDate(topic.created_at)}
              </small>
              {topic.updated_at && topic.updated_at !== topic.created_at && (
                <small className="text-muted">
                  <svg width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                    <path d="M1.5 0A1.5 1.5 0 0 0 0 1.5v13A1.5 1.5 0 0 0 1.5 16h13a1.5 1.5 0 0 0 1.5-1.5V6.954L10.293.5A1 1 0 0 0 9.586 0H1.5z"/>
                  </svg>
                  Updated: {formatDate(topic.updated_at)}
                </small>
              )}
            </div>
          </div>
        </div>

        <div className="card-body pt-4">
          {/* Subtopics Section */}
          <section className="mb-5">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="h5 mb-0 d-flex align-items-center">
                <svg width="20" height="20" fill="currentColor" className="me-2 text-primary" viewBox="0 0 16 16">
                  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
                </svg>
                Subtopics
              </h3>
              {children.length > 0 && (
                <span className="badge bg-primary rounded-pill">
                  {children.length}
                </span>
              )}
            </div>
            
            {children.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <svg width="48" height="48" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                    <path d="M6 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1H9v1.07A7.001 7.001 0 0 1 8 15.5a7.001 7.001 0 0 1-1-11.93V2.5H6.5A.5.5 0 0 1 6 2z"/>
                  </svg>
                </div>
                <p className="text-muted mb-0">No subtopics available yet.</p>
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {children.map((child) => (
                  <div key={child.id} className="col">
                    <div className="card h-100 border-0 shadow-sm subtopic-card">
                      <div className="card-body p-4">
                        <Link
                          to={`/topic/${child.full_path}`}
                          className="text-decoration-none"
                        >
                          <h5 className="card-title text-primary mb-2 fw-bold">
                            {child.title}
                            <svg width="16" height="16" fill="currentColor" className="ms-2" viewBox="0 0 16 16">
                              <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                            </svg>
                          </h5>
                        </Link>
                        <p className="card-text text-muted small mb-0">
                          {child.description || 'No description available.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Content Blocks Section */}
          <section>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="h5 mb-0 d-flex align-items-center">
                <svg width="20" height="20" fill="currentColor" className="me-2 text-success" viewBox="0 0 16 16">
                  <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                </svg>
                Content Blocks
              </h3>
              {blocks.length > 0 && (
                <span className="badge bg-success rounded-pill">
                  {blocks.length}
                </span>
              )}
            </div>
            
            {blocks.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <svg width="48" height="48" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                    <path d="M3 5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm2-1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H5z"/>
                  </svg>
                </div>
                <p className="text-muted mb-0">No content blocks available.</p>
              </div>
            ) : (
              <div className="row g-4">
                {blocks.map((block, index) => (
                  <div key={index} className="col-12">
                    <div className="card border-0 bg-light">
                      <div className="card-header bg-transparent border-0 pb-0">
                        <div className="d-flex align-items-center justify-content-between">
                          <h6 className="mb-0 text-success">
                            <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                              <path d="M6 9a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 9zM3.854 4.146a.5.5 0 1 0-.708.708L4.793 6.5 3.146 8.146a.5.5 0 1 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2z"/>
                              <path d="M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm0 1h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
                            </svg>
                            Content Block {index + 1}
                          </h6>
                          <span className="badge bg-success">
                            {typeof block === 'object' ? 'JSON' : typeof block}
                          </span>
                        </div>
                      </div>
                      <div className="card-body">
                        <pre className="bg-white p-3 rounded border overflow-auto" style={{ maxHeight: '300px' }}>
                          <code>{JSON.stringify(block, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        .subtopic-card {
          transition: all 0.3s ease;
          border-radius: 12px !important;
        }
        
        .subtopic-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
        }
        
        .subtopic-card .card-title {
          transition: color 0.2s ease;
        }
        
        .subtopic-card:hover .card-title {
          color: #0d6efd !important;
        }
        
        .breadcrumb-item + .breadcrumb-item::before {
          content: "›";
          font-weight: bold;
          color: #6c757d;
        }
        
        .card {
          border-radius: 12px !important;
        }
        
        .btn {
          border-radius: 8px !important;
        }
        
        pre {
          font-size: 0.875rem;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default TopicDetail;