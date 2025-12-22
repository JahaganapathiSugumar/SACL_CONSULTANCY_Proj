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
    return (
        <>
            <style>
                {`
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .stat-card {
                        background-color: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        text-align: center;
                        transition: transform 0.2s, box-shadow 0.2s;
                    }
                    .stat-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                    }
                    .stat-value {
                        font-size: 28px;
                        font-weight: bold;
                        color: #333;
                        margin-bottom: 5px;
                    }
                    .stat-label {
                        font-size: 14px;
                        color: #666;
                        font-weight: 600;
                        margin-bottom: 5px;
                    }
                    .stat-description {
                        font-size: 12px;
                        color: #999;
                    }
                    @media (max-width: 768px) {
                        .stats-grid {
                            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                            gap: 15px;
                        }
                        .stat-card {
                            padding: 15px;
                        }
                        .stat-value {
                            font-size: 24px;
                        }
                        .stat-label {
                            font-size: 13px;
                        }
                    }
                    @media (max-width: 480px) {
                        .stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 10px;
                        }
                        .stat-card {
                            padding: 12px;
                        }
                        .stat-value {
                            font-size: 20px;
                        }
                        .stat-label {
                            font-size: 12px;
                        }
                    }
                `}
            </style>
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="stat-card"
                        style={{ borderLeft: `4px solid ${stat.color}` }}
                    >
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                        {stat.description && (
                            <div className="stat-description">{stat.description}</div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
};

export default StatsGrid;
