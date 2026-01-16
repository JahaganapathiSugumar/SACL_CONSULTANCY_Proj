import { type StatItem } from '../data/dashboardData';
import { apiService } from './commonService';

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

    const data = await apiService.request(`/stats/dashboard?${queryParams.toString()}`, {
        method: "GET"
    });

    return data.data?.stats || [];
}

export default { getDashboardStats };
