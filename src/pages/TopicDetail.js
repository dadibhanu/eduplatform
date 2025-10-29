// src/pages/TopicDetail.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";
import ContentEditor from "../components/ContentEditor";
import { useAuth } from "../auth/AuthProvider";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css"; // looks great on both themes

import {
  FaBookOpen,
  FaEdit,
  FaListUl,
  FaPlus,
  FaHome,
  FaTrash,
  FaExclamationTriangle,
} from "react-icons/fa";

/**
 * TopicDetail (BrainLoom)
 * ---------------------------------------------------------------------------
 * Assumptions:
 * - Global Topbar / Footer wrapped at App level (no duplicate headers here).
 * - Global styles come from src/style.css (light/dark + cards, buttons, etc.).
 * - Preserves all original behavior & endpoints.
 *
 * Major Features:
 * - Fetch and display topic with XML content blocks (single page block).
 * - Render custom XML (headings, paragraph, note, example, image, carousel,
 *   gallery, code, code-collection).
 * - Highlight.js syntax highlighting.
 * - Admin actions: Add/Edit XML content, Delete content block, Add subtopic,
 *   Delete topic, Toggle reorder mode and drag/drop subtopics (client-side sort).
 * - Responsive & accessible UI, mobile-first, lazy images.
 * - No header/footer duplication.
 * ---------------------------------------------------------------------------
 */

