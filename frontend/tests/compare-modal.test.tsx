import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompareModal } from "../src/components/experiments/CompareModal";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { MOCK_EXPERIMENTS } from "./mocks/handlers";
import type { Experiment } from "../src/types";

const expA = MOCK_EXPERIMENTS[0] as Experiment; // score 0.89 random_forest
const expB = MOCK_EXPERIMENTS[1] as Experiment; // score 0.76 gradient_boosting

describe("CompareModal", () => {
  it("renders side-by-side columns for both experiments", () => {
    render(<CompareModal expA={expA} expB={expB} onClose={vi.fn()} />);
    // Both model names appear
    expect(screen.getAllByText(/random forest/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/gradient boosting/i).length).toBeGreaterThan(0);
  });

  it("shows scores for both experiments", () => {
    render(<CompareModal expA={expA} expB={expB} onClose={vi.fn()} />);
    // expA score 0.89
    expect(screen.getByText("0.8900")).toBeInTheDocument();
    // expB score 0.76
    expect(screen.getByText("0.7600")).toBeInTheDocument();
  });

  it("shows hyperparameters from both experiments", () => {
    render(<CompareModal expA={expA} expB={expB} onClose={vi.fn()} />);
    // Both experiments have n_estimators — use getAllByText since it appears in both columns
    expect(screen.getAllByText("n_estimators").length).toBeGreaterThanOrEqual(1);
    // Only GB has learning_rate
    expect(screen.getByText("learning_rate")).toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<CompareModal expA={expA} expB={expB} onClose={onClose} />);
    const backdrop = container.querySelector(".modal-backdrop")!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<CompareModal expA={expA} expB={expB} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });

  it("indicates which experiment is better", () => {
    render(<CompareModal expA={expA} expB={expB} onClose={vi.fn()} />);
    // expA (0.89) > expB (0.76)
    expect(screen.getByText(/left is better/i)).toBeInTheDocument();
  });
});

describe("ErrorBoundary", () => {
  it("renders fallback card when a child throws and has a reload button", () => {
    // Silence the console.error from React's error boundary
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    function ThrowingComponent(): React.ReactElement {
      throw new Error("Test render error");
    }

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText("Test render error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try reloading/i })).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
