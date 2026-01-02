import React, { useState, useEffect } from 'react';
import type { User } from '../../types/user';
import { apiService } from '../../services/commonService.ts';
import UserTable from './UserTable.tsx';
import AddUserModal from './AddUserModal.tsx';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);



  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await apiService.getUsers();
      setUsers(userList);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);


  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await apiService.updateUserStatus(userId, !currentStatus);
      await loadUsers(); // Refresh the list to show updated status
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        <button
          className="create-user-button"
          onClick={() => setShowCreateModal(true)}
        >
          Create New User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <UserTable users={users} onToggleStatus={handleToggleStatus} />

      {showCreateModal && (
        <AddUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={loadUsers}
        />
      )}
    </div>
  );
};

export default UserManagement;