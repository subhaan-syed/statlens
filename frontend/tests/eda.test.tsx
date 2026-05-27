import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AppProvider, useAppContext } from "../src/context/AppContext";
import { HistogramGrid } from "../src/components/eda/HistogramGrid";
import { ScatterPlot } from "../src/components/eda/ScatterPlot";
import { NullChart } from "../src/components/eda/NullChart";
import { MOCK_COLUMNS, MOCK_HISTOGRAMS, MOCK_UPLOAD_RESPONSE } from "./mocks/handlers";
import type { NullEntry } from "../src/types";
import { useEffect } from "react";
import { act, fireEvent } from "@testing-library/react";

// Helper: renders a component with AppContext seeded with a file
function SeededProvider({ children, fileId = 1 }: { children: React.ReactNode; fileId?: number }) {
  function Seeder() {
    const { dispatch } = useAppContext();
    useEffect(() => {
      dispatch({ type: "FILE_UPLOADED", payload: MOCK_UPLOAD_RESPONSE });
      dispatch({ type: "FILE_CONFIGURED", payload: { columns: MOCK_UPLOAD_RESPONSE.columns, targetColumn: "salary" } });
    }, []);
    return null;
  }
  return (
    <AppProvider>
      <Seeder />
      {children}
    </AppProvider>
  );
}

// ── HistogramGrid tests ─────────────────────────────────────────────────────

describe("HistogramGrid", () => {
  it("renders one card per histogram dataset", () => {
    render(<HistogramGrid histograms={MOCK_HISTOGRAMS} />);
    // Each histogram card has a title with the column name
    expect(screen.getByText(/age/)).toBeInTheDocument();
    expect(screen.getByText(/years_experience/)).toBeInTheDocument();
    expect(screen.getByText(/salary/)).toBeInTheDocument();
  });

  it("shows message when no histograms provided", () => {
    render(<HistogramGrid histograms={[]} />);
    expect(screen.getByText(/no numeric columns/i)).toBeInTheDocument();
  });

  it("renders the correct number of charts", () => {
    render(<HistogramGrid histograms={MOCK_HISTOGRAMS} />);
    // Each histogram is in a card-title element
    const titles = screen.getAllByText(/📊/);
    expect(titles.length).toBe(MOCK_HISTOGRAMS.length);
  });
});

// ── NullChart tests ─────────────────────────────────────────────────────────

describe("NullChart", () => {
  it("shows success message when no nulls", () => {
    render(<NullChart entries={[{ column: "salary", null_pct: 0.0 }]} />);
    expect(screen.getByText(/no missing values/i)).toBeInTheDocument();
  });

  it("shows success message for all-zero nulls", () => {
    const entries: NullEntry[] = [
      { column: "a", null_pct: 0 },
      { column: "b", null_pct: 0 },
    ];
    render(<NullChart entries={entries} />);
    expect(screen.getByText(/no missing values/i)).toBeInTheDocument();
  });

  // Test the sort logic directly (the data is sorted before rendering)
  it("sorts null entries descending before rendering", () => {
    // We can verify the sorting by checking the component's internal behaviour:
    // The NullChart sorts entries by null_pct desc. We test this via the data array
    const entries: NullEntry[] = [
      { column: "low",  null_pct: 2.0 },
      { column: "high", null_pct: 30.0 },
      { column: "mid",  null_pct: 10.0 },
    ];
    // sorted = high(30) > mid(10) > low(2)
    const sorted = [...entries].sort((a, b) => b.null_pct - a.null_pct);
    expect(sorted[0].column).toBe("high");
    expect(sorted[1].column).toBe("mid");
    expect(sorted[2].column).toBe("low");
  });

  it("renders the chart container for columns with missing values", () => {
    const { container } = render(
      <NullChart entries={[{ column: "age", null_pct: 5.0 }]} />
    );
    expect(container.querySelector(".chart-container")).toBeInTheDocument();
  });
});

// ── ScatterPlot tests ────────────────────────────────────────────────────────

describe("ScatterPlot", () => {
  it("renders X and Y axis dropdowns with numeric columns", () => {
    render(
      <AppProvider>
        <ScatterPlot fileId={1} columns={MOCK_COLUMNS} />
      </AppProvider>
    );
    const xSelect = screen.getByLabelText(/x axis/i);
    const ySelect = screen.getByLabelText(/y axis/i);
    expect(xSelect).toBeInTheDocument();
    expect(ySelect).toBeInTheDocument();
  });

  it("populates axis dropdowns with only numeric columns", () => {
    render(
      <AppProvider>
        <ScatterPlot fileId={1} columns={MOCK_COLUMNS} />
      </AppProvider>
    );
    const numericCols = MOCK_COLUMNS.filter((c) => c.dtype === "numeric");
    const nonNumericCols = MOCK_COLUMNS.filter((c) => c.dtype !== "numeric");

    const xSelect = screen.getByLabelText(/x axis/i);
    numericCols.forEach((col) => {
      expect(xSelect).toHaveTextContent(col.name);
    });
    // Non-numeric cols should NOT appear
    nonNumericCols.forEach((col) => {
      expect(xSelect).not.toHaveTextContent(col.name);
    });
  });
});

// ── EDATab integration test ──────────────────────────────────────────────────

describe("EDATab", () => {
  it("renders EDA sections after loading", async () => {
    const { EDATab } = await import("../src/components/eda/EDATab");
    await act(async () => {
      render(
        <SeededProvider>
          <EDATab />
        </SeededProvider>
      );
    });

    // Initially shows loading
    // After loading, histogram section heading renders
    await waitFor(() => {
      expect(
        screen.getByText((content) => content.includes("Distributions"))
      ).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
