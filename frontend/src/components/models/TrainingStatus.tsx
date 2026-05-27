import { useEffect, useState } from "react";

interface RetrainingBadgeProps {
  show: boolean;
}

export function RetrainingBadge({ show }: RetrainingBadgeProps) {
  if (!show) return null;
  return (
    <div className="retraining-bar" role="status" aria-live="polite">
      <div className="spinner" />
      Retraining…
    </div>
  );
}

interface LatencyBadgeProps {
  latencyMs: number | null;
}

export function LatencyBadge({ latencyMs }: LatencyBadgeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (latencyMs === null) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [latencyMs]);

  if (!visible || latencyMs === null) return null;

  const secs = (latencyMs / 1000).toFixed(1);
  const cls = latencyMs < 2000 ? "latency-fast" : latencyMs < 5000 ? "latency-medium" : "latency-slow";

  return (
    <span className={`latency-badge ${cls} latency-fade`} aria-label={`Retrain took ${secs}s`}>
      ↻ {secs}s
    </span>
  );
}
