// src/pages/TopicDetail.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";
import { useAuth } from "../auth/AuthProvider";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ContentEditor from "../components/ContentEditor";
import "highlight.js/styles/github.css";
import hljs from "highlight.js";
import { FaBookOpen, FaEdit, FaListUl, FaPlus } from "react-icons/fa";

const renderComponent = (block, idx) => {
  if (!block || typeof block !== "object") return null;

  switch (block.type) {
    case "richtext":
      return (
        <div
          key={idx}
          className="richtext-content"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case "heading":
      return <h2 key={idx} className="fw-bold mt-4 mb-2">{block.text}</h2>;
    case "paragraph":
      return <p key={idx} className="mb-3">{block.text || block.content}</p>;
    case "code":
      return (
        <pre key={idx} className="code-block">
          <code className={`language-${block.language || "plaintext"}`}>
            {block.code || block.text}
          </code>
        </pre>
      );
    default:
      return null;
  }
};

const TopicDetail = () => {
  const { "*": slugPath } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState(null);
  const [childrenState, setChildrenState] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reorderMode, setReorderMode] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const [showContentModal, setShowContentModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [showSubtopicModal, setShowSubtopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: "", slug: "", description: "", order_no: 0 });

  // Fetch topic
  const fetchTopicData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/topics/slug/${slugPath}/`);
      setData(res.data);
      setChildrenState(res.data.children || []);
      setComponents(res.data.blocks?.flatMap((b) => b.components) || res.data.components || []);
    } catch (err) {
      setError("Failed to load topic");
    } finally {
      setLoading(false);
    }
  }, [slugPath]);

  useEffect(() => { fetchTopicData(); }, [fetchTopicData]);

  // Highlight code after render
  useEffect(() => {
    hljs.highlightAll();
  }, [components]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(childrenState);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setChildrenState(reordered);
  };

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data?.topic) return <div>No topic data</div>;

  const { topic } = data;
  const hasSubtopics = childrenState.length > 0;
  const hasContent = components.length > 0;

  return (
    <div className="topic-detail container-fluid px-2 px-md-4 py-3">
      {/* Title */}
      <div className="mb-4 text-center text-md-start">
        <h1 className="fw-bold">{topic.title}</h1>
        <p className="text-muted">{topic.description}</p>
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="d-flex flex-column flex-md-row gap-2 mb-4">
          <button
            className="btn btn-primary flex-fill"
            onClick={() => { setIsEditing(hasContent); setShowContentModal(true); }}
          >
            {hasContent ? <FaEdit className="me-2" /> : <FaPlus className="me-2" />}
            {hasContent ? "Edit Content" : "Add Content"}
          </button>
          <button
            className="btn btn-success flex-fill"
            onClick={() => setShowSubtopicModal(true)}
          >
            <FaPlus className="me-2" /> Add Subtopic
          </button>
          <button
            className={`btn flex-fill ${reorderMode ? "btn-warning" : "btn-secondary"}`}
            onClick={() => setReorderMode((p) => !p)}
          >
            <FaListUl className="me-2" />
            {reorderMode ? "Cancel Reorder" : "Reorder Subtopics"}
          </button>
        </div>
      )}

      {/* Content */}
      {hasContent && (
        <section className="mb-5">
          <h4 className="fw-bold mb-3"><FaBookOpen className="me-2" />Content</h4>
          <div className="content-area">{components.map((c, i) => renderComponent(c, i))}</div>
        </section>
      )}

      {/* Subtopics */}
      {hasSubtopics && (
        <section>
          <h4 className="fw-bold mb-3">Subtopics</h4>
          {reorderMode ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="subtopics" direction="vertical">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {childrenState.map((ch, idx) => (
                      <Draggable key={ch.id} draggableId={String(ch.id)} index={idx}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="subtopic-card mb-3 p-3 bg-light rounded"
                          >
                            <h5>{ch.title}</h5>
                            <p className="small text-muted">{ch.description}</p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="row g-3">
              {childrenState.map((ch) => (
                <div key={ch.id} className="col-12 col-md-6 col-lg-4">
                  <div
                    className="subtopic-card h-100 p-3 bg-white shadow-sm rounded"
                    onClick={() => navigate(`/topic/${ch.full_path}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <h5 className="fw-bold">{ch.title}</h5>
                    <p className="small text-muted">{ch.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Fullscreen Modals */}
      {showContentModal && (
        <div className="modal fullscreen show d-block">
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content">
              <ContentEditor
                initialMetadata={topic.metadata || {}}
                initialHtml={components.find((c) => c.type === "richtext")?.html || ""}
                onSave={(payload) => {
                  api.post(`/topics/slug/${slugPath}/content`, payload).then(fetchTopicData);
                  setShowContentModal(false);
                }}
                onCancel={() => setShowContentModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showSubtopicModal && (
        <div className="modal fullscreen show d-block">
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content p-3">
              <h5>Add Subtopic</h5>
              <input className="form-control mb-2" placeholder="Title"
                value={newTopic.title} onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })} />
              <input className="form-control mb-2" placeholder="Slug"
                value={newTopic.slug} onChange={(e) => setNewTopic({ ...newTopic, slug: e.target.value })} />
              <textarea className="form-control mb-2" placeholder="Description"
                value={newTopic.description} onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}></textarea>
              <button className="btn btn-success w-100"
                onClick={async () => {
                  await api.post("/topics/add", { parent_id: topic.id, ...newTopic });
                  fetchTopicData();
                  setShowSubtopicModal(false);
                }}>
                Save
              </button>
              <button className="btn btn-secondary w-100 mt-2" onClick={() => setShowSubtopicModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .content-area pre,
        .content-area .ql-syntax {
          background: #0b1220;
          color: #e6edf3;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin-bottom: 1rem;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.9rem;
        }
        .content-area h1, .content-area h2, .content-area h3 {
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .content-area p { margin-bottom: 0.875rem; }

        .modal.fullscreen .modal-dialog {
          margin: 0;
          max-width: 100%;
          height: 100%;
        }
        .modal.fullscreen .modal-content {
          border-radius: 0;
          height: 100%;
        }

        @media (max-width: 767px) {
          .topic-detail h1 { font-size: 1.5rem; text-align: center; }
          .btn { font-size: 1.1rem; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default TopicDetail;
