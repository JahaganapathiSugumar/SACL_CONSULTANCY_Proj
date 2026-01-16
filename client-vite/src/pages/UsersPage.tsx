import React from 'react';
import Header from '../components/common/Header';
import UserManagement from '../components/admin/UserManagement';

const Users: React.FC = () => {
  return (
    <div className="users-page">
      <Header />
      <main className="page-content">
        <UserManagement />
      </main>
    </div>
  );
};

export default Users;