import React from 'react';
import Header from '../components/common/Header';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <Header />
      <main className="dashboard-content">
        <div className="welcome-section">
          <h2>Dashboard</h2>
          <p>Welcome back, {user?.username}!</p>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Quick Actions</h3>
              <p>Manage users and view reports</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;