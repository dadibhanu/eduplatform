import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";
import { useAuth } from "../auth/AuthProvider";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const extractComponents = (data) => {
  if (!data) return [];
  if (Array.isArray(data.components) && data.components.length) return data.components;
  if (Array.isArray(data.blocks) && data.blocks.length) {
    for (const b of data.blocks) {
      if (b && Array.isArray(b.components) && b.components.length) return b.components;
    }
    if (data.blocks.every((b) => typeof b === "object" && b.type)) return data.blocks;
  }
  return [];
};

const renderComponent = (block, idx) => {
  if (!block || typeof block !== "object") return null;
  switch (block.type) {
    case "heading": return <h2 key={idx}>{block.text}</h2>;
    case "paragraph": return <p key={idx}>{block.text || block.content}</p>;
    case "code":
      return (
        <pre key={idx} className="p-3 rounded bg-dark text-light">
          <code>{block.code}</code>
        </pre>
      );
    case "note":
      return <div key={idx} className="alert alert-info">{block.content}</div>;
    default:
      return block.text ? <p key={idx}>{block.text}</p> : null;
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

  // Reorder state
  const [reorderMode, setReorderMode] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Add subtopic modal
  const [showModal, setShowModal] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: "", slug: "", description: "", order_no: 0 });

  // Add content modal
  const [showContentModal, setShowContentModal] = useState(false);
  const [metadata, setMetadata] = useState({ tags: "", estimated_read_time: "" });
  const [blocks, setBlocks] = useState([]);

  const fetchTopicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/topics/slug/${slugPath}/`);
      setData(res.data);
      setChildrenState(res.data.children || []);
      setComponents(extractComponents(res.data));
    } catch (err) {
      setError(err.response?.status === 404 ? "Topic not found" : "Failed to load topic data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slugPath]);

  useEffect(() => { fetchTopicData(); }, [fetchTopicData]);

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
      const body = childrenState.map((c, index) => ({ id: c.id, order_no: index }));
      await api.post(`/topics/${data.topic.id}/reorder`, body);
      alert("✅ Reorder saved successfully!");
      setReorderMode(false);
      fetchTopicData();
    } catch (err) {
      alert("❌ Failed to save order: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingOrder(false);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    try {
      const payload = { parent_id: data.topic.id, ...newTopic };
      await api.post("/topics/add", payload);
      alert("✅ Subtopic added!");
      setShowModal(false);
      setNewTopic({ title: "", slug: "", description: "", order_no: 0 });
      fetchTopicData();
    } catch (err) {
      alert("❌ Failed to add subtopic: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddBlock = () => {
    setBlocks([...blocks, { type: "paragraph", text: "" }]);
  };

  const handleBlockChange = (i, field, value) => {
    const updated = [...blocks];
    updated[i][field] = value;
    setBlocks(updated);
  };

  const handleSubmitContent = async () => {
    try {
      const payload = {
        block_type: "page",
        block_order: 1,
        metadata: {
          tags: metadata.tags.split(",").map((t) => t.trim()),
          estimated_read_time: metadata.estimated_read_time,
        },
        components: blocks,
      };
      await api.post(`/topics/slug/${slugPath}/content`, payload);
      alert("✅ Content added successfully!");
      setShowContentModal(false);
      setMetadata({ tags: "", estimated_read_time: "" });
      setBlocks([]);
      fetchTopicData();
    } catch (err) {
      alert("❌ Failed to add content: " + (err.response?.data?.message || err.message));
    }
  };

  const generateBreadcrumbs = () => {
    if (!slugPath) return [];
    const parts = slugPath.split("/").filter(Boolean);
    const crumbs = [{ name: "Home", path: "/" }];
    let cur = "/topic";
    parts.forEach((p, i) => {
      cur += `/${p}`;
      crumbs.push({ name: p.charAt(0).toUpperCase() + p.slice(1), path: cur, isLast: i === parts.length - 1 });
    });
    return crumbs;
  };

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data || !data.topic) return <div className="alert alert-warning">No topic data available.</div>;

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
                className={`me-2 ${crumb.isLast ? "fw-bold text-dark" : "text-primary"}`}
                style={{ cursor: crumb.isLast ? "default" : "pointer" }}
              >
                {crumb.name}
                {i < breadcrumbs.length - 1 && <span className="mx-2 text-secondary"> &gt; </span>}
              </span>
            ))}
          </div>
        </nav>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 pb-0">
          <h1 className="h2 mb-1 text-primary fw-bold">{topic.title}</h1>
          <p className="text-muted mb-0">{topic.description || ""}</p>
        </div>

        <div className="card-body pt-4">
          {/* Subtopics */}
          {hasSubtopics && !hasContent && (
            <section className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h5 mb-0">Subtopics</h3>
                {isAdmin && (
                  <div className="d-flex gap-2">
                    <button
                      className={`btn btn-sm ${reorderMode ? "btn-warning" : "btn-secondary"}`}
                      onClick={() => setReorderMode((prev) => !prev)}
                    >
                      {reorderMode ? "❌ Cancel Reorder" : "🔀 Reorder"}
                    </button>
                    {reorderMode && (
                      <button className="btn btn-sm btn-success" onClick={handleSaveOrder} disabled={savingOrder}>
                        {savingOrder ? "Saving..." : "💾 Save"}
                      </button>
                    )}
                    <button className="btn btn-sm btn-primary" onClick={() => setShowModal(true)}>
                      ➕ Add Subtopic
                    </button>
                  </div>
                )}
              </div>

              {reorderMode ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="subtopics" direction="vertical">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="list-group">
                        {childrenState.map((ch, index) => (
                          <Draggable key={ch.id} draggableId={String(ch.id)} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="list-group-item mb-2"
                                style={{ ...provided.draggableProps.style, cursor: "grab" }}
                              >
                                <h5 className="mb-1 text-primary">{ch.title}</h5>
                                <p className="text-muted small mb-0">{ch.description || ""}</p>
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
                          <p className="text-muted small mb-0">{ch.description || ""}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Content */}
          {hasContent && !hasSubtopics && (
            <section>
              <h3 className="h5 mb-3">Content</h3>
              <div className="content">{components.map((c, i) => renderComponent(c, i))}</div>
            </section>
          )}

          {/* No content & no subtopics */}
          {!hasContent && !hasSubtopics && isAdmin && (
            <div className="text-center py-5">
              <p className="text-muted mb-3">No content available for this topic.</p>
              <button className="btn btn-success" onClick={() => setShowContentModal(true)}>
                ➕ Add Content
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Content Modal */}
      {showContentModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">➕ Add Content</h5>
                <button type="button" className="btn-close" onClick={() => setShowContentModal(false)}></button>
              </div>
              <div className="modal-body">
                <h6>Metadata</h6>
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Tags (comma separated)"
                  value={metadata.tags}
                  onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                />
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Estimated read time"
                  value={metadata.estimated_read_time}
                  onChange={(e) => setMetadata({ ...metadata, estimated_read_time: e.target.value })}
                />

                <h6>Blocks</h6>
                {blocks.map((b, i) => (
                  <div key={i} className="border p-2 rounded mb-2">
                    <select
                      className="form-select mb-2"
                      value={b.type}
                      onChange={(e) => handleBlockChange(i, "type", e.target.value)}
                    >
                      <option value="heading">Heading</option>
                      <option value="paragraph">Paragraph</option>
                      <option value="code">Code</option>
                      <option value="note">Note</option>
                    </select>
                    {b.type === "heading" && (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Heading text"
                        value={b.text}
                        onChange={(e) => handleBlockChange(i, "text", e.target.value)}
                      />
                    )}
                    {b.type === "paragraph" && (
                      <textarea
                        className="form-control"
                        placeholder="Paragraph text"
                        value={b.text}
                        onChange={(e) => handleBlockChange(i, "text", e.target.value)}
                      />
                    )}
                    {b.type === "code" && (
                      <textarea
                        className="form-control"
                        placeholder="Code"
                        value={b.code}
                        onChange={(e) => handleBlockChange(i, "code", e.target.value)}
                      />
                    )}
                    {b.type === "note" && (
                      <textarea
                        className="form-control"
                        placeholder="Note content"
                        value={b.content}
                        onChange={(e) => handleBlockChange(i, "content", e.target.value)}
                      />
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-outline-primary" onClick={handleAddBlock}>
                  ➕ Add Block
                </button>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowContentModal(false)}>Cancel</button>
                <button className="btn btn-success" onClick={handleSubmitContent}>Save Content</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subtopic Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleAddTopic}>
                <div className="modal-header">
                  <h5 className="modal-title">➕ Add Subtopic</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Title"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Slug"
                    value={newTopic.slug}
                    onChange={(e) => setNewTopic((prev) => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                  <textarea
                    className="form-control mb-2"
                    placeholder="Description"
                    rows="3"
                    value={newTopic.description}
                    onChange={(e) => setNewTopic((prev) => ({ ...prev, description: e.target.value }))}
                  ></textarea>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Order Number"
                    value={newTopic.order_no}
                    onChange={(e) => setNewTopic((prev) => ({ ...prev, order_no: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .content pre { margin: 0 0 1rem 0; }
        .content h1, .content h2, .content h3 { margin-top: 1.25rem; margin-bottom: 0.75rem; }
        .content p { margin-bottom: 0.875rem; }
        .modal { background: rgba(0,0,0,0.5); }
      `}</style>
    </div>
  );
};

export default TopicDetail;
