// src/pages/TopicDetail.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";
import { useAuth } from "../auth/AuthProvider";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ContentEditor from "../components/ContentEditor";
import { FaBookOpen, FaEdit, FaListUl, FaPlus, FaCode } from "react-icons/fa";

const TopicDetail = () => {
  const { "*": slugPath } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState(null);
  const [childrenState, setChildrenState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reorderMode, setReorderMode] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showSubtopicModal, setShowSubtopicModal] = useState(false);
  const [showJson, setShowJson] = useState(true); // ✅ toggle between raw JSON and rendered XML

  const [newTopic, setNewTopic] = useState({
    title: "",
    slug: "",
    description: "",
    order_no: 0,
  });

  // Fetch Topic Data
  const fetchTopicData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/topics/slug/${slugPath}/`);
      setData(res.data);
      setChildrenState(res.data.children || []);
    } catch (err) {
      console.error("Failed to load topic:", err);
      setError("Failed to load topic");
    } finally {
      setLoading(false);
    }
  }, [slugPath]);

  useEffect(() => {
    fetchTopicData();
  }, [fetchTopicData]);

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data?.topic) return <div>No topic data found</div>;

  const { topic } = data;
  const hasSubtopics = childrenState.length > 0;
  const xmlContent =
    data?.blocks?.[0]?.components?.[0]?.xml || "<content>No XML found</content>";

  // ✅ Parse XML → HTML
  const renderXML = (xmlString) => {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlString, "text/xml");
      const content = xml.getElementsByTagName("content")[0];
      if (!content) return <p>No valid content found</p>;

      const cdataNode = content.querySelector("section");
      const cdataText = cdataNode?.textContent || "";

      return (
        <div
          className="rendered-xml p-3 bg-white border rounded"
          dangerouslySetInnerHTML={{ __html: cdataText }}
        />
      );
    } catch (e) {
      return <p>Error parsing XML.</p>;
    }
  };

  // Handle subtopic reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(childrenState);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setChildrenState(reordered);
  };

  return (
    <div className="topic-detail container-fluid px-2 px-md-4 py-3">
      {/* Title */}
      <div className="mb-4 text-center text-md-start">
        <h1 className="fw-bold">{topic.title}</h1>
        <p className="text-muted">{topic.description}</p>
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="d-flex flex-column flex-md-row gap-2 mb-4">
          <button
            className="btn btn-primary flex-fill"
            onClick={() => setShowContentModal(true)}
          >
            <FaEdit className="me-2" />
            Edit/Add Content
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

          <button
            className="btn btn-info flex-fill"
            onClick={() => setShowJson((p) => !p)}
          >
            <FaCode className="me-2" />
            {showJson ? "Show Rendered XML" : "Show Raw JSON"}
          </button>
        </div>
      )}

      {/* JSON or XML Content */}
      <section className="mb-5">
        <h4 className="fw-bold mb-3">
          <FaBookOpen className="me-2" />
          {showJson ? "Full API Response" : "Rendered XML"}
        </h4>

        {showJson ? (
          <div
            className="json-viewer bg-dark text-light p-3 rounded"
            style={{
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: "75vh",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.9rem",
            }}
          >
            {JSON.stringify(data, null, 2)}
          </div>
        ) : (
          renderXML(xmlContent)
        )}
      </section>

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

      {/* Modals */}
      {showContentModal && (
        <div className="modal fullscreen show d-block">
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content">
              <ContentEditor
                initialMetadata={topic.metadata || {}}
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
              <input
                className="form-control mb-2"
                placeholder="Title"
                value={newTopic.title}
                onChange={(e) =>
                  setNewTopic({ ...newTopic, title: e.target.value })
                }
              />
              <input
                className="form-control mb-2"
                placeholder="Slug"
                value={newTopic.slug}
                onChange={(e) =>
                  setNewTopic({ ...newTopic, slug: e.target.value })
                }
              />
              <textarea
                className="form-control mb-2"
                placeholder="Description"
                value={newTopic.description}
                onChange={(e) =>
                  setNewTopic({ ...newTopic, description: e.target.value })
                }
              ></textarea>
              <button
                className="btn btn-success w-100"
                onClick={async () => {
                  await api.post("/topics/add", {
                    parent_id: topic.id,
                    ...newTopic,
                  });
                  fetchTopicData();
                  setShowSubtopicModal(false);
                }}
              >
                Save
              </button>
              <button
                className="btn btn-secondary w-100 mt-2"
                onClick={() => setShowSubtopicModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicDetail;
