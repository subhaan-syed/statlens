import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProvider } from "../src/context/AppContext";
import { UploadZone } from "../src/components/upload/UploadZone";
import { ColumnConfigForm } from "../src/components/upload/ColumnConfigForm";
import { MOCK_UPLOAD_RESPONSE } from "./mocks/handlers";

function renderWithProvider(ui: React.ReactElement) {
  return render(<AppProvider>{ui}</AppProvider>);
}

// ── UploadZone tests ────────────────────────────────────────────────────────

describe("UploadZone", () => {
  it("renders the upload zone with drag-drop area", () => {
    renderWithProvider(<UploadZone />);
    expect(screen.getByTestId("upload-zone")).toBeInTheDocument();
    expect(screen.getByText(/drop your csv here/i)).toBeInTheDocument();
  });

  it("shows error message for file larger than 100MB", async () => {
    renderWithProvider(<UploadZone />);
    const input = screen.getByTestId("file-input");

    // Create a fake oversized file (101MB)
    const bigFile = new File(["x"], "big.csv", { type: "text/csv" });
    Object.defineProperty(bigFile, "size", { value: 101 * 1024 * 1024 });

    Object.defineProperty(input, "files", { value: [bigFile], configurable: true });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/exceeds/i);
    });
  });

  it("shows error for non-CSV file", async () => {
    renderWithProvider(<UploadZone />);
    const input = screen.getByTestId("file-input");
    const notCsv = new File(["data"], "data.xlsx", { type: "application/vnd.ms-excel" });

    // Use fireEvent.change to bypass any accept-attribute filtering in userEvent
    Object.defineProperty(input, "files", {
      value: [notCsv],
      configurable: true,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/only csv/i);
    });
  });
});

// ── ColumnConfigForm tests ─────────────────────────────────────────────────

describe("ColumnConfigForm", () => {
  const onConfirm = vi.fn();

  function renderForm() {
    return renderWithProvider(
      <ColumnConfigForm uploadData={MOCK_UPLOAD_RESPONSE} onConfirm={onConfirm} />
    );
  }

  it("renders column list and target selector", () => {
    renderForm();
    expect(screen.getByText(/configure columns/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/which column do you want to predict/i)).toBeInTheDocument();
  });

  it("Proceed button is disabled and shows inline error when no target selected", async () => {
    renderForm();
    const btn = screen.getByTestId("proceed-btn");

    // Click without selecting target
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/please select a target column/i);
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("shows error when datetime column is selected as target", async () => {
    renderForm();

    // Select the datetime column as target
    const select = screen.getByLabelText(/which column do you want to predict/i);
    await userEvent.selectOptions(select, "hire_date");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/must be numeric or categorical/i);
    });
  });

  it("Proceed button succeeds with valid numeric target", async () => {
    renderForm();

    const select = screen.getByLabelText(/which column do you want to predict/i);
    await userEvent.selectOptions(select, "salary");

    const btn = screen.getByTestId("proceed-btn");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: "salary" })]),
        "salary"
      );
    });
  });
});
