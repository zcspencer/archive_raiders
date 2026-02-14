import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./ui/App";

const rootElement = document.getElementById("ui-root");

if (!rootElement) {
  throw new Error("Missing #ui-root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
