import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import TopicCard from "../components/TopicCard";
import Loader from "../components/Loader";
import { useAuth } from "../auth/AuthProvider";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Carousel from "react-bootstrap/Carousel";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

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
    <div className="container-fluid px-0">
      {/* ===== Banner / Carousel ===== */}
      <Carousel fade interval={3000} className="mb-5 shadow-sm">
        <Carousel.Item>
          <img
            className="d-block w-100 rounded"
            src="https://picsum.photos/1200/400?random=1"
            alt="First slide"
          />
          <Carousel.Caption>
            <h3>Learn Anytime</h3>
            <p>Access topics and resources at your convenience.</p>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100 rounded"
            src="https://picsum.photos/1200/400?random=2"
            alt="Second slide"
          />
          <Carousel.Caption>
            <h3>Engaging Content</h3>
            <p>Rich text, examples, and practice materials.</p>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100 rounded"
            src="https://picsum.photos/1200/400?random=3"
            alt="Third slide"
          />
          <Carousel.Caption>
            <h3>Stay Ahead</h3>
            <p>Track progress and keep learning every day.</p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>

      {/* ===== Admin Buttons ===== */}
      <div className="px-4">
        {isAdmin && (
          <div className="mb-4 d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setShowForm((prev) => !prev)}
            >
              {showForm ? "➖ Cancel" : "➕ Add Topic"}
            </button>
            <button
              className={`btn ${reorderMode ? "btn-warning" : "btn-secondary"}`}
              onClick={() => setReorderMode((prev) => !prev)}
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

        {/* Add Topic Form */}
        {isAdmin && showForm && (
          <div className="card p-4 shadow-sm mb-4">
            <h5 className="mb-3">Add New Topic</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
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
              <div className="mb-3">
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
              <div className="mb-3">
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
              <div className="mb-3">
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
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <button type="submit" className="btn btn-success" disabled={submitting}>
                {submitting ? "Saving..." : "Save Topic"}
              </button>
            </form>
          </div>
        )}

        {/* Topic Grid or Reorder Mode */}
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

      {/* ===== Footer ===== */}
      <footer className="footer bg-dark text-light pt-5 pb-4 mt-5">
        <div className="container">
          <div className="row gy-4">
            {/* Company Info */}
            <div className="col-md-4">
              <h5 className="fw-bold mb-3">EduPlatform Pvt Ltd</h5>
              <p className="text-muted small">
                Empowering learners with structured topics, coding practice, and real-world skills.
              </p>
              <p className="mb-1">
                <FaMapMarkerAlt className="me-2" />
                <a
                  href="https://maps.google.com/?q=Hyderabad+India"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none text-light"
                >
                  Hyderabad, India
                </a>
              </p>
              <p className="mb-1">
                <FaPhoneAlt className="me-2" />
                <a href="tel:+919876543210" className="text-decoration-none text-light">
                  +91 98765 43210
                </a>
              </p>
              <p>
                <FaEnvelope className="me-2" />
                <a
                  href="mailto:support@eduplatform.com"
                  className="text-decoration-none text-light"
                >
                  support@eduplatform.com
                </a>
              </p>
            </div>

            {/* Quick Links */}
            <div className="col-md-2">
              <h6 className="fw-bold mb-3">Quick Links</h6>
              <ul className="list-unstyled small">
                <li>
                  <a href="/" className="text-decoration-none text-light">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-decoration-none text-light">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/courses" className="text-decoration-none text-light">
                    Courses
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-decoration-none text-light">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="col-md-2">
              <h6 className="fw-bold mb-3">Resources</h6>
              <ul className="list-unstyled small">
                <li>
                  <a href="/blog" className="text-decoration-none text-light">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-decoration-none text-light">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="/support" className="text-decoration-none text-light">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Socials */}
            <div className="col-md-4">
              <h6 className="fw-bold mb-3">Follow Us</h6>
              <div className="d-flex gap-3 fs-5">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-light">
                  <FaFacebookF />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-light">
                  <FaTwitter />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-light">
                  <FaLinkedinIn />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-light">
                  <FaInstagram />
                </a>
              </div>
              <form className="mt-3">
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="Subscribe to newsletter"
                    className="form-control"
                  />
                  <button className="btn btn-primary">Subscribe</button>
                </div>
              </form>
            </div>
          </div>

          <hr className="mt-4 mb-3 border-secondary" />
          <div className="text-center small text-muted">
            © {new Date().getFullYear()} EduPlatform Pvt Ltd. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
