import React, { createContext, useContext, useReducer, type ReactNode } from "react";
import type { ColumnInfo, Experiment, TrainResponse, UploadResponse } from "../types";

export type ActiveTab = "upload" | "eda" | "model" | "experiments";

interface AppState {
  fileId: number | null;
  filename: string | null;
  rowCount: number;
  colCount: number;
  columns: ColumnInfo[];
  targetColumn: string | null;
  activeTab: ActiveTab;
  experiments: Experiment[];
  lastTrainResult: TrainResponse | null;
}

type AppAction =
  | { type: "FILE_UPLOADED"; payload: UploadResponse }
  | { type: "FILE_CONFIGURED"; payload: { columns: ColumnInfo[]; targetColumn: string } }
  | { type: "SET_TAB"; payload: ActiveTab }
  | { type: "TRAIN_COMPLETE"; payload: TrainResponse }
  | { type: "EXPERIMENTS_LOADED"; payload: Experiment[] }
  | { type: "RESET" };

const initialState: AppState = {
  fileId: null,
  filename: null,
  rowCount: 0,
  colCount: 0,
  columns: [],
  targetColumn: null,
  activeTab: "upload",
  experiments: [],
  lastTrainResult: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "FILE_UPLOADED":
      return {
        ...state,
        fileId: action.payload.file_id,
        filename: action.payload.filename,
        rowCount: action.payload.row_count,
        colCount: action.payload.col_count,
        columns: action.payload.columns,
        targetColumn: null,
        experiments: [],
        lastTrainResult: null,
      };
    case "FILE_CONFIGURED":
      return {
        ...state,
        columns: action.payload.columns,
        targetColumn: action.payload.targetColumn,
        activeTab: "eda",
      };
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "TRAIN_COMPLETE":
      return { ...state, lastTrainResult: action.payload };
    case "EXPERIMENTS_LOADED":
      return { ...state, experiments: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
