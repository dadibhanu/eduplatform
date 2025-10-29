import React from "react";
import { useNavigate } from "react-router-dom";

export default function TopicCard({ t }) {
  const nav = useNavigate();

  return (
    <div
      className="card brainloom-card h-100 brainloom-hover clickable"
      onClick={() => nav(`/topic/${t.slug}`)}
    >
      <div className="card-body d-flex flex-column justify-content-between">
        <div>
          <h5 className="fw-bold">{t.title}</h5>
          <p className="text-muted">
            {t.description || "Learn the basics and advanced concepts."}
          </p>
        </div>
        <span className="fw-semibold text-primary">Explore →</span>
      </div>
    </div>
  );
}
