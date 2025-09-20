import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Loader from '../components/Loader';

/**
 * Helper: convert possible locations of components in API response to a single array
 * - Prefer data.components
 * - Else look for blocks[].components and return the first one found (or flatten all)
 */
const extractComponents = (data) => {
  if (!data) return [];
  if (Array.isArray(data.components) && data.components.length) return data.components;

  // If blocks is an array of content pieces which themselves contain components
  if (Array.isArray(data.blocks) && data.blocks.length) {
    // find first block with components
    for (const b of data.blocks) {
      if (b && Array.isArray(b.components) && b.components.length) return b.components;
    }
    // fallback: maybe blocks themselves are the components (rare)
    if (data.blocks.every(b => typeof b === 'object' && b.type)) {
      return data.blocks;
    }
  }

  return [];
};

/** Render a single content block into an HTML element */
const renderComponent = (block, idx) => {
  if (!block || typeof block !== 'object') return null;

  const t = block.type;
  switch (t) {
    case 'heading': {
      const level = block.level || 1;
      const text = block.text ?? '';
      if (level === 1) return <h1 key={idx} className="mb-3">{text}</h1>;
      if (level === 2) return <h2 key={idx} className="mb-3">{text}</h2>;
      if (level === 3) return <h3 key={idx} className="mb-3">{text}</h3>;
      return <h4 key={idx} className="mb-3">{text}</h4>;
    }

    case 'paragraph': {
      const text = block.text ?? block.content ?? '';
      return <p key={idx} className="mb-3">{text}</p>;
    }

    case 'code': {
      const code = block.code ?? block.text ?? '';
      const title = block.title ?? null;
      const lang = block.language ?? '';
      return (
        <div key={idx} className="mb-3">
          {title && <h6 className="fw-bold mb-2">{title}</h6>}
          <pre className="p-3 rounded" style={{ background: '#0b1220', color: '#e6edf3', overflowX: 'auto' }}>
            <code className={`language-${lang}`} style={{ whiteSpace: 'pre-wrap', fontFamily: 'Source Code Pro, monospace' }}>
              {code}
            </code>
          </pre>
        </div>
      );
    }

    case 'note': {
      const content = block.content ?? block.text ?? '';
      return (
        <div key={idx} className="alert alert-info my-3">
          <strong>Tip: </strong>{content}
        </div>
      );
    }

    case 'example': {
      const title = block.title ?? 'Example';
      const content = block.content ?? block.text ?? '';
      return (
        <div key={idx} className="card mb-3 shadow-sm">
          <div className="card-body">
            <h6 className="fw-semibold">📌 {title}</h6>
            <div className="small text-muted">{content}</div>
          </div>
        </div>
      );
    }

    case 'practice_link': {
      const url = block.url ?? block.href ?? '#';
      const title = block.title ?? url;
      const platform = block.platform ?? '';
      return (
        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary d-inline-block mb-2">
          {platform ? `${platform}: ` : ''}{title}
        </a>
      );
    }

    case 'links': {
      const items = Array.isArray(block.items) ? block.items : [];
      return (
        <ul key={idx} className="list-unstyled mb-3">
          {items.map((it, i) => (
            <li key={i} className="mb-1">
              🔗 <a href={it.href} target="_blank" rel="noopener noreferrer">{it.text || it.href}</a>
            </li>
          ))}
        </ul>
      );
    }

    case 'discussion_anchor': {
      const anchor = block.anchor_id ?? 'discussion';
      return (
        <div key={idx} id={anchor} className="my-4">
          <h5>💬 Discussion</h5>
          <p className="text-muted small">Comments and discussion will appear here.</p>
        </div>
      );
    }

    // fallback: if unknown but has text, render as paragraph
    default: {
      const fallbackText = block.text ?? block.content ?? null;
      if (fallbackText) return <p key={idx} className="mb-3">{fallbackText}</p>;
      return null;
    }
  }
};

const TopicDetail = () => {
  const { '*': slugPath } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const fetchTopicData = useCallback(async () => {
    if (!slugPath) {
      setError('Invalid topic path');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/topics/slug/${slugPath}/`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 404 ? 'Topic not found' : 'Failed to load topic data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slugPath]);

  useEffect(() => {
    fetchTopicData();
  }, [fetchTopicData]);

  const generateBreadcrumbs = () => {
    if (!slugPath) return [];
    const parts = slugPath.split('/').filter(Boolean);
    const crumbs = [{ name: 'Home', path: '/' }];
    let cur = '/topic';
    parts.forEach((p, i) => {
      cur += `/${p}`;
      crumbs.push({ name: p.charAt(0).toUpperCase() + p.slice(1), path: cur, isLast: i === parts.length - 1 });
    });
    return crumbs;
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <Loader />
        <p className="text-muted mt-3">Loading topic details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-secondary mt-3" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  if (!data || !data.topic) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="alert alert-warning">No topic data available.</div>
      </div>
    );
  }

  const { topic, children = [] } = data;
  const components = extractComponents(data); // our canonical array of content components

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="container-fluid px-4 py-4">
      {breadcrumbs.length > 1 && (
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb bg-light p-3 rounded-3 shadow-sm">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className={`breadcrumb-item ${crumb.isLast ? 'active' : ''}`}>
                {crumb.isLast ? <span>{crumb.name}</span> : <Link to={crumb.path}>{crumb.name}</Link>}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 pb-0 d-flex justify-content-between align-items-start">
          <div>
            <h1 className="h2 mb-1 text-primary fw-bold">{topic.title}</h1>
            <p className="text-muted mb-0">{topic.description || ''}</p>
          </div>
          <div className="text-end">
            <small className="text-muted">Created: {formatDate(topic.created_at)}</small>
            {topic.updated_at && <div><small className="text-muted">Updated: {formatDate(topic.updated_at)}</small></div>}
          </div>
        </div>

        <div className="card-body pt-4">
          {/* Subtopics */}
          <section className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">Subtopics</h3>
              {children.length > 0 && <span className="badge bg-primary rounded-pill">{children.length}</span>}
            </div>

            {children.length === 0 ? (
              <div className="text-center py-4"><p className="text-muted mb-0">No subtopics available.</p></div>
            ) : (
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {children.map(ch => (
                  <div key={ch.id} className="col">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <Link to={`/topic/${ch.full_path}`} className="text-decoration-none">
                          <h5 className="mb-1 text-primary">{ch.title}</h5>
                        </Link>
                        <p className="text-muted small mb-0">{ch.description || ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Components content */}
          <section>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="h5 mb-0">Content</h3>
              {components.length > 0 && <span className="badge bg-success rounded-pill">{components.length}</span>}
            </div>

            {components.length === 0 ? (
              <div className="text-center py-4"><p className="text-muted mb-0">No content available.</p></div>
            ) : (
              <div className="content">
                {components.map((c, i) => renderComponent(c, i))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Minimal styles for code blocks */}
      <style>{`
        .content pre { margin: 0 0 1rem 0; }
        .content h1, .content h2, .content h3 { margin-top: 1.25rem; margin-bottom: 0.75rem; }
        .content p { margin-bottom: 0.875rem; }
      `}</style>
    </div>
  );
};

export default TopicDetail;
