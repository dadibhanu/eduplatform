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

const TopicDetail = () => {
  const { "*": slugPath } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState(null);
  const [childrenState, setChildrenState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showSubtopicModal, setShowSubtopicModal] = useState(false);
  const [existingXml, setExistingXml] = useState("");
  const [blockId, setBlockId] = useState(null);
  const [newTopic, setNewTopic] = useState({
    title: "",
    slug: "",
    description: "",
    order_no: 0,
  });

  const fetchTopicData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/topics/slug/${slugPath}/`);
      const payload = res.data;
      setData(payload);
      setChildrenState(payload.children || []);

      const firstBlock = payload.blocks?.[0] || null;
      if (firstBlock) {
        setBlockId(firstBlock.id || null);
        const xmlComp =
          (firstBlock.components || []).find((c) => c?.type === "xml_block") || null;
        setExistingXml(xmlComp?.xml || "");
      } else {
        setBlockId(null);
        setExistingXml("");
      }
    } catch (err) {
      console.error("Failed to fetch topic:", err);
      setError("Failed to load topic.");
    } finally {
      setLoading(false);
    }
  }, [slugPath]);

  useEffect(() => {
    fetchTopicData();
  }, [fetchTopicData]);

  useEffect(() => {
    hljs.highlightAll();
  }, [existingXml]);

  const renderXML = (xmlString) => {
    if (!xmlString) return <p className="text-muted">No content yet.</p>;
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      const section = xmlDoc.querySelector("section");
      const inner = section?.textContent ?? "";
      return (
        <div
          className="rendered-xml bg-white p-3 rounded border"
          dangerouslySetInnerHTML={{ __html: inner }}
        />
      );
    } catch (err) {
      console.error("XML parse/render error:", err);
      return <p className="text-danger">Error rendering XML content.</p>;
    }
  };

  const handleSaveContent = async (xmlString) => {
    try {
      const payload = {
        block_type: "page",
        block_order: 0,
        metadata: {
          tags: ["xml", "custom-block", "content"],
          estimated_read_time: "5 min",
        },
        components: [
          {
            type: "xml_block",
            xml: xmlString,
          },
        ],
      };

      if (blockId) {
        await api.put(`/topics/slug/${slugPath}/content/${blockId}`, payload);
      } else {
        await api.post(`/topics/slug/${slugPath}/content`, payload);
      }

      await fetchTopicData();
      setShowContentModal(false);
    } catch (err) {
      console.error("Save content failed:", err);
      alert("Failed to save content.");
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const arr = Array.from(childrenState);
    const [removed] = arr.splice(result.source.index, 1);
    arr.splice(result.destination.index, 0, removed);
    setChildrenState(arr);
  };

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data?.topic) return <div>No topic data found.</div>;

  const { topic } = data;
  const hasSubtopics = childrenState.length > 0;
  const hasContent = Boolean(existingXml);

  return (
    <div className="topic-detail container-fluid px-2 px-md-4 py-3">
      <div className="mb-4 text-center text-md-start">
        <h1 className="fw-bold">{topic.title}</h1>
        <p className="text-muted">{topic.description}</p>
      </div>

      {isAdmin && (
        <div className="d-flex flex-column flex-md-row gap-2 mb-4">
          <button
            className="btn btn-primary flex-fill"
            onClick={() => setShowContentModal(true)}
          >
            {hasContent ? (
              <>
                <FaEdit className="me-2" /> Edit Content
              </>
            ) : (
              <>
                <FaPlus className="me-2" /> Add Content
              </>
            )}
          </button>

          <button
            className="btn btn-success flex-fill"
            onClick={() => setShowSubtopicModal(true)}
          >
            <FaPlus className="me-2" /> Add Subtopic
          </button>

          <button
            className="btn btn-secondary flex-fill"
            onClick={() => alert("Reorder feature active!")}
          >
            <FaListUl className="me-2" /> Reorder Subtopics
          </button>
        </div>
      )}

      <section className="mb-5">
        <h4 className="fw-bold mb-3">
          <FaBookOpen className="me-2" /> Content
        </h4>
        {hasContent ? (
          renderXML(existingXml)
        ) : (
          <div className="alert alert-secondary">
            No content added yet. Click <strong>Add Content</strong> to create it.
          </div>
        )}
      </section>

      {hasSubtopics && (
        <section>
          <h4 className="fw-bold mb-3">Subtopics</h4>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="subtopics" direction="vertical">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {childrenState.map((ch, idx) => (
                    <Draggable key={ch.id} draggableId={String(ch.id)} index={idx}>
                      {(providedDr) => (
                        <div
                          ref={providedDr.innerRef}
                          {...providedDr.draggableProps}
                          {...providedDr.dragHandleProps}
                          className="subtopic-card mb-3 p-3 bg-white shadow-sm rounded"
                          onClick={() => navigate(`/topic/${ch.full_path}`)}
                          style={{ cursor: "pointer" }}
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
        </section>
      )}

      {showContentModal && (
        <div className="modal fullscreen show d-block">
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content">
              <ContentEditor
                initialXML={existingXml}
                onSave={handleSaveContent}
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
              />
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
