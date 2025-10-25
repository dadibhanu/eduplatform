import React, { useEffect, useState } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";

export default function RenderXMLContent({ xmlString }) {
  const [elements, setElements] = useState([]);
  const [activeTabs, setActiveTabs] = useState({}); // stores active language per code-collection

  useEffect(() => {
    if (!xmlString) return;

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "application/xml");
      const sectionNode = xmlDoc.getElementsByTagName("section")[0];
      if (!sectionNode) return;

      const innerXMLString = sectionNode.textContent
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&amp;", "&");

      const innerDoc = parser.parseFromString(innerXMLString, "application/xml");
      const nodes = Array.from(innerDoc.childNodes).filter(
        (n) => n.nodeType === 1
      );
      setElements(nodes);

      setTimeout(() => Prism.highlightAll(), 0);
    } catch (err) {
      console.error("❌ XML parsing failed:", err);
    }
  }, [xmlString]);

  const renderNode = (node, key) => {
    switch (node.nodeName) {
      case "heading": {
        const level = node.getAttribute("level") || 2;
        const Tag = `h${level}`;
        return (
          <Tag key={key} className="fw-bold mt-3 mb-2 text-dark">
            {node.textContent}
          </Tag>
        );
      }

      case "paragraph":
        return (
          <p key={key} className="text-body fs-6 mb-3">
            {node.textContent}
          </p>
        );

      case "code": {
        const lang = node.getAttribute("language") || "plaintext";
        return (
          <pre
            key={key}
            className={`language-${lang} rounded`}
            style={{
              background: "#0f172a",
              color: "#fff",
              padding: "1rem",
              borderRadius: "10px",
              overflowX: "auto",
            }}
          >
            <code className={`language-${lang}`}>{node.textContent.trim()}</code>
          </pre>
        );
      }

      case "image":
      case "img": {
        const src = node.textContent.trim();
        const alt = node.getAttribute("alt") || "Image";
        return (
          <figure key={key} className="my-3 text-center">
            <img
              src={src}
              alt={alt}
              className="img-fluid rounded shadow-sm"
              style={{
                maxWidth: "100%",
                height: "auto",
                border: "1px solid #ddd",
              }}
            />
            {alt && (
              <figcaption className="text-muted small mt-1">{alt}</figcaption>
            )}
          </figure>
        );
      }

      case "code-collection": {
        const title = node.getAttribute("title");
        const snippets = Array.from(node.getElementsByTagName("snippet"));
        const firstLang = snippets[0]?.getAttribute("language") || "plaintext";
        const activeLang = activeTabs[key] || firstLang;

        return (
          <div key={key} className="p-3 my-3 bg-light border rounded">
            {title && <h5 className="fw-bold mb-3 text-secondary">{title}</h5>}

            {/* Tabs */}
            <div className="flex border-b border-gray-300 mb-3">
              {snippets.map((s, i) => {
                const lang = s.getAttribute("language") || "plaintext";
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveTabs((prev) => ({ ...prev, [key]: lang }));
                      setTimeout(() => Prism.highlightAll(), 0);
                    }}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                      activeLang === lang
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-blue-500"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                );
              })}
            </div>

            {/* Active Code Snippet */}
            {snippets.map((s, i) => {
              const lang = s.getAttribute("language") || "plaintext";
              const isActive = activeLang === lang;
              return (
                <div key={i} className={`${isActive ? "block" : "hidden"}`}>
                  <pre
                    className={`language-${lang}`}
                    style={{
                      background: "#0f172a",
                      color: "#fff",
                      padding: "1rem",
                      borderRadius: "10px",
                      overflowX: "auto",
                      marginBottom: "1rem",
                    }}
                  >
                    <code className={`language-${lang}`}>
                      {s.textContent.trim()}
                    </code>
                  </pre>
                </div>
              );
            })}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <section className="rendered-xml bg-white p-3 rounded border shadow-sm">
      {elements.length === 0 ? (
        <div className="alert alert-secondary text-center">
          No content to display
        </div>
      ) : (
        elements.map((node, i) => renderNode(node, i))
      )}
    </section>
  );
}
