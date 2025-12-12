export interface ProgressItem {
  progress_id: number;
  trial_id: number;
  department_id: number;
  username: string;
  completed_at?: string | null;
  approval_status?: string | null;
  remarks?: string | null;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:3000/api";

async function handleResponse(res: Response) {
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
  if (!res.ok) {
    const msg = json?.message || res.statusText || "API error";
    throw new Error(msg);
  }
  return json;
}

export async function getProgress(username: string): Promise<ProgressItem[]> {
  const url = `${API_BASE}/department-progress/get-progress?username=${encodeURIComponent(username || "")}`;
  const res = await fetch(url, { method: "GET", credentials: "include" });
  const json = await handleResponse(res);
  return Array.isArray(json.data) ? json.data as ProgressItem[] : [];
}

export async function updateProgress(progressId: number | string, payload: any) {
  const url = `${API_BASE}/department-progress/update/${encodeURIComponent(String(progressId))}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export default { getProgress, updateProgress };