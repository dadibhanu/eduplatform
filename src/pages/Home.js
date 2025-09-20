import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import TopicCard from "../components/TopicCard";
import Loader from "../components/Loader";
import { useAuth } from "../auth/AuthProvider";

const Home = () => {
  // Auth
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // State management
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Topic form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    parent_id: null,
    title: "",
    slug: "",
    order_no: 1,
    description: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch topics
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

  // Retry handler
  const handleRetry = useCallback(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order_no" ? parseInt(value) : value
    }));
  };

  // Submit new topic
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
        description: ""
      });
      fetchTopics();
    } catch (err) {
      alert(
        "❌ Failed to add topic: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) return <Loader />;

  // Error
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
    <div className="container-fluid px-4 py-4">
      {/* Admin Add Topic Button */}
      {isAdmin && (
        <div className="mb-4">
          <button
            className="btn btn-primary"
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? "➖ Cancel" : "➕ Add Topic"}
          </button>
        </div>
      )}

      {/* Add Topic Form (visible only to admin) */}
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
            <button
              type="submit"
              className="btn btn-success"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Topic"}
            </button>
          </form>
        </div>
      )}

      {/* Topic Grid */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
        {topics.map((topic) => (
          <div key={topic.id} className="col">
            <TopicCard t={topic} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