const TopicDetail = () => {
  // -----------------------------
  // Router / Auth
  // -----------------------------
  const { "*": slugPath } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // -----------------------------
  // State
  // -----------------------------
  const [data, setData] = useState(null);
  const [childrenState, setChildrenState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Content / Modal state
  const [showContentModal, setShowContentModal] = useState(false);
  const [showSubtopicModal, setShowSubtopicModal] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const [existingXml, setExistingXml] = useState("");
  const [blockId, setBlockId] = useState(null);

  // Track active language per <code-collection>
  const [activeTabs, setActiveTabs] = useState({});

  // New subtopic form
  const [newTopic, setNewTopic] = useState({
    title: "",
    slug: "",
    description: "",
    order_no: 0,
  });

  // Render markers
  const contentContainerRef = useRef(null);

  // -----------------------------
  // Fetch Topic + Content
  // -----------------------------
  const fetchTopicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // GET /topics/slug/{slugPath}/
      const res = await api.get(`/topics/slug/${slugPath}/`);
      const payload = res.data;

      setData(payload);
      setChildrenState(payload.children || []);

      const firstBlock = payload.blocks?.[0];
      if (firstBlock) {
        setBlockId(firstBlock.id);
        const xmlBlock = firstBlock.components?.find(
          (c) => c.type === "xml_block"
        );
        setExistingXml(xmlBlock?.xml || "");
      } else {
        setBlockId(null);
        setExistingXml("");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load topic data.");
    } finally {
      setLoading(false);
    }
  }, [slugPath]);

  useEffect(() => {
    fetchTopicData();
  }, [fetchTopicData]);

  // Highlight after XML has been rendered
  useEffect(() => {
    // Give React a tick to commit DOM before highlighting
    const id = requestAnimationFrame(() => hljs.highlightAll());
    return () => cancelAnimationFrame(id);
  }, [existingXml, activeTabs]);

  // -----------------------------
  // Helpers
  // -----------------------------
  const topic = data?.topic;
  const hasContent = Boolean(existingXml);
  const hasSubtopics = childrenState.length > 0;

  const breadcrumbs = useMemo(() => {
    if (!topic?.full_path) return [];
    const pathParts = topic.full_path.split("/");
    return pathParts.map((part, idx) => ({
      name: part.charAt(0).toUpperCase() + part.slice(1),
      path: pathParts.slice(0, idx + 1).join("/"),
    }));
  }, [topic]);

  // -----------------------------
  // XML Renderer
  // -----------------------------
  const renderXML = (xmlString) => {
    if (!xmlString) return <p className="text-muted">No content yet.</p>;

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      // 1) Pull CDATA inside <section>
      let cdata = xmlDoc.querySelector("section")?.textContent || "";

      // 2) Decode entities
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = cdata;
      let decoded = tempDiv.textContent || tempDiv.innerText || "";

      // 3) Strip Quill wrappers
      decoded = decoded
        .replaceAll("<p>", "")
        .replaceAll("</p>", "")
        .replaceAll("<br>", "")
        .trim();

      // 4) Wrap in root to parse
      const wrappedXml = `<root>${decoded}</root>`;
      const innerDoc = new DOMParser().parseFromString(wrappedXml, "text/xml");
      const nodes = Array.from(innerDoc.documentElement.childNodes);

      // Ensure unique base for carousel IDs per render
      const baseId = `crs-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

      const renderNode = (node, index) => {
        if (node.nodeType === 3 && !node.textContent.trim()) return null; // ignore whitespace
        const tag = node.nodeName.toLowerCase();

        switch (tag) {
          // ---------------------------
          // Headings
          // ---------------------------
          case "heading": {
            const level = node.getAttribute("level") || "2";
            const HeadingTag = `h${level}`;
            return (
              <HeadingTag key={index} className="fw-bold mt-3 mb-2">
                {node.textContent}
              </HeadingTag>
            );
          }

          // ---------------------------
          // Paragraph
          // ---------------------------
          case "paragraph":
            return (
              <p key={index} className="text-body fs-6 mb-3">
                {node.textContent}
              </p>
            );

          // ---------------------------
          // Note
          // ---------------------------
          case "note":
            return (
              <div
                key={index}
                className="p-3 my-3 rounded-3"
                style={{
                  background: "rgba(99,102,241,0.10)",
                  borderLeft: "4px solid var(--primary)",
                }}
              >
                💡 {node.textContent}
              </div>
            );

          // ---------------------------
          // Example
          // ---------------------------
          case "example":
            return (
              <div
                key={index}
                className="p-3 my-3 bg-light border-start border-success border-3 rounded-3"
              >
                <h6 className="text-success fw-bold mb-1">
                  {node.getAttribute("title") || "Example"}
                </h6>
                <p className="mb-0">{node.textContent.trim()}</p>
              </div>
            );

          // ---------------------------
          // Single Image (Responsive)
          // ---------------------------
          case "image": {
            const src = node.textContent.trim();
            const alt = node.getAttribute("alt") || "Image";
            const width = node.getAttribute("width"); // optional
            const height = node.getAttribute("height"); // optional

            return (
              <figure key={index} className="my-4 text-center">
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                  className="shadow-sm"
                  style={{
                    width: "100%",
                    height: "auto",
                    maxWidth: "900px",
                    borderRadius: 12,
                    objectFit: "cover",
                    ...(width ? { maxWidth: width } : null),
                    ...(height ? { maxHeight: height, objectFit: "cover" } : null),
                  }}
                />
                {alt && (
                  <figcaption className="text-muted small mt-2">{alt}</figcaption>
                )}
              </figure>
            );
          }

          // ---------------------------
          // Carousel (Responsive)
          // <carousel caption="">
          //   <img alt="">URL</img>
          // </carousel>
          // ---------------------------
          case "carousel": {
            const caption = node.getAttribute("caption") || "";
            const images = Array.from(node.getElementsByTagName("img"));
            const carouselId = `${baseId}-${index}`;

            return (
              <div key={index} className="my-4 text-center">
                {caption && <h6 className="fw-bold mb-3">{caption}</h6>}

                <div className="d-flex align-items-center justify-content-center gap-3">
                  <button
                    className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                    type="button"
                    data-bs-target={`#${carouselId}`}
                    data-bs-slide="prev"
                    aria-label="Previous slide"
                    style={{ width: 40, height: 40, fontSize: "1.1rem" }}
                  >
                    ‹
                  </button>

                  <div
                    id={carouselId}
                    className="carousel slide brainloom-carousel"
                    data-bs-ride="carousel"
                    style={{
                      width: "100%",
                      maxWidth: 900,
                      borderRadius: 14,
                      overflow: "hidden",
                      boxShadow: "0 10px 30px rgba(2,6,23,0.12)",
                    }}
                  >
                    <div className="carousel-indicators">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          data-bs-target={`#${carouselId}`}
                          data-bs-slide-to={i}
                          className={i === 0 ? "active" : ""}
                          aria-current={i === 0 ? "true" : "false"}
                          aria-label={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>

                    <div className="carousel-inner">
                      {images.map((img, i) => {
                        const src = img.textContent.trim();
                        const alt = img.getAttribute("alt") || `Image ${i + 1}`;
                        return (
                          <div
                            key={i}
                            className={`carousel-item ${i === 0 ? "active" : ""}`}
                          >
                            <img
                              src={src}
                              alt={alt}
                              loading="lazy"
                              decoding="async"
                              className="d-block w-100"
                              style={{
                                width: "100%",
                                height: "min(60vh, 420px)",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                    type="button"
                    data-bs-target={`#${carouselId}`}
                    data-bs-slide="next"
                    aria-label="Next slide"
                    style={{ width: 40, height: 40, fontSize: "1.1rem" }}
                  >
                    ›
                  </button>
                </div>
              </div>
            );
          }

          // ---------------------------
          // Gallery (Responsive Grid)
          // ---------------------------
          case "gallery":
            return (
              <div key={index} className="mb-4">
                <h6 className="fw-bold mb-2">{node.getAttribute("caption")}</h6>
                <div className="row g-2">
                  {Array.from(node.getElementsByTagName("img")).map((img, i) => (
                    <div className="col-6 col-md-4" key={i}>
                      <img
                        src={img.textContent.trim()}
                        alt={img.getAttribute("alt") || ""}
                        loading="lazy"
                        decoding="async"
                        className="img-fluid w-100 shadow-sm"
                        style={{
                          aspectRatio: "3 / 2",
                          objectFit: "cover",
                          borderRadius: 12,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );

          // ---------------------------
          // Code (single block)
          // ---------------------------
          case "code": {
            const lang = node.getAttribute("language") || "plaintext";
            const codeText = node.textContent.trim();
            return (
              <pre
                key={index}
                className="code-block"
                style={{
                  borderRadius: 10,
                  overflowX: "auto",
                  whiteSpace: "pre",
                }}
              >
                <code
                  className={`language-${lang}`}
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlightAuto(codeText).value,
                  }}
                />
              </pre>
            );
          }

          // ---------------------------
          // Code-Collection (Tabbed)
          // ---------------------------
          case "code-collection": {
            const title = node.getAttribute("title") || "";
            const snippets = Array.from(node.getElementsByTagName("snippet"));

            const firstLang =
              snippets[0]?.getAttribute("language") || "plaintext";
            const activeLang = activeTabs[index] || firstLang;

            return (
              <div key={index} className="my-4 brainloom-card p-3">
                {title && <h6 className="fw-bold mb-3">{title}</h6>}

                {/* Tabs */}
                <div className="d-flex border-bottom mb-3 flex-wrap gap-2">
                  {snippets.map((snip, i) => {
                    const langName = snip.getAttribute("language") || "plaintext";
                    const active = activeLang === langName;
                    return (
                      <button
                        key={i}
                        className={`btn btn-sm ${
                          active ? "btn-primary text-white" : "btn-outline-secondary"
                        }`}
                        onClick={() =>
                          setActiveTabs((prev) => ({ ...prev, [index]: langName }))
                        }
                      >
                        {langName.toUpperCase()}
                      </button>
                    );
                  })}
                </div>

                {/* Active Code */}
                {snippets.map((snip, i) => {
                  const langName = snip.getAttribute("language") || "plaintext";
                  const codeText = snip.textContent.trim();
                  if (langName !== activeLang) return null;

                  return (
                    <pre key={i} className="code-block">
                      <code
                        className={`language-${langName}`}
                        dangerouslySetInnerHTML={{
                          __html: hljs.highlightAuto(codeText).value,
                        }}
                      />
                    </pre>
                  );
                })}
              </div>
            );
          }

          // ---------------------------
          // Default (render nested)
          // ---------------------------
          default:
            if (node.childNodes.length > 0)
              return (
                <div key={index}>{Array.from(node.childNodes).map(renderNode)}</div>
              );
            return null;
        }
      };

      return (
        <div ref={contentContainerRef} className="rendered-xml">
          {nodes.map((node, i) => renderNode(node, i))}
        </div>
      );
    } catch (err) {
      console.error("XML Render Error:", err);
      return (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <FaExclamationTriangle className="me-2" />
          Error rendering XML content.
        </div>
      );
    }
  };

  // -----------------------------
  // Actions
  // -----------------------------
  const handleSaveContent = async (xmlString) => {
    try {
      const payload = {
        block_type: "page",
        block_order: 0,
        metadata: { tags: ["xml", "content"], estimated_read_time: "5 min" },
        components: [{ type: "xml_block", xml: xmlString }],
      };

      if (blockId)
        await api.put(`/topics/slug/${slugPath}/content/${blockId}`, payload);
      else await api.post(`/topics/slug/${slugPath}/content`, payload);

      await fetchTopicData();
      setShowContentModal(false);
    } catch (err) {
      console.error("Save content failed:", err);
      alert("Failed to save content.");
    }
  };

  const handleDeleteContent = async () => {
    if (!blockId) return alert("No content block found to delete.");
    if (!window.confirm("Delete this content block?")) return;

    try {
      await api.delete(`/content-blocks/${blockId}`);
      alert("🗑️ Content block deleted.");
      setExistingXml("");
      setBlockId(null);
      await fetchTopicData();
    } catch (err) {
      console.error("Delete content failed:", err);
      alert("❌ Failed to delete content block.");
    }
  };

  const handleDeleteTopic = async () => {
    if (!topic) return alert("No topic found.");
    const ok = window.confirm(
      `Delete the topic "${topic.title}"?\n\nThis cannot be undone.`
    );
    if (!ok) return;

    try {
      await api.delete(`/topics/${topic.id}/`);
      alert("🗑️ Topic deleted.");
      navigate("/");
    } catch (err) {
      console.error("Delete topic failed:", err);
      alert("❌ Failed to delete topic.");
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const arr = Array.from(childrenState);
    const [removed] = arr.splice(result.source.index, 1);
    arr.splice(result.destination.index, 0, removed);
    setChildrenState(arr);
  };

  // -----------------------------
  // Render
  // -----------------------------
  if (loading) return <Loader />;
  if (error)
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );

  return (
    <div className="container-xxl px-3 py-4 brainloom-root">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a
              href="/"
              className="text-decoration-none"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
            >
              <FaHome className="me-1" />
              Home
            </a>
          </li>
          {breadcrumbs.map((crumb, i) => (
            <li
              key={i}
              className={`breadcrumb-item ${
                i === breadcrumbs.length - 1 ? "active" : ""
              }`}
              onClick={() =>
                i < breadcrumbs.length - 1 && navigate(`/topic/${crumb.path}`)
              }
              style={{ cursor: i < breadcrumbs.length - 1 ? "pointer" : "default" }}
            >
              {crumb.name}
            </li>
          ))}
        </ol>
      </nav>

      {/* Title row */}
      <div className="d-flex justify-content-between align-items-start flex-wrap mb-3">
        <div className="mb-2 mb-md-0">
          <span className="badge brainloom-lesson-pill mb-2">Topic</span>
          <h1 className="fw-bold m-0">{topic.title}</h1>
          <p className="text-muted mt-1 mb-0">{topic.description}</p>
        </div>

        {isAdmin && (
          <button
            className="btn btn-outline-danger d-flex align-items-center"
            onClick={handleDeleteTopic}
            title="Delete this topic"
          >
            <FaTrash className="me-2" />
            Delete Topic
          </button>
        )}
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className="btn btn-warning" onClick={() => setShowContentModal(true)}>
            <FaEdit className="me-2" />
            {hasContent ? "Edit Content" : "Add Content"}
          </button>

          <button className="btn btn-success" onClick={() => setShowSubtopicModal(true)}>
            <FaPlus className="me-2" />
            Add Subtopic
          </button>

          <button
            className={`btn ${reorderMode ? "btn-secondary" : "btn-dark"}`}
            onClick={() => setReorderMode((p) => !p)}
          >
            <FaListUl className="me-2" />
            {reorderMode ? "Cancel Reorder" : "Reorder Subtopics"}
          </button>

          {hasContent && (
            <button className="btn btn-danger" onClick={handleDeleteContent}>
              <FaTrash className="me-2" />
              Delete Content
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <section className="brainloom-card p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <FaBookOpen className="text-primary" />
          <h4 className="fw-bold mb-0">Content</h4>
        </div>

        {hasContent ? (
          renderXML(existingXml)
        ) : (
          <div className="alert alert-secondary mb-0">
            No content yet. Click <strong>Add Content</strong> to create XML.
          </div>
        )}
      </section>

      {/* Subtopics */}
      {hasSubtopics && (
        <section className="mb-5">
          <h4 className="fw-bold mb-3">Subtopics</h4>

          {reorderMode ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="subtopics">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {childrenState.map((ch, idx) => (
                      <Draggable key={ch.id} draggableId={String(ch.id)} index={idx}>
                        {(providedDr) => (
                          <div
                            ref={providedDr.innerRef}
                            {...providedDr.draggableProps}
                            {...providedDr.dragHandleProps}
                            className="brainloom-card p-3 mb-3"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h5 className="mb-1">{ch.title}</h5>
                                <p className="small text-muted mb-0">{ch.description}</p>
                              </div>
                              <span className="badge bg-secondary">#{idx + 1}</span>
                            </div>
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
                <div
                  key={ch.id}
                  className="col-12 col-md-6 col-lg-4"
                  onClick={() => navigate(`/topic/${ch.full_path}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="brainloom-card h-100 p-3 brainloom-hover">
                    <h5 className="fw-bold">{ch.title}</h5>
                    <p className="small text-muted mb-0">{ch.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Add Subtopic Modal */}
      {showSubtopicModal && (
        <div className="modal fullscreen show d-block" aria-modal="true" role="dialog">
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Add Subtopic</h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowSubtopicModal(false)}
                >
                  Close
                </button>
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label className="form-label">Title</label>
                  <input
                    className="form-control mb-2"
                    placeholder="Title"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Slug</label>
                  <input
                    className="form-control mb-2"
                    placeholder="Slug"
                    value={newTopic.slug}
                    onChange={(e) => setNewTopic({ ...newTopic, slug: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control mb-2"
                    placeholder="Description"
                    rows={3}
                    value={newTopic.description}
                    onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-2 d-grid gap-2 d-md-flex">
                <button
                  className="btn btn-success"
                  onClick={async () => {
                    try {
                      await api.post("/topics/add", {
                        parent_id: topic.id,
                        ...newTopic,
                      });
                      await fetchTopicData();
                      setShowSubtopicModal(false);
                      setNewTopic({
                        title: "",
                        slug: "",
                        description: "",
                        order_no: 0,
                      });
                    } catch (err) {
                      console.error("Add subtopic failed:", err);
                      alert("Failed to add subtopic.");
                    }
                  }}
                >
                  Save
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowSubtopicModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Editor Modal */}
      {showContentModal && (
        <div className="modal fullscreen show d-block" aria-modal="true" role="dialog">
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content">
              <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                <h5 className="mb-0">{hasContent ? "Edit Content" : "Add Content"}</h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowContentModal(false)}
                >
                  Close
                </button>
              </div>

              <ContentEditor
                initialXML={existingXml}
                onSave={handleSaveContent}
                onCancel={() => setShowContentModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicDetail;
