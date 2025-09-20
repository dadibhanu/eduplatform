import React, { useEffect, useState } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import TopicCard from '../components/TopicCard';
import Loader from '../components/Loader';

export default function Home(){
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const res = await api.get('/topics/root');
        setTopics(res.data.topics);
      }catch(err){ console.error(err); }
      finally{ setLoading(false); }
    })();
  },[]);

  if(loading) return <Loader />;

  return (
    <div className="row gx-4">
      <div className="col-md-3">
        <Sidebar topics={topics} />
      </div>
      <div className="col-md-9">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Explore Topics</h3>
          <div className="text-muted small">{topics.length} topics</div>
        </div>
        <div className="row row-cols-1 row-cols-md-2 g-3">
          {topics.map(t => (
            <div key={t.id} className="col">
              <TopicCard t={t} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}