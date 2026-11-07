import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./styles.css";
import "./styles/touch-mode.css";
import "./styles/fluid-rendering.css";
import App from "./App.tsx";
import { QuickNotePopup } from "./components/Tray/QuickNotePopup";

// Hızlı not penceresi (Ctrl+Alt+S) tam uygulamayı açmaz: orada proje açılıp kaydedilirse
// eski ağaç ana penceredeki çalışmanın üzerine yazılır. Not ana pencereye iletilir.
const root =
  window.location.hash === "#quick-note" ? (
    <QuickNotePopup onSave={(note) => window.electronAPI?.invoke?.("tray:quick-note-save", note)} />
  ) : (
    <App />
  );

ReactDOM.createRoot(document.getElementById("root")!).render(root);
