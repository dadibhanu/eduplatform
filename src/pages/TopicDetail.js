import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Loader from '../components/Loader';

export default function TopicDetail(){
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const res = await api.get(`/topics/slug/${slug}/`);
        setData(res.data);
      }catch(err){ console.error(err); }
      finally{ setLoading(false); }
    })();
  },[slug]);

  if(loading) return <Loader />;
  if(!data) return <div className="alert alert-warning">Topic not found</div>;

  const { topic, children, blocks } = data;

  return (
    <div className="card p-3 shadow-sm">
      <div className="d-flex justify-content-between">
        <h4>{topic.title}</h4>
        <div className="text-muted small">Created: {new Date(topic.created_at).toLocaleString()}</div>
      </div>
      <p className="text-muted mb-0">{topic.description || 'No description provided.'}</p>

      <hr />
      <h6>Subtopics</h6>
      {children.length === 0 ? (
        <div className="text-muted">No subtopics yet.</div>
      ) : (
        <div className="row g-2">
          {children.map(c => (
            <div key={c.id} className="col-md-4">
              <div className="card p-2">
                <div className="card-body p-2">
                  <h6>{c.title}</h6>
                  <p className="small text-muted mb-1">{c.description}</p>
                  <a className="btn btn-sm btn-outline-primary" href={`/topic/${c.path}`}>Open</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <hr />
      <h6>Content Blocks</h6>
      {blocks && blocks.length ? blocks.map((b,i)=>(
        <div key={i} className="content-block p-3 mb-2 bg-light rounded">{JSON.stringify(b)}</div>
      )) : <div className="text-muted">No content blocks.</div>}
    </div>
  );
}
