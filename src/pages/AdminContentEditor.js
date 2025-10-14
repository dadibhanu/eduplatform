import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";
import api from "../api";

export default function AdminXMLContentEditor({ topicPath }) {
  const { token } = useAuth();

  const [tags, setTags] = useState("");
  const [readTime, setReadTime] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [xmlPreview, setXmlPreview] = useState("");
  const [topic, setTopic] = useState(null);

  // 🟢 Fetch topic details
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

  // ➕ Add new block
  const addBlock = () => {
    setBlocks([...blocks, { id: Date.now(), type: "", fields: {} }]);
  };

  // 🔄 Change block type
  const updateBlockType = (id, type) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, type, fields: {} } : b)));
  };

  // ✏️ Update field
  const updateField = (id, key, value) => {
    setBlocks(
      blocks.map((b) =>
        b.id === id ? { ...b, fields: { ...b.fields, [key]: value } } : b
      )
    );
  };

  // 🧠 Generate XML
  const generateXML = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<content>\n`;
    xml += `  <metadata>\n`;
    xml += `    <tags>${tags}</tags>\n`;
    xml += `    <readTime>${readTime}</readTime>\n`;
    xml += `  </metadata>\n`;

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
          xml += `  <code language="${f.language || "text"}"><![CDATA[${f.code || ""}]]></code>\n`;
          break;
        case "note":
          xml += `  <note>${f.content || ""}</note>\n`;
          break;
        case "example":
          xml += `  <example title="${f.title || ""}">${f.content || ""}</example>\n`;
          break;
        case "image":
          xml += `  <image alt="${f.alt || ""}">${f.src || ""}</image>\n`;
          break;
        case "carousel":
          xml += `  <carousel caption="${f.caption || ""}">\n`;
          (f.images || []).forEach((img) => (xml += `    <img>${img}</img>\n`));
          xml += `  </carousel>\n`;
          break;
        case "gallery":
          xml += `  <gallery caption="${f.caption || ""}">\n`;
          (f.images || []).forEach((img) => (xml += `    <img>${img}</img>\n`));
          xml += `  </gallery>\n`;
          break;
        default:
          break;
      }
    });

    xml += `</content>`;
    setXmlPreview(xml);
    return xml;
  };

  // 💾 Save XML as JSON Payload
  const saveToServer = async () => {
    if (!topic) {
      alert("⚠️ Topic not loaded yet");
      return;
    }

    const xml = generateXML();

    // ✅ Proper JSON body
    const payload = {
      block_type: "page",
      block_order: 0,
      metadata: {
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        estimated_read_time: readTime,
      },
      components: xml, // ✅ Wrap XML as a value
    };

    try {
      const res = await fetch(
        `http://31.97.202.194/api/topics/slug/${topicPath}/content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("✅ XML saved successfully!");
        console.log("Saved:", data);
      } else {
        console.error("❌ Error:", data);
        alert("⚠️ Failed: " + JSON.stringify(data));
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Upload failed: " + err.message);
    }
  };

  return (
    <div className="container my-4">
      <h3>🧱 XML Editor for Topic</h3>
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
        <div key={b.id} className="card p-3 mb-3">
          <select
            className="form-select mb-2"
            value={b.type}
            onChange={(e) => updateBlockType(b.id, e.target.value)}
          >
            <option value="">-- Select Block Type --</option>
            <option value="heading">Heading</option>
            <option value="paragraph">Paragraph</option>
            <option value="code">Code</option>
            <option value="note">Note</option>
            <option value="example">Example</option>
            <option value="image">Image</option>
            <option value="carousel">Carousel</option>
            <option value="gallery">Gallery</option>
          </select>

          {/* Render block-specific fields */}
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
                onChange={(e) =>
                  updateField(b.id, "language", e.target.value)
                }
              />
              <textarea
                className="form-control"
                rows="4"
                placeholder="Code block"
                onChange={(e) => updateField(b.id, "code", e.target.value)}
              />
            </>
          )}
        </div>
      ))}

      <button className="btn btn-primary me-2" onClick={addBlock}>
        ➕ Add Block
      </button>
      <button className="btn btn-success" onClick={saveToServer}>
        💾 Save XML (JSON Format)
      </button>

      {xmlPreview && (
        <div className="card p-3 mt-3 bg-dark text-light">
          <h6>📜 XML Preview</h6>
          <pre style={{ whiteSpace: "pre-wrap" }}>{xmlPreview}</pre>
        </div>
      )}
    </div>
  );
}
