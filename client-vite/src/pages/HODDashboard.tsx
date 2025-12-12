import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../context/AuthContext';

// Define types for the stats and actions
interface StatItem {
  label: string;
  value: string;
  color: string;
  description: string;
}

interface ActionItem {
  icon: string;
  title: string;
  description: string;
}

const HODDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handlePendingClick = () => {
    const departmentIdRaw = user?.department_id;
    const departmentId = typeof departmentIdRaw === 'string' ? Number(departmentIdRaw) : departmentIdRaw;

    const departmentRoutes: Record<number, string> = {
      10: '/dimensional-inspection',
      7: '/metallurgical-inspection',
      8: '/machine-shop',
      6: '/moulding',
      9: '/pouring-details',
      4: '/sand',
      5: '/visual-inspection',
    };

    if (departmentId && departmentRoutes[departmentId]) {
      navigate(departmentRoutes[departmentId]);
      return;
    }

    navigate('/dashboard');
  };

  // Function to get department name based on user role
  const getDepartmentInfo = () => {
    if (user?.role === 'Admin' || user?.role === 'Methods') {
      return { displayText: user.role, showDepartment: false };
    } else {
      // Use the actual department name from your table
      const department = user?.department_name ||
        user?.department ||
        getDepartmentName(user?.department_id);

      return {
        displayText: department || 'Operations', // Just show the department name, no "Department" suffix
        showDepartment: true
      };
    }
  };

  // Helper function to map department_id to department_name
  const getDepartmentName = (departmentId: number | string) => {
    const departmentMap = {
      1: 'ADMIN',
      2: 'NPD METHODS',
      3: 'NPD QC',
      4: 'SANDPLANT',
      5: 'FETTLING & VISUAL INSPECTION',
      6: 'MOULDING',
      7: 'QUALITY',
      8: 'MACHINESHOP',
      9: 'NDT QC',
      10: 'QA',
      11: 'CUSTOMER'
    };

    return departmentMap[departmentId as keyof typeof departmentMap] || null;
  };

  const departmentInfo = getDepartmentInfo();

  // Get role-specific stats
  const getStats = (): StatItem[] => {
    if (user?.role === 'Admin') {
      return [
        { label: 'Total Users', value: '156', color: '#007bff', description: 'System users' },
        { label: 'Active Sessions', value: '42', color: '#28a745', description: 'Currently online' },
        { label: 'System Health', value: '98%', color: '#20c997', description: 'Uptime status' },
        { label: 'Pending Tasks', value: '8', color: '#ffc107', description: 'Awaiting action' }
      ];
    } else if (user?.role === 'Methods') {
      return [
        { label: 'Process Reviews', value: '23', color: '#007bff', description: 'Pending reviews' },
        { label: 'Efficiency Score', value: '87%', color: '#28a745', description: 'Current rating' },
        { label: 'Optimizations', value: '15', color: '#20c997', description: 'This month' },
        { label: 'Team Members', value: '12', color: '#6f42c1', description: 'Methods team' }
      ];
    } else {
      return [
        { label: 'Department Ideas', value: '47', color: '#007bff', description: 'Total ideas submitted' },
        { label: 'Pending Review', value: '12', color: '#ffc107', description: 'Awaiting approval' },
        { label: 'Approved', value: '28', color: '#28a745', description: 'Implemented ideas' },
        { label: 'Team Members', value: '15', color: '#6f42c1', description: 'Active department members' }
      ];
    }
  };

  // Get role-specific actions
  const getActions = (): ActionItem[] => {
    if (user?.role === 'Admin') {
      return [
        { icon: '👥', title: 'User Management', description: 'Manage all system users and permissions' },
        { icon: '📊', title: 'System Reports', description: 'View comprehensive system analytics' },
        { icon: '⚙️', title: 'System Settings', description: 'Configure system-wide settings' }
      ];
    } else if (user?.role === 'Methods') {
      return [
        { icon: '📋', title: 'Process Review', description: 'Review and optimize methods' },
        { icon: '📈', title: 'Efficiency Metrics', description: 'Analyze process performance' },
        { icon: '🔄', title: 'Workflow Optimization', description: 'Improve existing workflows' }
      ];
    } else {
      return [
        { icon: '📊', title: 'Department Reports', description: 'Generate department performance reports' },
        { icon: '👥', title: 'Team Management', description: 'Manage team members and roles' },
        { icon: '💡', title: 'Idea Review', description: 'Review and approve team ideas' }
      ];
    }
  };

  const stats = getStats();
  const actions = getActions();

  const CustomHeader = () => (
    <header style={{
      backgroundColor: 'white',
      padding: '15px 30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #e0e0e0'
    }}>
      {/* Left side - Logo/Brand and Department Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
          letterSpacing: '1px'
        }}>
          SAKTHI AUTO COMPONENTS LTD
        </div>

        {/* Department and Role Info */}
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              padding: '4px 8px',
              backgroundColor: '#007bff',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {user?.role?.toUpperCase() || 'USER'}
            </span>
            {departmentInfo.showDepartment && (
              <>
                <span style={{ color: '#666' }}>|</span>
                <span style={{ color: '#555' }}>{departmentInfo.displayText}</span>
              </>
            )}
            {!departmentInfo.showDepartment && (
              <span style={{ color: '#555' }}>{departmentInfo.displayText}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Icons and Profile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Notification Icon */}
        <div
          style={{
            position: 'relative',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={() => setShowNotifications(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <div style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            width: '8px',
            height: '8px',
            backgroundColor: '#ff4444',
            borderRadius: '50%'
          }}></div>
        </div>

        {/* Profile Section */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#007bff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                {user?.username || 'User'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>
                {user?.role || 'User Role'}
                {user?.department && user.role !== 'Admin' && user.role !== 'Methods' && (
                  <span> • {user.department.replace(/\s*Department\s*$/i, '')}</span>
                )}
              </div>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '200px',
              zIndex: 1000,
              marginTop: '5px'
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  {user?.username}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                  {user?.role}
                  {user?.department && user.role !== 'Admin' && user.role !== 'Methods' && (
                    <span> • {user.department.replace(/\s*Department\s*$/i, '')}</span>
                  )}
                </div>
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#333',
                  transition: 'background-color 0.2s'
                }}
                onClick={logout}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                🚪 Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  // Notification Modal Component
  const NotificationModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }} onClick={() => setShowNotifications(false)}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: '15px'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>Notifications</h3>
          <button
            onClick={() => setShowNotifications(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Notification Content */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fbff',
            borderRadius: '6px',
            borderLeft: '3px solid #007bff',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: '600', color: '#333' }}>New Department Idea</div>
            <div style={{ fontSize: '14px', color: '#666' }}>A team member submitted a new idea for review</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>10 min ago</div>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: '#f0f9f0',
            borderRadius: '6px',
            borderLeft: '3px solid #28a745',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: '600', color: '#333' }}>Idea Approved</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Your department idea has been approved by management</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>2 hours ago</div>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: '#fffbf0',
            borderRadius: '6px',
            borderLeft: '3px solid #ffc107',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: '600', color: '#333' }}>Review Required</div>
            <div style={{ fontSize: '14px', color: '#666' }}>5 ideas are pending your department review</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>1 day ago</div>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: '#fff5f5',
            borderRadius: '6px',
            borderLeft: '3px solid #dc3545',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: '600', color: '#333' }}>Budget Update</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Department budget needs to be reviewed and approved</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>2 days ago</div>
          </div>
        </div>

        <button
          onClick={() => setShowNotifications(false)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#545b62'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <CustomHeader />
      <main className="dashboard-content" style={{ padding: '20px' }}>
        {showUserDetails ? (
          <UserManagement />
        ) : (
          <div className="welcome-section">
            {/* Header Section */}
            <div className="welcome-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#333',
                  margin: 0,
                  marginBottom: '5px'
                }}>
                  {user?.role === 'Admin' ? 'Admin Dashboard' :
                    user?.role === 'Methods' ? 'Methods Dashboard' : 'HOD Dashboard'}
                </h2>
                <p style={{
                  color: '#666',
                  fontSize: '14px',
                  margin: 0
                }}>
                  Welcome back, {user?.username}! {user?.role === 'Admin' ? 'Manage system-wide operations.' :
                    user?.role === 'Methods' ? 'Oversee methods and processes.' : 'Manage your department efficiently.'}
                </p>
              </div>
              <div className="button-group" style={{ display: 'flex', gap: '15px' }}>
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
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0ac06'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffc107'}
                >
                  ⏳ Pending Cards
                </button>

                <button
                  className="btn-view-users"
                  onClick={() => setShowUserDetails(true)}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#545b62'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
                >
                  👥 View User Details
                </button>
              </div>
            </div>

            {/* Role Specific Stats Grid */}
            <div style={{ marginBottom: '30px' }}>
              <p style={{
                color: '#666',
                fontSize: '14px',
                marginBottom: '15px'
              }}>
                {user?.role === 'Admin' ? 'System overview and key metrics' :
                  user?.role === 'Methods' ? 'Methods and process metrics' :
                    'Department overview and key metrics'}
              </p>

              <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="stat-card"
                    style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      textAlign: 'center',
                      borderLeft: `4px solid ${stat.color}`,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#333',
                      marginBottom: '5px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      fontWeight: '600',
                      marginBottom: '5px'
                    }}>
                      {stat.label}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      {stat.description}
                    </div>
                  </div>
                ))}
              </div>

              <hr style={{
                border: 'none',
                borderTop: '1px solid #dee2e6',
                margin: '30px 0'
              }} />
            </div>

            {/* Quick Actions Section */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '20px'
              }}>
                Quick Actions
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                {actions.map((action, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: 'white',
                      padding: '25px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: '1px solid #e0e0e0',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>{action.icon}</div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{action.title}</h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                      {action.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {showUserDetails && (
          <button
            className="btn-back"
            onClick={() => setShowUserDetails(false)}
            style={{
              marginTop: '20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#545b62'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
          >
            ← Back to Dashboard
          </button>
        )}
      </main>

      {/* Notification Modal */}
      {showNotifications && <NotificationModal />}
    </div>
  );
};

export default HODDashboard;