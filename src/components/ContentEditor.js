import React, { useState, useRef } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

// ------------------ 🔧 Custom XML Snippet Templates ------------------
const xmlTemplates = {
  heading: `<heading level="1">Your Heading Here</heading>\n`,
  paragraph: `<paragraph>Your paragraph content here...</paragraph>\n`,
  code: `<code language="python"><![CDATA[\n# Your code here\n]]></code>\n`,
  image: `<image alt="Image description">image_name.png</image>\n`,
  carousel: `<carousel caption="Carousel Title">\n  <img>image1.png</img>\n  <img>image2.png</img>\n</carousel>\n`,
  gallery: `<gallery caption="Gallery Title">\n  <img>gallery1.png</img>\n  <img>gallery2.png</img>\n</gallery>\n`,
  example: `<example title="Example Title">\n  Example explanation text here.\n</example>\n`,
  note: `<note>Important note or tip goes here.</note>\n`,
  codeCollection: `<code-collection title="Loops in Different Languages">\n  <snippet language="python"><![CDATA[\nfor i in range(5): print(i)\n]]></snippet>\n  <snippet language="java"><![CDATA[\nfor(int i=0; i<5; i++) System.out.println(i);\n]]></snippet>\n</code-collection>\n`
};

// ------------------ 📤 Image Upload Handler ------------------
const imageHandler = function () {
  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("accept", "image/*");
  input.setAttribute("multiple", true);
  input.click();

  input.onchange = async () => {
    const files = Array.from(input.files);
    const quill = this.quill;

    for (let file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("http://31.97.202.194/api/upload/server", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();
        if (data.url) {
          const range = quill.getSelection();
          quill.insertEmbed(range.index, "image", data.url);
          quill.setSelection(range.index + 1);
        } else alert("❌ Upload failed");
      } catch (err) {
        console.error("Upload error:", err);
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
  const [showXML, setShowXML] = useState(false);
  const quillRef = useRef(null);

  // Insert XML snippet at current cursor
  const insertSnippet = (snippet) => {
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);
    editor.insertText(range.index, snippet, "user");
    editor.setSelection(range.index + snippet.length);
  };

  // Convert content to XML (wrap as <section><![CDATA[]]></section>)
  const convertToXML = (html) => {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<content>\n  <section><![CDATA[\n${html.trim()}\n  ]]></section>\n</content>`;
  };

  const handleSave = () => {
    const xml = convertToXML(content);
    onSave?.(xml);
    alert("✅ XML content saved!");
  };

  return (
    <div className="container my-4">
      <h3>🧠 Content Editor (Quill + XML Snippets)</h3>

      {/* Toolbar Buttons */}
      <div className="mb-3 d-flex flex-wrap gap-2">
        <button className="btn btn-outline-primary btn-sm" onClick={() => insertSnippet(xmlTemplates.heading)}>🏷 Heading</button>
        <button className="btn btn-outline-primary btn-sm" onClick={() => insertSnippet(xmlTemplates.paragraph)}>📝 Paragraph</button>
        <button className="btn btn-outline-primary btn-sm" onClick={() => insertSnippet(xmlTemplates.code)}>💻 Code</button>
        <button className="btn btn-outline-primary btn-sm" onClick={() => insertSnippet(xmlTemplates.image)}>🖼 Image</button>
        <button className="btn btn-outline-primary btn-sm" onClick={() => insertSnippet(xmlTemplates.carousel)}>🎠 Carousel</button>
        <button className="btn btn-outline-primary btn-sm" onClick={() => insertSnippet(xmlTemplates.gallery)}>🖼 Gallery</button>
        <button className="btn btn-outline-primary btn-sm" onClick={() => insertSnippet(xmlTemplates.example)}>📚 Example</button>
        <button className="btn btn-outline-primary btn-sm" onClick={() => insertSnippet(xmlTemplates.note)}>💡 Note</button>
        <button className="btn btn-outline-primary btn-sm" onClick={() => insertSnippet(xmlTemplates.codeCollection)}>🧩 Code Collection</button>
      </div>

      {/* Quill Editor + Preview */}
      <div className="mb-3">
        <button
          className="btn btn-secondary me-2"
          onClick={() => setShowXML(!showXML)}
        >
          {showXML ? "Hide XML" : "Show XML"}
        </button>
        <button className="btn btn-success" onClick={handleSave}>
          💾 Save as XML
        </button>
      </div>

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
