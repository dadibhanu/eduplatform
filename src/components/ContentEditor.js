import React, { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import api from "../api";

// ------------------ 🔧 XML Templates ------------------
const xmlTemplates = {
  heading: `<heading level="1">Your Heading Here</heading>\n`,
  paragraph: `<paragraph>Your paragraph content here...</paragraph>\n`,
  code: `<code language="python"><![CDATA[\n# Your code here\n]]></code>\n`,
  image: `<image alt="Image description">image_name.png</image>\n`,
  carousel: `<carousel caption="Carousel Title">\n  <img>image1.png</img>\n  <img>image2.png</img>\n</carousel>\n`,
  gallery: `<gallery caption="Gallery Title">\n  <img>gallery1.png</img>\n  <img>gallery2.png</img>\n</gallery>\n`,
  example: `<example title="Example Title">\n  Example explanation text here.\n</example>\n`,
  note: `<note>Important note or tip goes here.</note>\n`,
  codeCollection: `<code-collection title="Loops in Different Languages">\n  <snippet language="python"><![CDATA[\nfor i in range(5): print(i)\n]]></snippet>\n  <snippet language="java"><![CDATA[\nfor(int i=0; i<5; i++) System.out.println(i);\n]]></snippet>\n</code-collection>\n`,
};

// ------------------ 🖼 Image Upload Handler ------------------
const imageHandler = function () {
  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("accept", "image/*");
  input.click();

  input.onchange = async () => {
    const files = Array.from(input.files);
    const quill = this.quill;

    for (let file of files) {
      const formData = new FormData();
      formData.append("file0", file);

      try {
        const res = await api.post("/upload/server", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const urls = (res.data.files || []).map((f) => f.url);
        if (!urls.length) {
          alert("⚠️ Upload succeeded but no URL found.");
          continue;
        }

        const editor = quill;
        const range = editor.getSelection(true);
        const xmlTag = `<image alt="Image description">${urls[0]}</image>\n`;

        editor.insertText(range.index, xmlTag, "user");
        editor.setSelection(range.index + xmlTag.length);
        alert("✅ Image uploaded & XML tag inserted!");
      } catch (err) {
        console.error("❌ Upload Error:", err);
        alert("❌ Upload failed: " + err.message);
      }
    }
  };
};

// ------------------ 🧰 Quill Configuration ------------------
const modules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"],
    ],
    handlers: {
      image: imageHandler,
    },
  },
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "blockquote",
  "code-block",
  "link",
  "image",
];

// ------------------ 🧩 Main Component ------------------
export default function ContentEditorXML({
  topicId,
  blockId = null,
  initialXML = "",
  onSave,
  onCancel,
}) {
  const [content, setContent] = useState("");
  const [showXML, setShowXML] = useState(true);
  const quillRef = useRef(null);

  // ------------------ 🧠 Load existing XML ------------------
  useEffect(() => {
    if (initialXML) {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(initialXML, "text/xml");
        const section = xmlDoc.querySelector("section");
        const cdataText = section ? section.textContent.trim() : initialXML;
        setContent(cdataText);
      } catch (err) {
        console.error("❌ XML Parse Error:", err);
        setContent(initialXML);
      }
    }
  }, [initialXML]);

  // ------------------ ✨ Insert Snippet ------------------
  const insertSnippet = (snippet) => {
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);
    editor.insertText(range.index, snippet, "user");
    editor.setSelection(range.index + snippet.length);
  };

  // ------------------ 🧾 Convert to XML ------------------
  const convertToXML = (inner) => {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<content>\n  <section><![CDATA[\n${inner.trim()}\n  ]]></section>\n</content>`;
  };

  // ------------------ 💾 Save / Update XML ------------------
  const handleSave = async () => {
    const xml = convertToXML(content);

    const payload = {
      topic_id: topicId,
      block_type: "page",
      block_order: 0,
      components: [{ type: "xml_block", xml }],
      metadata: { tags: ["XML"], estimated_read_time: "10 Min" },
    };

    try {
      let res;
      if (blockId) {
        // ✅ UPDATE Existing block
        res = await api.put(`/content-blocks/${blockId}`, payload);
        alert("✅ XML Content updated successfully!");
      } else {
        // ✅ CREATE New block
        res = await api.post(`/content-blocks/`, payload);
        alert("✅ XML Content created successfully!");
      }

      console.log("✅ Server Response:", res.data);
      onSave?.(xml);
    } catch (err) {
      console.error("❌ Save Error:", err);
      const msg = err.response?.data?.message || err.message;
      alert("❌ Failed to save content: " + msg);
    }
  };

  // ------------------ 🧩 UI ------------------
  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>
          🧠 {blockId ? "Edit XML Content" : "Add New XML Content"}
        </h3>
        {onCancel && (
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={onCancel}
          >
            ✖ Close
          </button>
        )}
      </div>

      {/* Template Buttons */}
      <div className="mb-3 d-flex flex-wrap gap-2">
        {Object.entries(xmlTemplates).map(([key, value]) => (
          <button
            key={key}
            className="btn btn-outline-primary btn-sm"
            onClick={() => insertSnippet(value)}
          >
            ➕ {key}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="mb-3">
        <button
          className="btn btn-secondary me-2"
          onClick={() => setShowXML(!showXML)}
        >
          {showXML ? "Hide XML" : "Show XML"}
        </button>
        <button className="btn btn-success" onClick={handleSave}>
          💾 {blockId ? "Update XML" : "Save XML"}
        </button>
      </div>

      {/* Editor + Preview */}
      <div className="row">
        <div className={showXML ? "col-md-7" : "col-md-12"}>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            modules={modules}
            formats={formats}
            value={content}
            onChange={setContent}
            style={{
              minHeight: "400px",
              fontFamily: "monospace",
              background: "#fff",
              borderRadius: "6px",
            }}
          />
        </div>

        {showXML && (
          <div className="col-md-5">
            <div
              className="card p-3 bg-dark text-light"
              style={{ height: "100%" }}
            >
              <h6>📜 XML Preview</h6>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "0.85rem",
                  lineHeight: "1.3",
                }}
              >
                {convertToXML(content)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
