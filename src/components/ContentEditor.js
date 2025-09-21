import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Quill toolbar config
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold", "italic", "underline", "strike",
  "list", "bullet",
  "blockquote", "code-block",
  "link", "image"
];

const ContentEditor = ({ initialMetadata, initialHtml, onSave, onCancel }) => {
  const [metadata, setMetadata] = useState({
    tags: initialMetadata?.tags?.join?.(", ") || "",
    estimated_read_time: initialMetadata?.estimated_read_time || "",
  });

  const [content, setContent] = useState(initialHtml || "");

  const handleSubmit = () => {
    const payload = {
      block_type: "page",
      block_order: 1,
      metadata: {
        tags: (metadata.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        estimated_read_time: metadata.estimated_read_time || "",
      },
      components: [
        {
          type: "richtext",
          html: content,
        },
      ],
    };
    onSave(payload);
  };

  return (
    <div className="editor-overlay">
      <div className="editor-container">
        <div className="editor-header d-flex justify-content-between align-items-center p-3 border-bottom bg-white">
          <h4 className="mb-0">📝 Content Editor</h4>
          <div className="d-flex gap-2">
            <button className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={handleSubmit}>
              💾 Save
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="p-3 bg-light border-bottom">
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Tags (comma separated)"
            value={metadata.tags}
            onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Estimated read time"
            value={metadata.estimated_read_time}
            onChange={(e) =>
              setMetadata({ ...metadata, estimated_read_time: e.target.value })
            }
          />
        </div>

        {/* Full screen rich text editor */}
        <div className="editor-body flex-grow-1 p-3">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            style={{ height: "100%", minHeight: "calc(100vh - 200px)" }}
          />
        </div>
      </div>

      <style>{`
        .editor-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.6);
          z-index: 2000;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .editor-container {
          background: #fff;
          width: 95%;
          height: 95%;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
        .editor-body {
          flex-grow: 1;
          overflow-y: auto;
          background: #fff;
        }
        .ql-editor {
          min-height: 70vh;
        }
      `}</style>
    </div>
  );
};

export default ContentEditor;
