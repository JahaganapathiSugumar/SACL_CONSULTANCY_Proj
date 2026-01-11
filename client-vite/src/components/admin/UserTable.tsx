import React, { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import { getDepartmentName } from '../../utils/dashboardUtils';
import './UserTable.css';
import { IconButton, Checkbox } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

interface UserTableProps {
  users: User[];
  onToggleStatus: (userId: number, currentStatus: boolean) => void;
  onEdit: (user: User) => void;
  selectedUsers?: Set<number>;
  onSelectUser?: (userId: number) => void;
  onSelectAllUsers?: () => void;
}

// Department mapping for filter options (unchanged)
const departmentOptions = [
  { id: 1, name: 'ADMIN' },
  { id: 2, name: 'METHODS' },
  { id: 3, name: 'NPD QC' },
  { id: 4, name: 'SANDPLANT' },
  { id: 5, name: 'FETTLING & VISUAL INSPECTION' },
  { id: 6, name: 'MOULDING' },
  { id: 7, name: 'QUALITY' },
  { id: 8, name: 'MACHINESHOP' },
  { id: 9, name: 'NDT QC' },
  { id: 10, name: 'QA' }
];

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  onToggleStatus, 
  onEdit,
  selectedUsers = new Set(),
  onSelectUser = () => {},
  onSelectAllUsers = () => {}
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  // Get unique roles from users
  const roleOptions = useMemo(() => {
    const roles = [...new Set(users.map(user => user.role))];
    return roles.sort();
  }, [users]);

  // Filter users based on selected filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesDepartment = !departmentFilter ||
        user.department_id?.toString() === departmentFilter;
      return matchesRole && matchesDepartment;
    });
  }, [users, roleFilter, departmentFilter]);

  const clearFilters = () => {
    setRoleFilter('');
    setDepartmentFilter('');
  };

  return (
    <div className="user-table-container">
      {/* Filter Section */}
      <div className="filter-section" style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: 500, fontSize: '14px' }}>Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: '150px',
              cursor: 'pointer'
            }}
          >
            <option value="">All Roles</option>
            {roleOptions.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: 500, fontSize: '14px' }}>Department:</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: '200px',
              cursor: 'pointer'
            }}
          >
            <option value="">All Departments</option>
            {departmentOptions.map(dept => (
              <option key={dept.id} value={dept.id.toString()}>{dept.name}</option>
            ))}
          </select>
        </div>

        {(roleFilter || departmentFilter) && (
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Clear Filters
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
          Showing {filteredUsers.length} of {users.length} users
        </span>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th style={{ width: '50px' }}>
              <Checkbox
                checked={users.length > 0 && selectedUsers.size === users.length}
                indeterminate={selectedUsers.size > 0 && selectedUsers.size < users.length}
                onChange={onSelectAllUsers}
              />
            </th>
            <th>ID</th>
            <th>Username</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.user_id} style={{ backgroundColor: selectedUsers.has(user.user_id) ? '#f0f0f0' : 'transparent' }}>
              <td style={{ width: '50px' }}>
                <Checkbox
                  checked={selectedUsers.has(user.user_id)}
                  onChange={() => onSelectUser(user.user_id)}
                />
              </td>
              <td>{user.user_id}</td>
              <td>{user.username}</td>
              <td>{user.full_name}</td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge role-${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
              </td>
              <td>{getDepartmentName(user.department_id) || 'N/A'}</td>
              <td>
                <button
                  onClick={() => onToggleStatus(user.user_id, !!user.is_active)}
                  className={`status-toggle ${user.is_active ? 'active' : 'inactive'}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: user.is_active ? '#e6f4ea' : '#fce8e6',
                    color: user.is_active ? '#1e7e34' : '#c62828',
                    transition: 'all 0.2s'
                  }}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td style={{ textAlign: 'center' }}>
                <IconButton onClick={() => onEdit(user)} size="small" style={{ color: '#1976d2' }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </td>
            </tr>
          ))}
          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan={9} className="no-data">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
