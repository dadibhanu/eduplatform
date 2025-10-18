import React, { useEffect, useState } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";

export default function RenderXMLContent({ xmlString }) {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    if (!xmlString) return;

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "application/xml");
      const sectionNode = xmlDoc.getElementsByTagName("section")[0];
      if (!sectionNode) return;

      // Extract the inner CDATA and decode entities
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
              background: "#1e1e1e",
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

      case "carousel": {
        const caption = node.getAttribute("caption") || "";
        const images = Array.from(node.getElementsByTagName("img"));
        return (
          <div key={key} className="carousel-container mb-4">
            {caption && <h6 className="fw-bold mb-2">{caption}</h6>}
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {images.map((img, i) => {
                const src = img.textContent.trim();
                return (
                  <img
                    key={i}
                    src={src}
                    alt={img.getAttribute("alt") || ""}
                    className="rounded shadow-sm"
                    style={{
                      width: "180px",
                      height: "120px",
                      objectFit: "cover",
                      border: "1px solid #ccc",
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      }

      case "gallery": {
        const caption = node.getAttribute("caption") || "";
        const imgs = Array.from(node.getElementsByTagName("img"));
        return (
          <div key={key} className="gallery-container mb-4">
            {caption && <h6 className="fw-bold mb-2">{caption}</h6>}
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {imgs.map((img, i) => {
                const src = img.textContent.trim();
                return (
                  <img
                    key={i}
                    src={src}
                    alt={img.getAttribute("alt") || ""}
                    className="rounded shadow-sm"
                    style={{
                      width: "180px",
                      height: "120px",
                      objectFit: "cover",
                      border: "1px solid #ccc",
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      }

      case "example":
        return (
          <div
            key={key}
            className="p-3 my-3 bg-light border-start border-success border-3 rounded"
          >
            <h6 className="text-success fw-bold mb-1">
              {node.getAttribute("title")}
            </h6>
            <p className="mb-0">{node.textContent}</p>
          </div>
        );

      case "note":
        return (
          <div
            key={key}
            className="p-3 my-3 rounded"
            style={{
              background: "#eaf7ff",
              borderLeft: "4px solid #0d6efd",
              color: "#055160",
            }}
          >
            💡 {node.textContent}
          </div>
        );

      case "code-collection": {
        const title = node.getAttribute("title");
        const snippets = Array.from(node.getElementsByTagName("snippet"));
        return (
          <div key={key} className="p-3 my-3 bg-light border rounded">
            <h5 className="fw-bold mb-3 text-secondary">{title}</h5>
            {snippets.map((s, i) => {
              const lang = s.getAttribute("language") || "plaintext";
              return (
                <pre
                  key={i}
                  className={`language-${lang}`}
                  style={{
                    background: "#1e1e1e",
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
