import React, { useState, useEffect } from 'react';
import type { User } from '../../types/user';
import { apiService } from '../../services/commonService';
import UserTable from './UserTable';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import LoadingState from '../common/LoadingState';
import './UserManagement.css';
import Swal from 'sweetalert2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Box, Typography, useMediaQuery, Button } from '@mui/material';
import { appTheme } from '../../theme/appTheme';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await apiService.getUsers();
      setUsers(userList);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to load users',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
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
      await loadUsers();
      Swal.fire({
        title: 'Success',
        text: `Successfully ${currentStatus ? 'activated' : 'deactivated'} user.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to update user status',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSelectUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.user_id)));
    }
  };

  const handleBulkStatusChange = async (status: boolean) => {
    try {
      const selectedIds = Array.from(selectedUsers);
      for (const userId of selectedIds) {
        await apiService.updateUserStatus(userId, status);
      }
      await loadUsers();
      setSelectedUsers(new Set());
      Swal.fire({
        title: 'Success',
        text: `Successfully ${status ? 'activated' : 'deactivated'} ${selectedIds.length} users.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      Swal.fire({
        title: 'Error',
        text: err.message || `Failed to update user status`,
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${selectedUsers.size} user(s). This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete them!'
    });

    if (result.isConfirmed) {
      try {
        const selectedIds = Array.from(selectedUsers);
        for (const userId of selectedIds) {
          await apiService.deleteUser(userId);
        }
        await loadUsers();
        setSelectedUsers(new Set());
        Swal.fire(
          'Deleted!',
          'Users have been deleted.',
          'success'
        );
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        Swal.fire({
          title: 'Error',
          text: err.message || 'Failed to delete users',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  const isMobile = useMediaQuery(appTheme.breakpoints.down('sm'));

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          color="success"
          onClick={() => setShowCreateModal(true)}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          Create New User
        </Button>
      </Box>

      {selectedUsers.size > 0 && (
        <Box sx={{
          display: 'flex',
          gap: 1.5,
          mb: 2,
          p: 2,
          backgroundColor: '#f8fafc',
          borderRadius: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
          border: '1px solid #e2e8f0',
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Typography variant="body2" fontWeight={600} sx={{ mr: { sm: 1 }, width: { xs: '100%', sm: 'auto' } }}>
            {selectedUsers.size} user(s) selected
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={() => handleBulkStatusChange(true)}
              startIcon={<CheckCircleIcon />}
              sx={{ textTransform: 'none', borderRadius: 1.5, flex: { xs: 1, sm: 'none' } }}
            >
              Activate
            </Button>
            <Button
              size="small"
              variant="contained"
              color="warning"
              onClick={() => handleBulkStatusChange(false)}
              startIcon={<CancelIcon />}
              sx={{ textTransform: 'none', borderRadius: 1.5, color: 'white', flex: { xs: 1, sm: 'none' } }}
            >
              Deactivate
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={handleBulkDelete}
              sx={{ textTransform: 'none', borderRadius: 1.5, flex: { xs: 1, sm: 'none' } }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      )}

      <UserTable
        users={users}
        onToggleStatus={handleToggleStatus}
        onEdit={handleEdit}
        selectedUsers={selectedUsers}
        onSelectUser={handleSelectUser}
        onSelectAllUsers={handleSelectAllUsers}
      />

      {showCreateModal && (
        <AddUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={loadUsers}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUserUpdated={loadUsers}
          user={selectedUser}
        />
      )}
    </Box>
  );
};

export default UserManagement;
