import { useState, useEffect, useCallback, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { trainModel } from "../../api/models";
import { getExperiments } from "../../api/models";
import { downloadReport } from "../../api/export";
import type { ModelType, TrainResponse } from "../../types";
import { getDefaultHyperparams } from "../../types";
import { Card } from "../layout/Card";
import { ModelSelector } from "./ModelSelector";
import { HyperparamPanel } from "./HyperparamPanel";
import { ModelResults } from "./ModelResults";
import { RetrainingBadge } from "./TrainingStatus";

interface TrainState {
  status: "idle" | "retraining" | "done" | "error";
  result: TrainResponse | null;
  previousResult: TrainResponse | null;
  retrainStartedAt: number | null;
  latencyMs: number | null;
  error: string | null;
}

export function ModelTab() {
  const { state, dispatch } = useAppContext();
  const { fileId, columns, targetColumn } = state;

  const [selectedModel, setSelectedModel] = useState<ModelType>("random_forest");
  const [committedParams, setCommittedParams] = useState<Record<string, number | string>>(
    () => getDefaultHyperparams("random_forest")
  );
  const [trainState, setTrainState] = useState<TrainState>({
    status: "idle",
    result: null,
    previousResult: null,
    retrainStartedAt: null,
    latencyMs: null,
    error: null,
  });
  const [exporting, setExporting] = useState(false);

  // Use a ref to avoid stale closures in the train effect
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const doTrain = useCallback(
    async (params: Record<string, number | string>, model: ModelType, target: string) => {
      if (!fileId || !target) return;

      setTrainState((prev) => ({
        ...prev,
        status: "retraining",
        previousResult: prev.result,
        retrainStartedAt: Date.now(),
        latencyMs: null,
        error: null,
      }));

      try {
        const result = await trainModel({
          file_id: fileId,
          target_column: target,
          model_type: model,
          hyperparams: params,
        });

        if (!isMounted.current) return;

        const latencyMs = Date.now() - (trainState.retrainStartedAt ?? Date.now());
        setTrainState({
          status: "done",
          result,
          previousResult: null,
          retrainStartedAt: null,
          latencyMs,
          error: null,
        });
        dispatch({ type: "TRAIN_COMPLETE", payload: result });

        // Refresh experiments list
        const experiments = await getExperiments(fileId);
        if (isMounted.current) {
          dispatch({ type: "EXPERIMENTS_LOADED", payload: experiments });
        }
      } catch (err) {
        if (!isMounted.current) return;
        setTrainState((prev) => ({
          ...prev,
          status: "error",
          error: err instanceof Error ? err.message : "Training failed",
        }));
      }
    },
    [fileId, dispatch] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Train whenever committed params or model changes
  useEffect(() => {
    if (!targetColumn) return;
    doTrain(committedParams, selectedModel, targetColumn);
  }, [committedParams, selectedModel, targetColumn]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModelChange = useCallback((m: ModelType) => {
    setSelectedModel(m);
    setCommittedParams(getDefaultHyperparams(m));
  }, []);

  const handleExport = async () => {
    if (!fileId) return;
    setExporting(true);
    try {
      await downloadReport(fileId);
    } finally {
      setExporting(false);
    }
  };

  const isRetraining = trainState.status === "retraining";
  const displayResult = isRetraining
    ? trainState.previousResult
    : trainState.result;

  return (
    <div className="section-grid">
      <div className="model-two-col">
        {/* Left panel: controls */}
        <div className="section-grid">
          <Card title="🤖 Model Type">
            <ModelSelector value={selectedModel} onChange={handleModelChange} />
          </Card>

          <Card title="⚙️ Hyperparameters">
            <HyperparamPanel
              modelType={selectedModel}
              onCommit={setCommittedParams}
            />
          </Card>

          {/* Export */}
          <div style={{ display: "flex", gap: "var(--spacing-1)" }}>
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={exporting || !trainState.result}
              data-testid="export-btn"
              style={{ flex: 1 }}
            >
              {exporting ? <><div className="spinner" /> Exporting…</> : "📥 Export Report"}
            </button>
          </div>
        </div>

        {/* Right panel: results */}
        <div className="section-grid">
          <RetrainingBadge show={isRetraining} />

          {trainState.status === "error" && (
            <div className="card" style={{ color: "var(--color-danger)" }}>
              ⚠️ {trainState.error}
            </div>
          )}

          {trainState.status === "idle" && !targetColumn && (
            <div className="card" style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "var(--spacing-4)" }}>
              Select a target column in the upload step to begin training.
            </div>
          )}

          {displayResult && (
            <ModelResults
              result={displayResult}
              dimmed={isRetraining}
              latencyMs={isRetraining ? null : trainState.latencyMs}
            />
          )}
        </div>
      </div>
    </div>
  );
}
