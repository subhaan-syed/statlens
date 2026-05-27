import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { server } from "./mocks/server";
import { AppProvider } from "../src/context/AppContext";
import { ModelSelector } from "../src/components/models/ModelSelector";
import { HyperparamPanel } from "../src/components/models/HyperparamPanel";
import { MOCK_TRAIN_RESPONSE } from "./mocks/handlers";

// ── ModelSelector tests ─────────────────────────────────────────────────────

describe("ModelSelector", () => {
  it("renders all 4 model options", () => {
    const onChange = vi.fn();
    render(<ModelSelector value="random_forest" onChange={onChange} />);

    expect(screen.getByText(/random forest/i)).toBeInTheDocument();
    expect(screen.getByText(/gradient boosting/i)).toBeInTheDocument();
    expect(screen.getByText(/k-nearest neighbors/i)).toBeInTheDocument();
    expect(screen.getByText(/linear.*logistic/i)).toBeInTheDocument();
  });

  it("calls onChange when a model is clicked", async () => {
    const onChange = vi.fn();
    render(<ModelSelector value="random_forest" onChange={onChange} />);
    await userEvent.click(screen.getByText(/gradient boosting/i));
    expect(onChange).toHaveBeenCalledWith("gradient_boosting");
  });

  it("marks the selected model with aria-pressed=true", () => {
    render(<ModelSelector value="knn" onChange={vi.fn()} />);
    const knnBtn = screen.getByRole("button", { pressed: true });
    expect(knnBtn).toHaveAttribute("data-model", "knn");
  });
});

// ── HyperparamPanel slider tests ────────────────────────────────────────────

describe("HyperparamPanel", () => {
  it("renders sliders for Random Forest", () => {
    render(<HyperparamPanel modelType="random_forest" onCommit={vi.fn()} />);
    expect(screen.getByLabelText(/n_estimators|trees/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max depth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/min samples/i)).toBeInTheDocument();
  });

  it("fires onCommit only on mouseup, not on each change event", async () => {
    const onCommit = vi.fn();
    render(<HyperparamPanel modelType="random_forest" onCommit={onCommit} />);

    // Initial commit fires on mount (useEffect)
    const initialCallCount = onCommit.mock.calls.length;

    const slider = screen.getByLabelText(/trees|n_estimators/i);

    // Fire 5 onChange events (simulates dragging)
    for (let i = 0; i < 5; i++) {
      fireEvent.change(slider, { target: { value: String(100 + i * 10) } });
    }

    // Should NOT trigger additional commits yet
    expect(onCommit.mock.calls.length).toBe(initialCallCount);

    // Fire mouseup (commit)
    fireEvent.mouseUp(slider, { currentTarget: slider });

    // Now exactly one new commit
    expect(onCommit.mock.calls.length).toBe(initialCallCount + 1);
  });

  it("renders toggle buttons for KNN weights", () => {
    render(<HyperparamPanel modelType="knn" onCommit={vi.fn()} />);
    expect(screen.getByText("uniform")).toBeInTheDocument();
    expect(screen.getByText("distance")).toBeInTheDocument();
  });
});

// ── Score display after train ────────────────────────────────────────────────

describe("ModelResults score display", () => {
  it("displays R² score after regression train response", async () => {
    // Use the ModelResults component directly
    const { ModelResults } = await import("../src/components/models/ModelResults");
    render(
      <ModelResults
        result={{
          ...MOCK_TRAIN_RESPONSE,
          metric_name: "r2",
          score: 0.89,
          task_type: "regression",
        }}
        dimmed={false}
        latencyMs={null}
      />
    );

    // R² score displayed
    const scoreEl = screen.getByTestId("score-value");
    expect(scoreEl).toHaveTextContent("0.8900");
    expect(screen.getByText(/R²/i)).toBeInTheDocument();
  });
});

// ── Optimistic UI: dimming + retraining badge ───────────────────────────────

describe("Optimistic retraining UI", () => {
  it("shows RetrainingBadge when retraining prop is true", async () => {
    const { RetrainingBadge } = await import("../src/components/models/TrainingStatus");
    render(<RetrainingBadge show={true} />);
    expect(screen.getByText(/retraining/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("hides RetrainingBadge when show is false", async () => {
    const { RetrainingBadge } = await import("../src/components/models/TrainingStatus");
    render(<RetrainingBadge show={false} />);
    expect(screen.queryByText(/retraining/i)).not.toBeInTheDocument();
  });

  it("shows LatencyBadge with correct class after train completes", async () => {
    const { LatencyBadge } = await import("../src/components/models/TrainingStatus");
    const { rerender } = render(<LatencyBadge latencyMs={null} />);
    expect(screen.queryByLabelText(/retrain took/i)).not.toBeInTheDocument();

    rerender(<LatencyBadge latencyMs={1200} />);
    await waitFor(() => {
      expect(screen.getByLabelText(/retrain took 1.2s/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/retrain took/i)).toHaveClass("latency-fast");
  });

  it("ModelResults dims when dimmed prop is true", async () => {
    const { ModelResults } = await import("../src/components/models/ModelResults");
    const { container } = render(
      <ModelResults
        result={{ ...MOCK_TRAIN_RESPONSE, task_type: "regression" }}
        dimmed={true}
        latencyMs={null}
      />
    );
    const wrapper = container.querySelector(".dimmed");
    expect(wrapper).toBeInTheDocument();
  });
});
