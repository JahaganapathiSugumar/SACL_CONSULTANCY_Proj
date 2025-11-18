import React, { useState } from 'react';
import AddUserModal from '../components/admin/AddUserModal';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

 // Function to get department name based on user role
const getDepartmentInfo = () => {
  if (user?.role === 'Admin' || user?.role === 'Methods') {
    return { displayText: '', showDepartment: false }; // Return empty string for display text
  } else {
    // Use the actual department name from your table
    const department = user?.department_name || 
                      user?.department || 
                      getDepartmentName(user?.department_id);
    
    return { 
      displayText: department || 'Operations',
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
                {user?.department_name && user.role !== 'Admin' && user.role !== 'Methods' && (
                  <span> • {user.department_name}</span>
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
              <path d="m6 9 6 6 6-6"/>
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
                  {user?.department_name && user.role !== 'Admin' && user.role !== 'Methods' && (
                    <span> • {user.department_name}</span>
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
            <div style={{ fontWeight: '600', color: '#333' }}>New Idea Submitted</div>
            <div style={{ fontSize: '14px', color: '#666' }}>A new idea has been submitted to your department</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>5 min ago</div>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#f0f9f0',
            borderRadius: '6px',
            borderLeft: '3px solid #28a745',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: '600', color: '#333' }}>Idea Approved</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Your idea "TEST-05" has been approved</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>1 hour ago</div>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#fffbf0',
            borderRadius: '6px',
            borderLeft: "3px solid #ffc107",
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: '600', color: '#333' }}>Action Required</div>
            <div style={{ fontSize: '14px', color: '#666' }}>3 ideas are pending your review</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>2 hours ago</div>
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
                  Admin Ideas Dashboard
                </h2>
                <p style={{ 
                  color: '#666',
                  fontSize: '14px',
                  margin: 0
                }}>
                  Welcome back, {user?.username}!
                </p>
              </div>
              <div className="button-group" style={{ display: 'flex', gap: '15px' }}>
                {user?.role === 'Admin' && (
                  <button 
                    className="btn-add-user"
                    onClick={() => setIsAddUserModalOpen(true)}
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
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                  >
                    + Add User Profiles
                  </button>
                )}
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

            {/* Overview Section */}
            <div style={{ marginBottom: '30px' }}>
              <p style={{ 
                color: '#666',
                fontSize: '14px',
                marginBottom: '15px'
              }}>
                Overview of idea submissions across all departments
              </p>
              
              <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                marginBottom: '30px'
              }}>
                {[
                  { label: 'Total Ideas', value: '502', color: '#007bff' },
                  { label: 'Uncle Review', value: '1', color: '#ffc107' },
                  { label: 'Ongoing', value: '150', color: '#17a2b8' },
                  { label: 'Approved', value: '121', color: '#28a745' },
                  { label: 'Implemented', value: '18', color: '#6f42c1' },
                  { label: 'Expected', value: '212', color: '#fd7e14' }
                ].map((stat, index) => (
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
                      fontSize: '24px', 
                      fontWeight: 'bold',
                      color: '#333',
                      marginBottom: '5px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      {stat.label}
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

            {/* Employee Management Section */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '15px'
              }}>
                Employee Management
              </h3>
              <p style={{ 
                color: '#666',
                fontSize: '14px',
                marginBottom: '15px'
              }}>
                Manage employee data
              </p>

              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <input 
                  type="text"
                  placeholder="Search ideas by title or ideology..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
                
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#333' }}>All Departments</strong>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {['Al Priorities', 'Expert Excel', 'Refresh'].map((dept, index) => (
                    <div 
                      key={index}
                      style={{
                        backgroundColor: '#e9ecef',
                        padding: '8px 15px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        color: '#333',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dde1e6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                    >
                      {dept}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Idea Directory Section */}
            <div>
              <h3 style={{ 
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '15px'
              }}>
                Idea Directory
              </h3>
              <p style={{ 
                color: '#666',
                fontSize: '14px',
                marginBottom: '15px'
              }}>
                Showing ideas from all departments (302 levels)
              </p>

              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '800px'
                  }}>
                    <thead>
                      <tr style={{ 
                        backgroundColor: '#f8f9fa',
                        borderBottom: '1px solid #dee2e6'
                      }}>
                        {['IDEA', 'DEPARTMENT', 'DATE UPLOADED', 'EMPLOYEE', 'STATUS', 'ASSIGNED TO', 'ACTIONS'].map((header, index) => (
                          <th key={index} style={{
                            padding: '12px 15px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#666',
                            textTransform: 'uppercase'
                          }}>
                            {header}
                        </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { idea: 'TEST-05 Read Only', department: '[legal]', date: '2025-10-30', employee: 'Pestablishment', status: 'Implemented', assigned: 'Martin Gusepong 2', actions: '✅ 2025-10-30' },
                        { idea: 'TEST-04 Read Only', department: '[legal]', date: '2025-10-30', employee: 'Pestablishment', status: 'Rejected', assigned: 'Martin Gusepong 2', actions: '✅ 2025-10-30' },
                        { idea: 'test-3 Read Only', department: '[legal]', date: '2025-10-30', employee: 'Pestablishment', status: 'Rejected', assigned: 'Martin Gusepong 2', actions: '✅ 2025-10-30' },
                        { idea: 'test-002 Read Only', department: '[legal]', date: '2025-10-30', employee: 'Pestablishment', status: 'Rejected', assigned: 'Martin Gusepong 2', actions: '✅ 2025-10-30' }
                      ].map((row, index) => (
                        <tr key={index} style={{ 
                          borderBottom: '1px solid #dee2e6',
                          backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'}
                        >
                          <td style={{ padding: '12px 15px', fontSize: '14px' }}>
                            <div style={{ fontWeight: '500', color: '#333' }}>{row.idea}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Mastery: &lt;sudity&gt;e{1000 + index}</div>
                          </td>
                          <td style={{ padding: '12px 15px', fontSize: '14px', color: '#333' }}>{row.department}</td>
                          <td style={{ padding: '12px 15px', fontSize: '14px', color: '#333' }}>{row.date}</td>
                          <td style={{ padding: '12px 15px', fontSize: '14px', color: '#333' }}>
                            <div>{row.employee}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>ID: 102</div>
                          </td>
                          <td style={{ padding: '12px 15px', fontSize: '14px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: row.status === 'Implemented' ? '#d4edda' : '#f8d7da',
                              color: row.status === 'Implemented' ? '#155724' : '#721c24'
                            }}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 15px', fontSize: '14px', color: '#333' }}>{row.assigned}</td>
                          <td style={{ padding: '12px 15px', fontSize: '14px', color: '#333' }}>{row.actions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

      {/* Add User Modal */}
      <AddUserModal 
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserCreated={() => {
          setShowUserDetails(true);
          console.log('User created successfully');
        }}
      />

      {/* Notification Modal */}
      {showNotifications && <NotificationModal />}
    </div>
  );
};

export default DashboardPage;