import api from "./client";

export async function downloadReport(fileId: number): Promise<void> {
  const response = await api.get(`/api/export/${fileId}`, {
    responseType: "blob",
  });

  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `statlens_report_${fileId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
