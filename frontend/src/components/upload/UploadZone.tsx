import { useState, useRef, useCallback } from "react";
import { uploadFile } from "../../api/upload";
import type { ColumnInfo, UploadResponse } from "../../types";
import { useAppContext } from "../../context/AppContext";
import { ColumnConfigForm } from "./ColumnConfigForm";

const MAX_MB = 100;
const MAX_BYTES = MAX_MB * 1024 * 1024;

type UploadStep = "drop" | "configure";

export function UploadZone() {
  const { dispatch } = useAppContext();
  const [step, setStep] = useState<UploadStep>("drop");
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files are accepted.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError(`File exceeds the ${MAX_MB}MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }

    setLoading(true);
    try {
      const data = await uploadFile(file);
      dispatch({ type: "FILE_UPLOADED", payload: data });
      setUploadData(data);
      setStep("configure");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Upload failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const handleConfirm = useCallback(
    (columns: ColumnInfo[], targetColumn: string) => {
      dispatch({ type: "FILE_CONFIGURED", payload: { columns, targetColumn } });
    },
    [dispatch]
  );

  // Drag-and-drop handlers
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  if (step === "configure" && uploadData) {
    return <ColumnConfigForm uploadData={uploadData} onConfirm={handleConfirm} />;
  }

  return (
    <div style={{ maxWidth: 640, margin: "var(--spacing-5) auto" }}>
      <div
        className={`upload-zone ${dragActive ? "drag-active" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file"
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        data-testid="upload-zone"
      >
        <div className="upload-zone__icon">
          {loading ? "⏳" : "📂"}
        </div>
        <div className="upload-zone__title">
          {loading ? "Uploading…" : "Drop your CSV here"}
        </div>
        <div className="upload-zone__hint">
          or click to browse · up to {MAX_MB}MB
        </div>

        {error && (
          <div className="upload-zone__error" role="alert">{error}</div>
        )}

        {loading && (
          <div style={{ marginTop: "var(--spacing-1)", display: "flex", justifyContent: "center" }}>
            <div className="spinner" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={onInputChange}
        data-testid="file-input"
      />

      {/* Step indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "var(--spacing-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "var(--color-primary)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.75rem",
          }}>1</div>
          <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>Upload CSV</span>
        </div>
        <div style={{ color: "var(--color-text-muted)", alignSelf: "center" }}>→</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "var(--color-border)", color: "var(--color-text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.75rem",
          }}>2</div>
          <span style={{ color: "var(--color-text-muted)" }}>Configure</span>
        </div>
      </div>
    </div>
  );
}
