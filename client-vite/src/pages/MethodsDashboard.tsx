import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import NotificationModal from '../components/dashboard/NotificationModal';
import ProfileModal from '../components/dashboard/ProfileModal';
import StatsGrid from '../components/dashboard/StatsGrid';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import { getDepartmentInfo } from '../utils/dashboardUtils';
import { type StatItem } from '../data/dashboardData';
import { getDashboardStats } from '../services/statsService';
import { CircularProgress } from '@mui/material';

const MethodsDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const handleViewTrials = () => {
    navigate('/trials');
  };

  const departmentInfo = getDepartmentInfo(user);

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.username && user?.role) {
        try {
          setLoadingStats(true);
          const statsData = await getDashboardStats({
            role: user.role,
            username: user.username,
            department_id: user.department_id,
            statsType: 'methods_dashboard'
          });
          setStats(statsData);
        } catch (error) {
          console.error('Error fetching stats:', error);
        } finally {
          setLoadingStats(false);
        }
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Header
        setShowNotifications={setShowNotifications}
        setShowProfile={setShowProfile}
        departmentInfo={departmentInfo}
        photoRefreshKey={headerRefreshKey}
      />
      <main className="dashboard-content" style={{ padding: '20px' }}>
        <div className="welcome-section">
          <WelcomeSection
            title="Methods Dashboard"
            description={`Welcome back, ${user?.username}! Manage methodologies and processes.`}
          >
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn-view-users"
                onClick={() => navigate('/foundry-sample-card')}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
              >
                📋 Initiate Card
              </button>
              <button
                className="btn-view-history"
                onClick={() => navigate('/trials')}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
              >
                📜 View History
              </button>
              {(user?.department_id === 2 || user?.department_id === 3) && (
                <button
                  className="btn-view-trials"
                  onClick={handleViewTrials}
                  style={{
                    backgroundImage: 'none',
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '14px',
                    marginLeft: '10px',
                    transition: 'background-color 0.2s',
                    boxShadow: '0 2px 4px rgba(111, 66, 193, 0.2)'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#59359a')}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#6f42c1')}
                >
                  View All Trials
                </button>
              )}
            </div>
          </WelcomeSection>

          {/* Methods Specific Stats Grid */}
          <div style={{ marginBottom: '30px' }}>

            {loadingStats ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <CircularProgress />
              </div>
            ) : (
              <StatsGrid stats={stats} />
            )}
          </div>
        </div>
      </main>

      {/* Notification Modal */}
      {showNotifications && <NotificationModal onClose={() => setShowNotifications(false)} />}

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onPhotoUpdate={() => setHeaderRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  );
};

export default MethodsDashboard;
