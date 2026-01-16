import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import ProfileModal from '../components/dashboard/ProfileModal';
import StatsGrid from '../components/dashboard/StatsGrid';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import { getDepartmentInfo, getPendingRoute } from '../utils/dashboardUtils';
import { type StatItem } from '../data/dashboardData';
import PendingSampleCards from '../components/dashboard/PendingTrialsModal';
import CompletedTrialsModal from '../components/dashboard/CompletedTrialsModal';
import { getDashboardStats } from '../services/statsService';
import { CircularProgress } from '@mui/material';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
  const [showPendingCards, setShowPendingCards] = useState(false);
  const [showCompletedTrials, setShowCompletedTrials] = useState(false);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();

  const departmentInfo = getDepartmentInfo(user);

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.username && user?.role) {
        try {
          setLoadingStats(true);
          const statsData = await getDashboardStats({
            role: user.role,
            username: user.username,
            department_id: user.department_id
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

  const handlePendingClick = () => {
    setShowPendingCards(true);
  };

  const handlePendingCardSelect = (card: any) => {
    setShowPendingCards(false);
    const route = getPendingRoute(card.department_id);
    navigate(`${route}?trial_id=${card.trial_id}`);
  };

  const handleViewTrials = () => {
    navigate('/trials');
  };

  return (
    <div className="dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Header
        setShowProfile={setShowProfile}
        departmentInfo={departmentInfo}
        photoRefreshKey={headerRefreshKey}
      />
      <main className="dashboard-content" style={{ padding: '20px' }}>
        <div className="welcome-section">
          <WelcomeSection
            title="User Dashboard"
            description={`Welcome back, ${user?.username}! Manage your tasks and activities.`}
          >
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-pending-cards"
                onClick={() => handlePendingClick()}
                style={{
                  backgroundColor: '#ffc107',
                  color: '#333',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0ac06')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffc107')}
              >
                ⏳ Pending Cards
              </button>
              <button
                className="btn-completed-trials"
                onClick={() => setShowCompletedTrials(true)}
                style={{
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
              >
                ✅ Completed Trials
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

          {/* User Specific Stats Grid */}
          {loadingStats ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <CircularProgress />
            </div>
          ) : (
            <StatsGrid stats={stats} />
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onPhotoUpdate={() => setHeaderRefreshKey(prev => prev + 1)}
        />
      )}

      {/* Pending Cards Overlay */}
      <PendingSampleCards
        open={showPendingCards}
        onClose={() => setShowPendingCards(false)}
        username={user?.username || ""}
        onCardSelect={handlePendingCardSelect}
      />

      {/* Completed Trials Modal */}
      <CompletedTrialsModal
        open={showCompletedTrials}
        onClose={() => setShowCompletedTrials(false)}
        username={user?.username || ""}
      />
    </div>
  );
};

export default UserDashboard;
