import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";
import api from "../api";
import RenderXMLContent from "../components/RenderXMLContent"; // 🟢 Import Renderer

export default function AdminContentEditor({ topicPath }) {
  const { token } = useAuth();
  const [tags, setTags] = useState("");
  const [readTime, setReadTime] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [xmlPreview, setXmlPreview] = useState("");
  const [topic, setTopic] = useState(null);

  // 🟢 Fetch topic info
  useEffect(() => {
    if (!topicPath) return;
    (async () => {
      try {
        const res = await api.get(`/topics/slug/${topicPath}`);
        setTopic(res.data.topic);
      } catch (err) {
        console.error("❌ Failed to fetch topic:", err);
      }
    })();
  }, [topicPath]);

  // ➕ Add block
  const addBlock = () =>
    setBlocks([...blocks, { id: Date.now(), type: "", fields: {} }]);

  // 🔁 Change block type
  const updateBlockType = (id, type) =>
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, type, fields: {} } : b)));

  // ✏️ Update field
  const updateField = (id, key, value) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, fields: { ...b.fields, [key]: value } } : b
      )
    );

  // ➕ Add carousel image
  const addCarouselImage = (id) =>
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const images = [...(b.fields.images || []), ""];
          return { ...b, fields: { ...b.fields, images } };
        }
        return b;
      })
    );

  // ➕ Add snippet
  const addSnippet = (id) =>
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const snippets = [
            ...(b.fields.snippets || []),
            { language: "", code: "" },
          ];
          return { ...b, fields: { ...b.fields, snippets } };
        }
        return b;
      })
    );

  // 🧠 Generate XML
  const generateXML = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<content>\n`;
    xml += `  <metadata>\n    <tags>${tags}</tags>\n    <readTime>${readTime}</readTime>\n  </metadata>\n`;

    blocks.forEach((b) => {
      const f = b.fields;
      switch (b.type) {
        case "heading":
          xml += `  <heading level="${f.level || 2}">${f.text || ""}</heading>\n`;
          break;
        case "paragraph":
          xml += `  <paragraph>${f.text || ""}</paragraph>\n`;
          break;
        case "code":
          xml += `  <code language="${f.language || "plaintext"}"><![CDATA[${f.code || ""}]]></code>\n`;
          break;
        case "example":
          xml += `  <example title="${f.title || ""}">${f.content || ""}</example>\n`;
          break;
        case "image":
          xml += `  <image alt="${f.alt || ""}">${f.src || ""}</image>\n`;
          break;
        case "carousel":
          xml += `  <carousel caption="${f.caption || ""}">\n`;
          (f.images || []).forEach(
            (img) =>
              (xml += `    <image alt="${f.alt || ""}">${img}</image>\n`)
          );
          xml += `  </carousel>\n`;
          break;
        case "code-collection":
          xml += `  <code-collection title="${f.title || "Code Collection"}">\n`;
          (f.snippets || []).forEach(
            (s) =>
              (xml += `    <snippet language="${s.language || "plaintext"}"><![CDATA[${s.code || ""}]]></snippet>\n`)
          );
          xml += `  </code-collection>\n`;
          break;
        default:
          break;
      }
    });

    xml += `</content>`;
    setXmlPreview(xml);
    return xml;
  };

  // 💾 Save to server
  const saveToServer = async () => {
    if (!topic) return alert("⚠️ Topic not loaded yet.");
    const xml = generateXML();

    const payload = {
      block_type: "page",
      block_order: 0,
      metadata: {
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        estimated_read_time: readTime,
      },
      components: [{ type: "xml_block", xml }],
    };

    try {
      const res = await fetch(
        `http://31.97.202.194/api/topics/slug/${topicPath}/content`,
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
      console.log("💾 Save Response:", data);
      if (res.ok) alert("✅ XML saved successfully!");
      else alert("⚠️ Save failed, check console logs.");
    } catch (err) {
      console.error("❌ Save failed:", err);
      alert("❌ Save failed: " + err.message);
    }
  };

  return (
    <div className="container my-4">
      <h3>🧱 XML Content Editor + Renderer</h3>

      {topic && (
        <div className="alert alert-info">
          Editing: <b>{topic.title}</b> ({topic.full_path})
        </div>
      )}

      {/* Metadata */}
      <div className="card p-3 mb-3">
        <h5>Metadata</h5>
        <input
          className="form-control mb-2"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <input
          className="form-control"
          placeholder="Estimated read time"
          value={readTime}
          onChange={(e) => setReadTime(e.target.value)}
        />
      </div>

      {/* Blocks */}
      {blocks.map((b) => (
        <div key={b.id} className="card p-3 mb-3 shadow-sm border-0">
          <select
            className="form-select mb-2"
            value={b.type}
            onChange={(e) => updateBlockType(b.id, e.target.value)}
          >
            <option value="">-- Select Block Type --</option>
            <option value="heading">Heading</option>
            <option value="paragraph">Paragraph</option>
            <option value="code">Code</option>
            <option value="example">Example</option>
            <option value="image">Image</option>
            <option value="carousel">Carousel</option>
            <option value="code-collection">Code Collection</option>
          </select>

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
                placeholder="Heading level (1–6)"
                onChange={(e) => updateField(b.id, "level", e.target.value)}
              />
            </>
          )}

          {b.type === "paragraph" && (
            <textarea
              className="form-control"
              rows="3"
              placeholder="Paragraph text"
              onChange={(e) => updateField(b.id, "text", e.target.value)}
            />
          )}

          {b.type === "code" && (
            <>
              <input
                className="form-control mb-2"
                placeholder="Language (e.g. python)"
                onChange={(e) => updateField(b.id, "language", e.target.value)}
              />
              <textarea
                className="form-control"
                rows="4"
                placeholder="Code block"
                onChange={(e) => updateField(b.id, "code", e.target.value)}
              />
            </>
          )}

          {b.type === "example" && (
            <>
              <input
                className="form-control mb-2"
                placeholder="Example title"
                onChange={(e) => updateField(b.id, "title", e.target.value)}
              />
              <textarea
                className="form-control"
                rows="3"
                placeholder="Example content"
                onChange={(e) => updateField(b.id, "content", e.target.value)}
              />
            </>
          )}

          {b.type === "image" && (
            <>
              <input
                className="form-control mb-2"
                placeholder="Image URL"
                onChange={(e) => updateField(b.id, "src", e.target.value)}
              />
              <input
                className="form-control"
                placeholder="Alt text"
                onChange={(e) => updateField(b.id, "alt", e.target.value)}
              />
            </>
          )}

          {b.type === "carousel" && (
            <>
              <input
                className="form-control mb-2"
                placeholder="Carousel caption"
                onChange={(e) => updateField(b.id, "caption", e.target.value)}
              />
              {(b.fields.images || []).map((img, i) => (
                <input
                  key={i}
                  className="form-control mb-2"
                  placeholder={`Image URL ${i + 1}`}
                  value={img}
                  onChange={(e) => {
                    const updatedImgs = [...(b.fields.images || [])];
                    updatedImgs[i] = e.target.value;
                    updateField(b.id, "images", updatedImgs);
                  }}
                />
              ))}
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => addCarouselImage(b.id)}
              >
                ➕ Add Image
              </button>
            </>
          )}

          {b.type === "code-collection" && (
            <>
              <input
                className="form-control mb-2"
                placeholder="Collection title"
                onChange={(e) => updateField(b.id, "title", e.target.value)}
              />
              {(b.fields.snippets || []).map((s, i) => (
                <div key={i} className="card p-2 mb-2 bg-light border">
                  <input
                    className="form-control mb-1"
                    placeholder="Language"
                    value={s.language}
                    onChange={(e) => {
                      const updated = [...(b.fields.snippets || [])];
                      updated[i].language = e.target.value;
                      updateField(b.id, "snippets", updated);
                    }}
                  />
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Code"
                    value={s.code}
                    onChange={(e) => {
                      const updated = [...(b.fields.snippets || [])];
                      updated[i].code = e.target.value;
                      updateField(b.id, "snippets", updated);
                    }}
                  />
                </div>
              ))}
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => addSnippet(b.id)}
              >
                ➕ Add Snippet
              </button>
            </>
          )}
        </div>
      ))}

      <button className="btn btn-primary me-2" onClick={addBlock}>
        ➕ Add Block
      </button>
      <button className="btn btn-success" onClick={saveToServer}>
        💾 Save XML
      </button>

      
    </div>
  );
}
