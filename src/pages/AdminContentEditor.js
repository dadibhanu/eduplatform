import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";
import api from "../api";

export default function AdminContentEditor() {
  const { token } = useAuth();

  // metadata
  const [tags, setTags] = useState("");
  const [readTime, setReadTime] = useState("");

  // block state
  const [blocks, setBlocks] = useState([]);
  const [preview, setPreview] = useState(null);

  // topic path builder
  const [pathParts, setPathParts] = useState([]); // ["python", "oops", "class-object"]
  const [options, setOptions] = useState([]);     // children fetched from API

  // Load root topics at start
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/topics/root");
        setOptions(res.data.topics); // root level options
      } catch (err) {
        console.error("Failed to fetch root topics:", err);
      }
    })();
  }, []);

  // Fetch children when path changes
  const fetchChildren = async (fullPath) => {
    try {
      const res = await api.get(`/topics/slug/${fullPath}/`);
      setOptions(res.data.children);
    } catch (err) {
      console.error("Failed to fetch children:", err);
      setOptions([]);
    }
  };

  const handleSelectTopic = (slug) => {
    const newPath = [...pathParts, slug];
    setPathParts(newPath);
    fetchChildren(newPath.join("/")); // fetch deeper
  };

  const resetPath = (index) => {
    const newPath = pathParts.slice(0, index + 1);
    setPathParts(newPath);
    fetchChildren(newPath.join("/"));
  };

  // ----------- BLOCK BUILDER -----------
  const addBlock = () => {
    setBlocks([...blocks, { id: Date.now(), type: "", fields: {} }]);
  };

  const updateBlockType = (id, type) => {
    setBlocks(
      blocks.map((b) => (b.id === id ? { ...b, type, fields: {} } : b))
    );
  };

  const updateField = (id, key, value) => {
    setBlocks(
      blocks.map((b) =>
        b.id === id ? { ...b, fields: { ...b.fields, [key]: value } } : b
      )
    );
  };

  const collectBlocks = () =>
    blocks.map((b) => {
      const obj = { type: b.type, ...b.fields };
      if (b.type === "links" && b.fields.items) {
        obj.items = b.fields.items.split("\n").map((line) => {
          const [text, href] = line.split("|");
          return { text: text?.trim(), href: href?.trim() };
        });
      }
      if (b.type === "mcq" && b.fields.options) {
        obj.options = b.fields.options.split("\n").map((opt) => opt.trim());
      }
      if (b.type === "mcq" && b.fields.correct_answers) {
        obj.correct_answers = b.fields.correct_answers
          .split(",")
          .map((i) => parseInt(i));
      }
      return obj;
    });

  const showPreview = () => {
    setPreview(collectBlocks());
  };

  const submitContent = async () => {
    if (pathParts.length === 0) {
      alert("⚠️ Please select a topic path first.");
      return;
    }

    const payload = {
      block_type: "page",
      block_order: 1,
      metadata: {
        tags: tags.split(",").map((t) => t.trim()),
        estimated_read_time: readTime,
      },
      components: collectBlocks(),
    };

    try {
      const fullPath = pathParts.join("/");
      const res = await fetch(
        `http://31.97.202.194/api/topics/slug/${fullPath}/content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      alert("✅ Saved! " + JSON.stringify(data));
    } catch (err) {
      alert("❌ Error: " + err);
    }
  };

  return (
    <div className="container my-4">
      <h2>📘 Content Editor (Admin)</h2>

      {/* Topic Path Selector */}
      <div className="card p-3 mb-3">
        <h5>Choose Topic Path</h5>
        <div className="mb-2">
          Path: {pathParts.length ? pathParts.join(" / ") : "None selected"}
        </div>
        <div className="d-flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              className="btn btn-outline-primary btn-sm"
              onClick={() => handleSelectTopic(opt.slug)}
            >
              {opt.title}
            </button>
          ))}
        </div>

        {pathParts.length > 1 && (
          <div className="mt-2">
            <small>Navigate Back: </small>
            {pathParts.map((p, i) => (
              <button
                key={i}
                className="btn btn-link btn-sm"
                onClick={() => resetPath(i)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="card p-3 mb-3">
        <h5>Metadata</h5>
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <input
          type="text"
          className="form-control"
          placeholder="Estimated Read Time (e.g. 8 min)"
          value={readTime}
          onChange={(e) => setReadTime(e.target.value)}
        />
      </div>

      {/* Blocks */}
      {blocks.map((b) => (
        <div key={b.id} className="card p-3 mb-3">
          <label>Type</label>
          <select
            className="form-select mb-2"
            value={b.type}
            onChange={(e) => updateBlockType(b.id, e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="heading">Heading</option>
            <option value="paragraph">Paragraph</option>
            <option value="code">Code</option>
            <option value="note">Note</option>
            <option value="example">Example</option>
            <option value="practice_link">Practice Link</option>
            <option value="links">References</option>
            <option value="image">Image (Base64)</option>
            <option value="mcq">MCQ</option>
          </select>

          {/* Fields */}
          {b.type === "paragraph" && (
            <textarea
              className="form-control"
              rows="3"
              placeholder="Paragraph text"
              onChange={(e) => updateField(b.id, "text", e.target.value)}
            />
          )}
          {b.type === "heading" && (
            <>
              <input
                className="form-control mb-2"
                placeholder="Heading text"
                onChange={(e) => updateField(b.id, "text", e.target.value)}
              />
              <input
                type="number"
                className="form-control"
                defaultValue="2"
                onChange={(e) => updateField(b.id, "level", e.target.value)}
              />
            </>
          )}
          {/* Add other field renderers here (code, mcq, etc.) */}
        </div>
      ))}

      <button className="btn btn-primary me-2" onClick={addBlock}>
        ➕ Add Block
      </button>
      <button className="btn btn-success me-2" onClick={showPreview}>
        👁 Review
      </button>
      <button className="btn btn-dark" onClick={submitContent}>
        🚀 Submit
      </button>

      {preview && (
        <div className="card p-3 mt-3">
          <h5>Preview JSON</h5>
          <pre>{JSON.stringify(preview, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
