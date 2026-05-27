import "./styles/global.css";
import "./styles/responsive.css";
import { useAppContext } from "./context/AppContext";
import { TabBar } from "./components/layout/TabBar";
import { UploadZone } from "./components/upload/UploadZone";
import { EDATab } from "./components/eda/EDATab";
import { ModelTab } from "./components/models/ModelTab";
import { ExperimentTab } from "./components/experiments/ExperimentTab";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { downloadReport } from "./api/export";
import { useState } from "react";

function AppContent() {
  const { state } = useAppContext();
  const { activeTab, fileId, filename, rowCount } = state;
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!fileId) return;
    setExporting(true);
    try { await downloadReport(fileId); }
    finally { setExporting(false); }
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__logo">🔬 StatLens</div>
        <div className="app-header__subtitle">ML Experimentation Toolkit</div>
        {fileId && (
          <>
            <div className="app-header__file-badge" title={filename ?? ""}>
              📄 {filename} · {rowCount.toLocaleString()} rows
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleExport}
              disabled={exporting}
              style={{ marginLeft: "8px" }}
              data-testid="header-export-btn"
            >
              {exporting ? "Exporting…" : "📥 Export Report"}
            </button>
          </>
        )}
      </header>

      {/* Tab bar */}
      <TabBar />

      {/* Main content */}
      <main className="app-main">
        {!fileId || activeTab === "upload" ? (
          <ErrorBoundary key="upload">
            <UploadZone />
          </ErrorBoundary>
        ) : activeTab === "eda" ? (
          <ErrorBoundary key="eda">
            <EDATab />
          </ErrorBoundary>
        ) : activeTab === "model" ? (
          <ErrorBoundary key="model">
            <ModelTab />
          </ErrorBoundary>
        ) : activeTab === "experiments" ? (
          <ErrorBoundary key="experiments">
            <ExperimentTab />
          </ErrorBoundary>
        ) : null}
      </main>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
