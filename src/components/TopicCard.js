import React from 'react';
import { useNavigate } from 'react-router-dom';


export default function TopicCard({ t }){
const nav = useNavigate();
return (
<div className="card topic-card h-100 clickable" onClick={() => nav(`/topic/${t.slug}`)}>
<div className="card-body d-flex flex-column">
<h5 className="card-title mb-2">{t.title}</h5>
<p className="card-text text-muted flex-grow-1">{t.description || 'Learn the basics and advanced concepts.'}</p>
<span className="text-primary fw-bold mt-2">Explore →</span>
</div>
</div>
);
}