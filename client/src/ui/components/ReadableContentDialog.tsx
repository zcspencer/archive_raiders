import { useEffect, useState, type CSSProperties, type ReactElement } from "react";
import { useReadableContentStore, type ReadableContentType } from "../../store/readableContent";
import { resolveReadableImageUrl } from "../../utils/readableContentUrl";

const BACKDROP: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 160
};

const PANEL: CSSProperties = {
  width: "min(480px, 92vw)",
  maxHeight: "80vh",
  overflow: "auto",
  padding: "20px 24px",
  background: "rgba(15, 23, 42, 0.98)",
  border: "2px solid #475569",
  borderRadius: 12,
  boxShadow: "0 12px 48px rgba(0,0,0,0.5)"
};

const TITLE: CSSProperties = {
  margin: "0 0 14px",
  fontSize: 18,
  fontWeight: 700,
  color: "#e2e8f0"
};

const TEXT_BODY: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.55,
  color: "#cbd5e1",
  marginBottom: 16,
  whiteSpace: "pre-wrap"
};

const IMG_WRAP: CSSProperties = {
  marginBottom: 16,
  textAlign: "center",
  minHeight: 80
};

const IMG_STYLE: CSSProperties = {
  maxWidth: "100%",
  maxHeight: "60vh",
  width: "auto",
  height: "auto",
  borderRadius: 8,
  border: "1px solid #334155",
  objectFit: "contain"
};

const IMG_LOADING: CSSProperties = {
  fontSize: 14,
  color: "#94a3b8",
  padding: 24
};

const IMG_ERROR: CSSProperties = {
  fontSize: 13,
  color: "#f87171",
  padding: 16,
  background: "rgba(248, 113, 113, 0.1)",
  borderRadius: 8,
  border: "1px solid #f87171"
};

const CLOSE_BTN: CSSProperties = {
  padding: "8px 18px",
  fontSize: 14,
  background: "#334155",
  border: "1px solid #475569",
  borderRadius: 8,
  color: "#f1f5f9",
  cursor: "pointer"
};

function ReadableImage({ content }: { content: string }): ReactElement {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const src = resolveReadableImageUrl(content);

  useEffect(() => {
    setStatus("loading");
  }, [content]);

  if (status === "error") {
    return (
      <div style={IMG_WRAP}>
        <div style={IMG_ERROR}>Image or sprite could not be loaded.</div>
      </div>
    );
  }

  return (
    <div style={IMG_WRAP}>
      {status === "loading" ? <div style={IMG_LOADING}>Loading…</div> : null}
      <img
        src={src}
        alt=""
        style={{ ...IMG_STYLE, visibility: status === "loaded" ? "visible" : "hidden" }}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </div>
  );
}

function renderContent(contentType: ReadableContentType, content: string): ReactElement {
  if (contentType === "image") {
    return <ReadableImage content={content} />;
  }
  return <div style={TEXT_BODY}>{content}</div>;
}

/**
 * Modal dialog that displays Readable item content (text or image/sprite).
 * Image content is resolved via resolveReadableImageUrl (paths from app root or full URLs).
 * Closes on Escape or Close button. Reads from readableContent store.
 */
export function ReadableContentDialog(): ReactElement | null {
  const { isOpen, title, contentType, content, closeReadable } = useReadableContentStore();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeReadable();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeReadable]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={BACKDROP}
      onClick={closeReadable}
      role="presentation"
    >
      <div
        style={PANEL}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Read"
      >
        <h2 style={TITLE}>{title}</h2>
        {renderContent(contentType, content)}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" style={CLOSE_BTN} onClick={closeReadable}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
