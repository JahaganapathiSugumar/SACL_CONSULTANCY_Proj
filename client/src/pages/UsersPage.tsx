import React, { useState } from 'react';
import Header from '../components/dashboard/Header';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../context/AuthContext';
import { getDepartmentInfo } from '../utils/dashboardUtils';
import ProfileModal from '../components/dashboard/ProfileModal';

const Users: React.FC = () => {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const departmentInfo = getDepartmentInfo(user);

  return (
    <div className="users-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header
        departmentInfo={departmentInfo}
        setShowProfile={setShowProfile}
      />
      <main className="page-content" style={{ flexGrow: 1, overflow: 'auto', padding: '20px' }}>
        <UserManagement />
      </main>
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default Users;