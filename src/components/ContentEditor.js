import React, { useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// ------------------ 🔧 Custom XML Templates ------------------
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

      console.group(`🖼 Uploading: ${file.name}`);

      try {
        const res = await fetch("http://31.97.202.194/api/upload/server", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });

        const rawText = await res.text();
        console.log("📄 Raw Response:", rawText);

        let data;
        try {
          data = JSON.parse(rawText);
        } catch (err) {
          console.error("❌ JSON Parse Error:", err);
          alert("❌ Upload failed: Invalid JSON response.");
          continue;
        }

        const urls = (data.files || []).map((f) => f.url);
        if (!urls.length) {
          alert("⚠️ Upload succeeded but no URL found in response.");
          continue;
        }

        // ✅ Insert real XML tag (not escaped)
        const editor = quill;
        const range = editor.getSelection(true);
        const xmlTag = `<image alt="Image description">${urls[0]}</image>\n`;

        editor.insertText(range.index, xmlTag, "user");
        editor.setSelection(range.index + xmlTag.length);

        console.log("🧩 Inserted XML tag:", xmlTag);
        alert("✅ Image uploaded & XML tag inserted!");
      } catch (err) {
        console.error("❌ Upload Error:", err);
        alert("❌ Upload failed: " + err.message);
      } finally {
        console.groupEnd();
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
export default function ContentEditorXML({ onSave }) {
  const [content, setContent] = useState("");
  const [showXML, setShowXML] = useState(true);
  const quillRef = useRef(null);

  // Insert XML snippet
  const insertSnippet = (snippet) => {
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);
    editor.insertText(range.index, snippet, "user");
    editor.setSelection(range.index + snippet.length);
  };

  // Convert to full XML
  const convertToXML = (html) => {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<content>\n  <section><![CDATA[\n${html.trim()}\n  ]]></section>\n</content>`;
  };

  // Save button
  const handleSave = () => {
    const xml = convertToXML(content);
    console.log("📦 Final XML Output:\n", xml);
    onSave?.(xml);
    alert("✅ XML content saved!");
  };

  return (
    <div className="container my-4">
      <h3>🧠 XML Content Editor (Direct XML Tag Insertion)</h3>

      {/* Toolbar Buttons */}
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
          💾 Save XML
        </button>
      </div>

      {/* Editor + XML Preview */}
      <div className="row">
        <div className={showXML ? "col-md-7" : "col-md-12"}>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            modules={modules}
            formats={formats}
            value={content}
            onChange={setContent}
            style={{ minHeight: "400px", background: "#fff" }}
          />
        </div>

        {showXML && (
          <div className="col-md-5">
            <div className="card p-3 bg-dark text-light">
              <h6>📜 XML Output</h6>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {convertToXML(content)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
