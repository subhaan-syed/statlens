import { useState, useCallback } from "react";
import type { ColumnDtype, ColumnInfo, UploadResponse } from "../../types";
import { useFormValidation } from "../../hooks/useFormValidation";
import { DataPreview } from "./DataPreview";

interface ColumnConfigFormProps {
  uploadData: UploadResponse;
  onConfirm: (columns: ColumnInfo[], targetColumn: string) => void;
}

interface FormValues {
  targetColumn: string;
  columnTypes: Record<string, ColumnDtype>;
}

const DTYPE_OPTIONS: ColumnDtype[] = ["numeric", "categorical", "datetime", "boolean"];

export function ColumnConfigForm({ uploadData, onConfirm }: ColumnConfigFormProps) {
  const [columnTypes, setColumnTypes] = useState<Record<string, ColumnDtype>>(
    Object.fromEntries(uploadData.columns.map((c) => [c.name, c.dtype]))
  );
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const rules = {
    targetColumn: (val: string) =>
      !val ? "Please select a target column" : null,
  };

  const { errors, validate } = useFormValidation<Pick<FormValues, "targetColumn">>(rules);

  // Derived validation: target column type must be numeric or categorical
  const targetTypeError =
    targetColumn && columnTypes[targetColumn] === "datetime"
      ? "Target column must be numeric or categorical"
      : targetColumn && columnTypes[targetColumn] === "boolean"
      ? "Target column must be numeric or categorical"
      : null;

  const isFormValid = !!targetColumn && !targetTypeError;

  const handleTypeChange = useCallback((colName: string, dtype: ColumnDtype) => {
    setColumnTypes((prev) => ({ ...prev, [colName]: dtype }));
  }, []);

  const handleSubmit = () => {
    setSubmitAttempted(true);
    const valid = validate({ targetColumn });
    if (!valid || targetTypeError) return;

    const updatedColumns: ColumnInfo[] = uploadData.columns.map((col) => ({
      ...col,
      dtype: columnTypes[col.name] ?? col.dtype,
    }));
    onConfirm(updatedColumns, targetColumn);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1)" }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "var(--color-primary)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.85rem",
        }}>2</div>
        <div>
          <div style={{ fontWeight: 700 }}>Configure Columns</div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Verify auto-detected types and choose your target column
          </div>
        </div>
      </div>

      {/* Data preview */}
      <div className="card">
        <div className="card-title">📋 File: {uploadData.filename}</div>
        <DataPreview data={uploadData} />
      </div>

      {/* Target column selector */}
      <div className="card">
        <div className="card-title">🎯 Target Column</div>
        <div className="form-group">
          <label className="form-label" htmlFor="target-col-select">
            Which column do you want to predict?
          </label>
          <select
            id="target-col-select"
            className="form-select"
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            aria-describedby="target-col-error"
          >
            <option value="">— Select target column —</option>
            {uploadData.columns.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name} ({col.dtype})
              </option>
            ))}
          </select>

          {/* Inline validation errors */}
          {(submitAttempted && errors.targetColumn) && (
            <div id="target-col-error" className="form-error" role="alert">
              {errors.targetColumn}
            </div>
          )}
          {targetTypeError && (
            <div id="target-col-error" className="form-error" role="alert">
              {targetTypeError}
            </div>
          )}
        </div>
      </div>

      {/* Column type overrides */}
      <div className="card">
        <div className="card-title">⚙️ Column Type Overrides</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-1)" }}>
          {uploadData.columns.map((col) => (
            <div
              key={col.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-1)",
                padding: "8px 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div style={{ flex: 1, fontWeight: 500, fontSize: "0.9rem" }}>
                {col.name}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                {col.null_pct > 0 ? `${col.null_pct}% null · ` : ""}{col.unique_count} unique
              </div>
              <select
                className="form-select"
                style={{ width: "140px" }}
                value={columnTypes[col.name] ?? col.dtype}
                onChange={(e) =>
                  handleTypeChange(col.name, e.target.value as ColumnDtype)
                }
                aria-label={`Type for ${col.name}`}
              >
                {DTYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Proceed button */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-1)" }}>
        <div style={{ flex: 1 }}>
          {!isFormValid && submitAttempted && (
            <div className="form-error">Fix validation errors above before proceeding.</div>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={false /* visually enabled; validates on click */}
          title={!isFormValid ? "Select a valid target column to proceed" : ""}
          aria-disabled={!isFormValid}
          style={{ opacity: isFormValid ? 1 : 0.55 }}
          data-testid="proceed-btn"
        >
          Proceed to Analysis →
        </button>
      </div>
    </div>
  );
}
