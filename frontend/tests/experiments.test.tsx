import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExperimentTable } from "../src/components/experiments/ExperimentTable";
import { MOCK_EXPERIMENTS } from "./mocks/handlers";
import type { Experiment } from "../src/types";

const experiments = MOCK_EXPERIMENTS as Experiment[];

describe("ExperimentTable", () => {
  it("renders all experiment rows", () => {
    render(
      <ExperimentTable
        experiments={experiments}
        selectedIds={new Set()}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getAllByRole("row")).toHaveLength(experiments.length + 1); // +1 header
  });

  it("highlights the best-scoring row with class 'best-run'", () => {
    const { container } = render(
      <ExperimentTable
        experiments={experiments}
        selectedIds={new Set()}
        onToggle={vi.fn()}
      />
    );
    // best run is id=1 with score=0.89
    const bestRow = container.querySelector("tr.best-run");
    expect(bestRow).toBeInTheDocument();
    expect(bestRow?.getAttribute("data-experiment-id")).toBe("1");
  });

  it("renders empty state when no experiments", () => {
    render(
      <ExperimentTable
        experiments={[]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText(/no experiments yet/i)).toBeInTheDocument();
  });

  it("toggles selection state on checkbox click", () => {
    const onToggle = vi.fn();
    render(
      <ExperimentTable
        experiments={experiments}
        selectedIds={new Set()}
        onToggle={onToggle}
      />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onToggle).toHaveBeenCalledWith(experiments[0].id);
  });

  it("Compare button is disabled until 2 rows are selected", () => {
    // Render the ExperimentTab which contains the compare button
    const { rerender } = render(
      <ExperimentTable
        experiments={experiments}
        selectedIds={new Set()}
        onToggle={vi.fn()}
      />
    );
    // (Compare button is in ExperimentTab, not ExperimentTable — test it via ExperimentTab)
  });
});

// Compare button state test (in ExperimentTab)
describe("ExperimentTab — compare button", () => {
  it("Compare button is disabled with 0 or 1 selections, enabled at 2", async () => {
    const { AppProvider, useAppContext } = await import("../src/context/AppContext");
    const { ExperimentTab } = await import("../src/components/experiments/ExperimentTab");
    const { MOCK_EXPERIMENTS } = await import("./mocks/handlers");

    // Seed with a real fileId so ExperimentTab loads experiments from MSW
    function Seeder({ children }: { children: React.ReactNode }) {
      const { dispatch } = useAppContext();
      // Seed fileId on first render
      import("react").then(({ useEffect }) => {});
      return (
        <>
          <button
            data-testid="seed-btn"
            style={{ display: "none" }}
            onClick={() => {
              dispatch({ type: "FILE_UPLOADED", payload: {
                file_id: 1, filename: "test.csv", row_count: 200,
                col_count: 8, preview: [], columns: [],
              } as any });
              dispatch({ type: "FILE_CONFIGURED", payload: { columns: [], targetColumn: "salary" } });
              dispatch({ type: "EXPERIMENTS_LOADED", payload: MOCK_EXPERIMENTS as any });
            }}
          />
          {children}
        </>
      );
    }

    const { rerender } = render(
      <AppProvider>
        <Seeder>
          <ExperimentTab />
        </Seeder>
      </AppProvider>
    );

    // Trigger seeding
    fireEvent.click(screen.getByTestId("seed-btn"));

    // Wait for experiments to load
    await new Promise((r) => setTimeout(r, 50));

    const compareBtn = screen.getByTestId("compare-btn");
    expect(compareBtn).toBeDisabled();

    // Select one checkbox
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(compareBtn).toBeDisabled();

    // Select a second checkbox
    fireEvent.click(checkboxes[1]);
    expect(compareBtn).not.toBeDisabled();
  });
});
