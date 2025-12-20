import { type StatItem } from '../data/dashboardData';

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

export interface DashboardStatsParams {
    role: string;
    username: string;
    department_id?: number;
    statsType?: 'admin_trials' | 'methods_dashboard';
}

export async function getDashboardStats(params: DashboardStatsParams): Promise<StatItem[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('role', params.role);
    queryParams.append('username', params.username);
    if (params.department_id) {
        queryParams.append('department_id', params.department_id.toString());
    }
    if (params.statsType) {
        queryParams.append('statsType', params.statsType);
    }

    const url = `${API_BASE}/stats/dashboard?${queryParams.toString()}`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('authToken') || ''
        },
        credentials: "include"
    });

    const json = await handleResponse(res);
    return json.data?.stats || [];
}

export default { getDashboardStats };
