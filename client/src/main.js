import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { bootGame } from "./game/bootstrap";
import { App } from "./ui/App";
bootGame();
const rootElement = document.getElementById("ui-root");
if (!rootElement) {
    throw new Error("Missing #ui-root element");
}
createRoot(rootElement).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
//# sourceMappingURL=main.js.map