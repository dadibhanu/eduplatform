// src/pages/Home.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import TopicCard from "../components/TopicCard";
import Loader from "../components/Loader";
import { useAuth } from "../auth/AuthProvider";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Carousel from "react-bootstrap/Carousel";
import "bootstrap/dist/css/bootstrap.min.css";

const Home = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    parent_id: null,
    title: "",
    slug: "",
    order_no: 1,
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/topics/root");
      if (response.data && Array.isArray(response.data.topics)) {
        setTopics(response.data.topics);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Failed to fetch topics:", err);
      setError(err.message || "Failed to load topics. Please try again.");
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleRetry = useCallback(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order_no" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post("/topics/add", formData);
      alert("✅ Topic added successfully!");
      setShowForm(false);
      setFormData({
        parent_id: null,
        title: "",
        slug: "",
        order_no: 1,
        description: "",
      });
      fetchTopics();
    } catch (err) {
      alert("❌ Failed to add topic: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(topics);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setTopics(reordered);
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const body = topics.map((t, index) => ({
        id: t.id,
        order_no: index,
      }));
      await api.post("/topics/reorder", body);
      alert("✅ Reorder saved successfully!");
      setReorderMode(false);
      fetchTopics();
    } catch (err) {
      alert("❌ Failed to save order: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingOrder(false);
    }
  };

  if (loading) return <Loader />;

  if (error)
    return (
      <div className="alert alert-danger text-center">
        {error}{" "}
        <button className="btn btn-sm btn-danger" onClick={handleRetry}>
          Retry
        </button>
      </div>
    );

  return (
    <div className="brainloom-root min-vh-100">
      {/* ===== Hero Carousel ===== */}
      <div className="container-fluid px-0 mb-5">
        <Carousel fade interval={4000} className="brainloom-carousel">
          {[
            {
              img: "https://picsum.photos/1600/500?random=11",
              title: "Learn Anytime",
              text: "Access structured topics and grow your skills at your own pace.",
            },
            {
              img: "https://picsum.photos/1600/500?random=22",
              title: "Interactive Learning",
              text: "Hands-on examples, code practice, and visual understanding.",
            },
            {
              img: "https://picsum.photos/1600/500?random=33",
              title: "Stay Ahead",
              text: "Master new technologies and track your progress easily.",
            },
          ].map((slide, i) => (
            <Carousel.Item key={i}>
              <img
                src={slide.img}
                className="d-block w-100 responsive-img"
                alt={slide.title}
                loading="lazy"
                style={{
                  height: "min(60vh, 450px)",
                  objectFit: "cover",
                  borderBottomLeftRadius: "12px",
                  borderBottomRightRadius: "12px",
                }}
              />
              <Carousel.Caption>
                <h3>{slide.title}</h3>
                <p>{slide.text}</p>
              </Carousel.Caption>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>

      {/* ===== Admin Controls ===== */}
      <div className="container mb-4">
        {isAdmin && (
          <div className="mb-4 d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? "➖ Cancel" : "➕ Add Topic"}
            </button>
            <button
              className={`btn ${reorderMode ? "btn-warning" : "btn-secondary"}`}
              onClick={() => setReorderMode(!reorderMode)}
            >
              {reorderMode ? "❌ Cancel Reorder" : "🔀 Reorder Topics"}
            </button>
            {reorderMode && (
              <button
                className="btn btn-success"
                onClick={handleSaveOrder}
                disabled={savingOrder}
              >
                {savingOrder ? "Saving..." : "💾 Save Changes"}
              </button>
            )}
          </div>
        )}

        {/* ===== Add Topic Form ===== */}
        {isAdmin && showForm && (
          <div className="brainloom-card p-4 shadow-sm mb-4">
            <h5 className="mb-3 fw-bold">Add New Topic</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Parent ID (optional)</label>
                  <input
                    type="text"
                    name="parent_id"
                    className="form-control"
                    value={formData.parent_id || ""}
                    onChange={handleInputChange}
                    placeholder="null for root topic"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    className="form-control"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Order Number</label>
                  <input
                    type="number"
                    name="order_no"
                    className="form-control"
                    value={formData.order_no}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Topic"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== Topics Section ===== */}
        {reorderMode ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="topics" direction="vertical">
              {(provided) => (
                <div
                  className="list-group"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {topics.map((topic, index) => (
                    <Draggable
                      key={topic.id}
                      draggableId={String(topic.id)}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          className="list-group-item mb-2"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            cursor: "grab",
                          }}
                        >
                          <TopicCard t={topic} reorderMode />
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
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {topics.map((topic) => (
              <div key={topic.id} className="col">
                <TopicCard t={topic} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
