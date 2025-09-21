import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";
import { useAuth } from "../auth/AuthProvider";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ContentEditor from "../components/ContentEditor";
import "highlight.js/styles/github.css";
import hljs from "highlight.js";

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
      return <h2 key={idx}>{block.text}</h2>;
    case "paragraph":
      return (
        <p
          key={idx}
          dangerouslySetInnerHTML={{ __html: block.text || block.content }}
        />
      );
    case "code":
      return (
        <pre key={idx}>
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

  const [showSubtopicModal, setShowSubtopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: "",
    slug: "",
    description: "",
    order_no: 0,
  });

  const [showContentModal, setShowContentModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch topic and content
  const fetchTopicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/topics/slug/${slugPath}/`);
      setData(res.data);
      setChildrenState(res.data.children || []);

      if (Array.isArray(res.data.blocks)) {
        const merged = res.data.blocks.flatMap((b) => b.components || []);
        setComponents(merged);
      } else {
        setComponents(res.data.components || []);
      }
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Topic not found"
          : "Failed to load topic data"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slugPath]);

  useEffect(() => {
    fetchTopicData();
  }, [fetchTopicData]);

  // Highlight code blocks
  useEffect(() => {
    hljs.highlightAll();
  }, [components]);

  // Handle drag and drop reorder
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(childrenState);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setChildrenState(reordered);
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const body = childrenState.map((c, index) => ({
        id: c.id,
        order_no: index,
      }));
      await api.post(`/topics/${data.topic.id}/reorder`, body);
      alert("✅ Reorder saved successfully!");
      setReorderMode(false);
      fetchTopicData();
    } catch (err) {
      alert(
        "❌ Failed to save order: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setSavingOrder(false);
    }
  };

  // Add subtopic
  const handleAddSubtopic = async (e) => {
    e.preventDefault();
    try {
      const payload = { parent_id: data.topic.id, ...newTopic };
      await api.post("/topics/add", payload);
      alert("✅ Subtopic added!");
      setShowSubtopicModal(false);
      setNewTopic({ title: "", slug: "", description: "", order_no: 0 });
      fetchTopicData();
    } catch (err) {
      alert(
        "❌ Failed to add subtopic: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // Add/Edit content
  const handleSaveContent = async (payload) => {
    try {
      await api.post(`/topics/slug/${slugPath}/content`, payload);
      alert(isEditing ? "✅ Content updated!" : "✅ Content added!");
      setShowContentModal(false);
      setIsEditing(false);
      fetchTopicData();
    } catch (err) {
      alert(
        "❌ Failed to save content: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // Breadcrumbs
  const generateBreadcrumbs = () => {
    if (!slugPath) return [];
    const parts = slugPath.split("/").filter(Boolean);
    const crumbs = [{ name: "Home", path: "/" }];
    let cur = "/topic";
    parts.forEach((p, i) => {
      cur += `/${p}`;
      crumbs.push({
        name: p.charAt(0).toUpperCase() + p.slice(1),
        path: cur,
        isLast: i === parts.length - 1,
      });
    });
    return crumbs;
  };

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data || !data.topic)
    return <div className="alert alert-warning">No topic data available.</div>;

  const { topic } = data;
  const breadcrumbs = generateBreadcrumbs();
  const hasSubtopics = childrenState.length > 0;
  const hasContent = components.length > 0;

  return (
    <div className="container-fluid px-4 py-4">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <nav aria-label="breadcrumb" className="mb-4">
          <div className="bg-light p-3 rounded-3 shadow-sm d-flex align-items-center flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <span
                key={i}
                onClick={() => !crumb.isLast && navigate(crumb.path)}
                className={`me-2 ${
                  crumb.isLast ? "fw-bold text-dark" : "text-primary"
                }`}
                style={{ cursor: crumb.isLast ? "default" : "pointer" }}
              >
                {crumb.name}
                {i < breadcrumbs.length - 1 && (
                  <span className="mx-2 text-secondary"> &gt; </span>
                )}
              </span>
            ))}
          </div>
        </nav>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h2 mb-1 text-primary fw-bold">{topic.title}</h1>
            <p className="text-muted mb-0">{topic.description || ""}</p>
          </div>

          {isAdmin && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setIsEditing(hasContent);
                  setShowContentModal(true);
                }}
              >
                {hasContent ? "✏️ Edit Content" : "➕ Add Content"}
              </button>
              <button
                className="btn btn-sm btn-success"
                onClick={() => setShowSubtopicModal(true)}
              >
                ➕ Add Subtopic
              </button>
            </div>
          )}
        </div>

        <div className="card-body pt-4">
          {/* Subtopics */}
          {hasSubtopics && (
            <section className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h5 mb-0">Subtopics</h3>
                {isAdmin && (
                  <div className="d-flex gap-2">
                    <button
                      className={`btn btn-sm ${
                        reorderMode ? "btn-warning" : "btn-secondary"
                      }`}
                      onClick={() => setReorderMode((prev) => !prev)}
                    >
                      {reorderMode ? "❌ Cancel Reorder" : "🔀 Reorder"}
                    </button>
                    {reorderMode && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={handleSaveOrder}
                        disabled={savingOrder}
                      >
                        {savingOrder ? "Saving..." : "💾 Save"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {reorderMode ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="subtopics" direction="vertical">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="list-group"
                      >
                        {childrenState.map((ch, index) => (
                          <Draggable
                            key={ch.id}
                            draggableId={String(ch.id)}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="list-group-item mb-2"
                                style={{
                                  ...provided.draggableProps.style,
                                  cursor: "grab",
                                }}
                              >
                                <h5 className="mb-1 text-primary">{ch.title}</h5>
                                <p className="text-muted small mb-0">
                                  {ch.description || ""}
                                </p>
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
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                  {childrenState.map((ch) => (
                    <div key={ch.id} className="col">
                      <div
                        className="card h-100 border-0 shadow-sm"
                        onClick={() => navigate(`/topic/${ch.full_path}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="card-body">
                          <h5 className="mb-1 text-primary">{ch.title}</h5>
                          <p className="text-muted small mb-0">
                            {ch.description || ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Content */}
          {hasContent && (
            <section>
              <h3 className="h5 mb-3">Content</h3>
              <div className="content">
                {components.map((c, i) => renderComponent(c, i))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Content Editor Modal */}
      {showContentModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-body">
                <ContentEditor
                  initialMetadata={data.topic.metadata || {}}
                  initialHtml={
                    components.find((c) => c.type === "richtext")?.html || ""
                  }
                  onSave={handleSaveContent}
                  onCancel={() => setShowContentModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subtopic Modal */}
      {showSubtopicModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleAddSubtopic}>
                <div className="modal-header">
                  <h5 className="modal-title">➕ Add Subtopic</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowSubtopicModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Title"
                    value={newTopic.title}
                    onChange={(e) =>
                      setNewTopic((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Slug"
                    value={newTopic.slug}
                    onChange={(e) =>
                      setNewTopic((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    required
                  />
                  <textarea
                    className="form-control mb-2"
                    placeholder="Description"
                    rows="3"
                    value={newTopic.description}
                    onChange={(e) =>
                      setNewTopic((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  ></textarea>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Order Number"
                    value={newTopic.order_no}
                    onChange={(e) =>
                      setNewTopic((prev) => ({
                        ...prev,
                        order_no: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowSubtopicModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .content pre {
          background: #0b1220;
          color: #e6edf3;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin-bottom: 1rem;
        }
        .content h1, .content h2, .content h3 {
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .content p { margin-bottom: 0.875rem; }
        .modal { background: rgba(0,0,0,0.5); }
      `}</style>
    </div>
  );
};

export default TopicDetail;
