import React from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar({ topics }){
  return (
    <aside className="sidebar p-3 shadow-sm bg-white rounded">
      <h6 className="sidebar-title">Topics</h6>
      <ul className="list-unstyled">
        {topics.map(t => (
          <li key={t.id} className="my-2">
            <Link to={`/topic/${t.slug}`} className="text-decoration-none topic-link">{t.title}</Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}