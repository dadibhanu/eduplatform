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
import {
  FaBookOpen,
  FaEdit,
  FaListUl,
  FaPlus,
  FaHome,
  FaTrash,
} from "react-icons/fa";

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
  const [reorderMode, setReorderMode] = useState(false);
  const [existingXml, setExistingXml] = useState("");
  const [blockId, setBlockId] = useState(null);
  const [activeTabs, setActiveTabs] = useState({});
  const [newTopic, setNewTopic] = useState({
    title: "",
    slug: "",
    description: "",
    order_no: 0,
  });

  // ✅ Fetch topic and content
  const fetchTopicData = useCallback(async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    hljs.highlightAll();
  }, [existingXml]);

  // ✅ Delete content handler
  const handleDeleteContent = async () => {
    if (!blockId) {
      alert("No content block found to delete.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this content block?"))
      return;

    try {
      const res = await api.delete(`/content-blocks/${blockId}`);
      console.log("Delete Response:", res.data);
      alert("🗑️ Content block deleted successfully!");
      setExistingXml("");
      setBlockId(null);
      await fetchTopicData();
    } catch (err) {
      console.error("Delete content failed:", err);
      alert("❌ Failed to delete content block.");
    }
  };

  // ✅ Render XML
  const renderXML = (xmlString) => {
    if (!xmlString) return <p className="text-muted">No content yet.</p>;

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      let cdata = xmlDoc.querySelector("section")?.textContent || "";

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = cdata;
      let decoded = tempDiv.textContent || tempDiv.innerText || "";

      decoded = decoded
        .replaceAll("<p>", "")
        .replaceAll("</p>", "")
        .replaceAll("<br>", "")
        .trim();

      const wrappedXml = `<root>${decoded}</root>`;
      const innerDoc = new DOMParser().parseFromString(wrappedXml, "text/xml");
      const nodes = Array.from(innerDoc.documentElement.childNodes);

      // Recursive XML renderer
      const renderNode = (node, index) => {
        if (node.nodeType === 3 && !node.textContent.trim()) return null;
        const tag = node.nodeName.toLowerCase();

        switch (tag) {
          // 🧩 Heading
          case "heading": {
            const level = node.getAttribute("level") || "2";
            const HeadingTag = `h${level}`;
            return (
              <HeadingTag key={index} className="fw-bold mt-3 mb-2">
                {node.textContent}
              </HeadingTag>
            );
          }

          // 🧩 Paragraph
          case "paragraph":
            return <p key={index}>{node.textContent}</p>;

          // 🧩 Note
          case "note":
            return (
              <div key={index} className="alert alert-info">
                💡 {node.textContent}
              </div>
            );

          // 🧩 Image
          case "image": {
            const src = node.textContent.trim();
            const alt = node.getAttribute("alt") || "Image";

            return (
              <figure key={index} className="my-4 text-center">
                <img
                  src={src}
                  alt={alt}
                  className="rounded shadow-sm"
                  style={{
                    width: "650px",
                    height: "350px",
                    objectFit: "cover",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    display: "block",
                    margin: "0 auto",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                  }}
                />
                {alt && (
                  <figcaption className="text-muted small mt-2">{alt}</figcaption>
                )}
              </figure>
            );
          }

          // 🧩 Code Block
          case "code": {
            const lang = node.getAttribute("language") || "plaintext";
            const codeText = node.textContent.trim();
            return (
              <pre key={index} className="code-block">
                <code
                  className={`language-${lang}`}
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlightAuto(codeText).value,
                  }}
                />
              </pre>
            );
          }

          // 🧩 Carousel
          case "carousel": {
            const caption = node.getAttribute("caption") || "";
            const images = Array.from(node.getElementsByTagName("img"));
            const carouselId = `carousel-${index}`;

            return (
              <div key={index} className="carousel-container my-4 text-center">
                {caption && <h6 className="fw-bold mb-3">{caption}</h6>}

                <div className="d-flex align-items-center justify-content-center gap-3">
                  {/* Left Button */}
                  <button
                    className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                    type="button"
                    data-bs-target={`#${carouselId}`}
                    data-bs-slide="prev"
                    style={{
                      width: "45px",
                      height: "45px",
                      fontSize: "1.25rem",
                      flexShrink: 0,
                    }}
                  >
                    ‹
                  </button>

                  {/* Carousel */}
                  <div
                    id={carouselId}
                    className="carousel slide"
                    data-bs-ride="carousel"
                    style={{
                      maxWidth: "650px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div className="carousel-inner">
                      {images.map((img, i) => {
                        const src = img.textContent.trim();
                        const alt = img.getAttribute("alt") || `Image ${i + 1}`;
                        return (
                          <div
                            key={i}
                            className={`carousel-item ${
                              i === 0 ? "active" : ""
                            }`}
                          >
                            <img
                              src={src}
                              className="d-block w-100"
                              alt={alt}
                              style={{
                                width: "100%",
                                height: "350px",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Button */}
                  <button
                    className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                    type="button"
                    data-bs-target={`#${carouselId}`}
                    data-bs-slide="next"
                    style={{
                      width: "45px",
                      height: "45px",
                      fontSize: "1.25rem",
                      flexShrink: 0,
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
            );
          }

          // 🧩 Gallery
          case "gallery":
            return (
              <div key={index} className="gallery mb-4">
                <h6 className="fw-bold mb-2">{node.getAttribute("caption")}</h6>
                <div className="row g-2">
                  {Array.from(node.getElementsByTagName("img")).map(
                    (img, i) => (
                      <div className="col-6 col-md-4" key={i}>
                        <img
                          src={img.textContent.trim()}
                          alt=""
                          className="img-fluid rounded shadow-sm"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            );

          // 🧩 Example
          case "example":
            return (
              <div
                key={index}
                className="border-start border-4 border-success ps-3 mb-3"
              >
                <h6 className="fw-bold text-success">
                  {node.getAttribute("title") || "Example"}
                </h6>
                <p>{node.textContent.trim()}</p>
              </div>
            );

          // 🧩 Code Collection
          case "code-collection": {
            const title = node.getAttribute("title") || "";
            const snippets = Array.from(node.getElementsByTagName("snippet"));
            const firstLang =
              snippets[0]?.getAttribute("language") || "plaintext";
            const activeLang = activeTabs[index] || firstLang;

            return (
              <div key={index} className="my-4 bg-light border rounded p-3">
                {title && <h6 className="fw-bold mb-3">{title}</h6>}

                <div className="d-flex border-bottom mb-3">
                  {snippets.map((snip, i) => {
                    const langName =
                      snip.getAttribute("language") || "plaintext";
                    return (
                      <button
                        key={i}
                        className={`px-3 py-2 border-0 bg-transparent fw-semibold ${
                          activeLang === langName
                            ? "text-primary border-bottom border-primary"
                            : "text-secondary"
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setActiveTabs((prev) => ({
                            ...prev,
                            [index]: langName,
                          }))
                        }
                      >
                        {langName.toUpperCase()}
                      </button>
                    );
                  })}
                </div>

                {snippets.map((snip, i) => {
                  const langName =
                    snip.getAttribute("language") || "plaintext";
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

          default:
            if (node.childNodes.length > 0)
              return (
                <div key={index}>
                  {Array.from(node.childNodes).map(renderNode)}
                </div>
              );
            return null;
        }
      };

      return (
        <div className="rendered-xml bg-white p-3 rounded border shadow-sm">
          {nodes.map((node, i) => renderNode(node, i))}
        </div>
      );
    } catch (err) {
      console.error("XML Render Error:", err);
      return <p className="text-danger">Error rendering XML.</p>;
    }
  };

  // ✅ Save content handler
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

  // ✅ Reorder handler
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const arr = Array.from(childrenState);
    const [removed] = arr.splice(result.source.index, 1);
    arr.splice(result.destination.index, 0, removed);
    setChildrenState(arr);
  };

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  const { topic } = data;
  const hasSubtopics = childrenState.length > 0;
  const hasContent = Boolean(existingXml);

  // 🧭 Breadcrumbs
  const pathParts = topic.full_path.split("/");
  const breadcrumbs = pathParts.map((part, idx) => ({
    name: part.charAt(0).toUpperCase() + part.slice(1),
    path: pathParts.slice(0, idx + 1).join("/"),
  }));

  return (
    <div className="topic-detail container-fluid px-2 px-md-4 py-3">
      {/* 🧭 Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/" className="text-decoration-none text-primary">
              <FaHome className="me-1" /> Home
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
              style={{
                cursor: i < breadcrumbs.length - 1 ? "pointer" : "default",
              }}
            >
              {crumb.name}
            </li>
          ))}
        </ol>
      </nav>

      {/* 🏷 Title */}
      <div className="mb-4 text-center text-md-start">
        <h1 className="fw-bold">{topic.title}</h1>
        <p className="text-muted">{topic.description}</p>
      </div>

      {/* 🧰 Admin Controls */}
      {isAdmin && (
        <div className="d-flex flex-column flex-md-row flex-wrap gap-2 mb-4">
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

          {hasContent && (
            <button
              className="btn btn-danger flex-fill"
              onClick={handleDeleteContent}
            >
              <FaTrash className="me-2" /> Delete Content
            </button>
          )}

          <button
            className="btn btn-success flex-fill"
            onClick={() => setShowSubtopicModal(true)}
          >
            <FaPlus className="me-2" /> Add Subtopic
          </button>

          <button
            className={`btn flex-fill ${
              reorderMode ? "btn-warning" : "btn-secondary"
            }`}
            onClick={() => setReorderMode((p) => !p)}
          >
            <FaListUl className="me-2" />{" "}
            {reorderMode ? "Cancel Reorder" : "Reorder Subtopics"}
          </button>
        </div>
      )}

      {/* 🧠 Content */}
      <section className="mb-5">
        <h4 className="fw-bold mb-3">
          <FaBookOpen className="me-2" /> Content
        </h4>
        {hasContent ? (
          renderXML(existingXml)
        ) : (
          <div className="alert alert-secondary">
            No content yet. Click <strong>Add Content</strong> to create XML.
          </div>
        )}
      </section>

      {/* 🧩 Subtopics */}
      {hasSubtopics && (
        <section>
          <h4 className="fw-bold mb-3">Subtopics</h4>
          {reorderMode ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="subtopics">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {childrenState.map((ch, idx) => (
                      <Draggable
                        key={ch.id}
                        draggableId={String(ch.id)}
                        index={idx}
                      >
                        {(providedDr) => (
                          <div
                            ref={providedDr.innerRef}
                            {...providedDr.draggableProps}
                            {...providedDr.dragHandleProps}
                            className="subtopic-card mb-3 p-3 bg-light rounded border"
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
                <div
                  key={ch.id}
                  className="col-12 col-md-6 col-lg-4"
                  onClick={() => navigate(`/topic/${ch.full_path}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="subtopic-card h-100 p-3 bg-white shadow-sm rounded">
                    <h5 className="fw-bold">{ch.title}</h5>
                    <p className="small text-muted">{ch.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 🧾 Add Subtopic Modal */}
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

      {/* 🧾 Content Modal */}
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

      <style>{`
        .breadcrumb { background: transparent; padding: 0; margin-bottom: 1rem; }
        .breadcrumb-item.active { font-weight: bold; color: #000; }
        .code-block {
          background: #0b1220;
          color: #e6edf3;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          font-family: "JetBrains Mono", monospace;
        }
      `}</style>
    </div>
  );
};

export default TopicDetail;
