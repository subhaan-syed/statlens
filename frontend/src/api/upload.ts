import api from "./client";
import type { UploadResponse } from "../types";

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<UploadResponse>("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
