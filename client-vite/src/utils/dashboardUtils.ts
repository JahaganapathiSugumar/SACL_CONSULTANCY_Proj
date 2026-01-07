export const getDepartmentName = (departmentId: number | string | undefined): string | null => {
    if (!departmentId) return null;
    const id = typeof departmentId === 'string' ? parseInt(departmentId, 10) : departmentId;

    const departmentMap: Record<number, string> = {
        1: 'ADMIN',
        2: 'NPD METHODS',
        3: 'NPD QC',
        4: 'SANDPLANT',
        5: 'FETTLING & VISUAL INSPECTION',
        6: 'MOULDING',
        7: 'PROCESS CONTROL(QC)',
        8: 'MACHINESHOP',
        9: 'METALLURGICAL INSPECTION(QC)',
        10: 'QA',
        11: 'CUSTOMER'
    };

    return departmentMap[id] || null;
};

export const getDepartmentInfo = (user: any) => {
    if (user?.role === 'Admin') {
        return { displayText: user.role, showDepartment: false };
    } else {
        const department = user?.department_name ||
            user?.department ||
            getDepartmentName(user?.department_id);

        return {
            displayText: department || 'Operations',
            showDepartment: true
        };
    }
};

export const getPendingRoute = (departmentId: number | undefined): string => {
    if (!departmentId) return '/dashboard';

    const departmentRoutes: Record<number, string> = {
        10: '/dimensional-inspection',
        9: '/metallurgical-inspection',
        8: '/mc-shop',
        6: '/moulding',
        7: '/pouring',
        3: '/material-correction',
        4: '/sand',
        5: '/visual-inspection',
        2: '/foundry-sample-card'
    };

    return departmentRoutes[departmentId] || '/dashboard';
};