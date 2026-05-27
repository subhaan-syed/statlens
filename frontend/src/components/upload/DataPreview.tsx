import type { UploadResponse } from "../../types";

interface DataPreviewProps {
  data: UploadResponse;
}

const DTYPE_BADGE: Record<string, string> = {
  numeric:     "badge badge-numeric",
  categorical: "badge badge-categorical",
  datetime:    "badge badge-datetime",
  boolean:     "badge badge-boolean",
};

export function DataPreview({ data }: DataPreviewProps) {
  const { preview, columns, row_count, col_count } = data;
  const colNames = columns.map((c) => c.name);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap" }}>
        <div className="badge badge-numeric">{row_count.toLocaleString()} rows</div>
        <div className="badge badge-categorical">{col_count} columns</div>
      </div>

      {/* Column types */}
      <div>
        <div className="form-label" style={{ marginBottom: "6px" }}>Column Types</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {columns.map((col) => (
            <span key={col.name} className={DTYPE_BADGE[col.dtype] ?? "badge"}>
              {col.name} · {col.dtype}
              {col.null_pct > 0 && (
                <span style={{ opacity: 0.7, marginLeft: "4px" }}>
                  ({col.null_pct}% null)
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Data table */}
      <div>
        <div className="form-label" style={{ marginBottom: "6px" }}>
          Preview (first {preview.length} rows)
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {colNames.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {colNames.map((col) => (
                    <td key={col}>
                      {row[col] == null ? (
                        <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>
                          null
                        </span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
