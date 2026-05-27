import api from "./client";
import type {
  CorrelationData,
  FrequencyData,
  HistogramData,
  NullEntry,
  ScatterData,
} from "../types";

export async function getHistograms(fileId: number): Promise<HistogramData[]> {
  const { data } = await api.get<HistogramData[]>(`/api/eda/${fileId}/histograms`);
  return data;
}

export async function getFrequencies(fileId: number): Promise<FrequencyData[]> {
  const { data } = await api.get<FrequencyData[]>(`/api/eda/${fileId}/frequencies`);
  return data;
}

export async function getCorrelation(fileId: number): Promise<CorrelationData> {
  const { data } = await api.get<CorrelationData>(`/api/eda/${fileId}/correlation`);
  return data;
}

export async function getScatter(
  fileId: number,
  xCol: string,
  yCol: string
): Promise<ScatterData> {
  const { data } = await api.get<ScatterData>(`/api/eda/${fileId}/scatter`, {
    params: { x_col: xCol, y_col: yCol },
  });
  return data;
}

export async function getNulls(fileId: number): Promise<NullEntry[]> {
  const { data } = await api.get<NullEntry[]>(`/api/eda/${fileId}/nulls`);
  return data;
}
