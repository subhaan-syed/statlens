import { useEffect, useState, useCallback } from "react";
import { useAppContext } from "../../context/AppContext";
import { getExperiments } from "../../api/models";
import { Card } from "../layout/Card";
import { ExperimentTable } from "./ExperimentTable";
import { CompareModal } from "./CompareModal";
import type { Experiment } from "../../types";

export function ExperimentTab() {
  const { state, dispatch } = useAppContext();
  const { fileId, experiments } = state;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fileId) return;
    setLoading(true);
    getExperiments(fileId)
      .then((data) => dispatch({ type: "EXPERIMENTS_LOADED", payload: data }))
      .finally(() => setLoading(false));
  }, [fileId, dispatch]);

  const handleToggle = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 2) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedArr = experiments.filter((e) => selectedIds.has(e.id)) as [Experiment, Experiment] | [];

  return (
    <div className="section-grid">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--spacing-1)" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>📋 Experiment History</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Check up to 2 experiments to compare them side-by-side.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          disabled={selectedIds.size < 2}
          onClick={() => setCompareOpen(true)}
          data-testid="compare-btn"
        >
          🔍 Compare ({selectedIds.size}/2)
        </button>
      </div>

      <Card>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /> Loading experiments…</div>
        ) : (
          <ExperimentTable
            experiments={experiments}
            selectedIds={selectedIds}
            onToggle={handleToggle}
          />
        )}
      </Card>

      {compareOpen && selectedArr.length === 2 && (
        <CompareModal
          expA={selectedArr[0]}
          expB={selectedArr[1]}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  );
}
