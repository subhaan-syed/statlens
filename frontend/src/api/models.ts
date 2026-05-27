import api from "./client";
import type { Experiment, TrainRequest, TrainResponse } from "../types";

export async function trainModel(req: TrainRequest): Promise<TrainResponse> {
  const { data } = await api.post<TrainResponse>("/api/train", req);
  return data;
}

export async function getExperiments(fileId: number): Promise<Experiment[]> {
  const { data } = await api.get<Experiment[]>("/api/experiments", {
    params: { file_id: fileId },
  });
  return data;
}
