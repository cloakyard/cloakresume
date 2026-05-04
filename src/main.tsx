import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";

// Service-worker registration is owned by <ReloadPrompt /> via
// `useRegisterSW` — keeps registration co-located with the UI that
// reacts to its lifecycle (offline-ready toast, update prompt).

const el = document.getElementById("app");
if (el) {
  createRoot(el).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
