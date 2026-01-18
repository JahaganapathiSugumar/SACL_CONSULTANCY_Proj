import React from 'react';

interface StatItem {
    label: string;
    value: string;
    color: string;
    description?: string;
}

interface StatsGridProps {
    stats: StatItem[];
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {

    const getBorderColor = (label: string): string => {
        const l = label.toLowerCase();
        if (l.includes('total')) return '#E67E22';
        if (l.includes('ongoing')) return '#3498DB';
        if (l.includes('approved')) return '#2ECC71';
        return '#95A5A6';
    };

    return (
        <>
            <style>
                {`
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 16px;
                        margin-bottom: 24px;
                    }
                    .stat-card {
                        background-color: white;
                        padding: 16px;
                        border-radius: 6px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        text-align: center;
                        transition: transform 0.2s, box-shadow 0.2s;
                        border-left-width: 4px;
                        border-left-style: solid;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100px;
                    }
                    .stat-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .stat-label {
                        font-size: 13px;
                        color: #555;
                        font-weight: 600;
                        margin-bottom: 4px;
                        text-transform: capitalize;
                    }
                    .stat-value {
                        font-size: 24px;
                        font-weight: 700;
                        color: #333;
                    }
                                        
                `}
            </style>
            <div className="stats-grid">
                {stats.map((stat, index) => {
                    const borderColor = getBorderColor(stat.label);

                    return (
                        <div
                            key={index}
                            className="stat-card"
                            style={{ borderLeftColor: borderColor }}
                        >
                            <div className="stat-label">{stat.label}</div>
                            <div className="stat-value">{stat.value}</div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default StatsGrid;
