import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/commonService';
import { getDepartmentInfo } from '../../utils/dashboardUtils';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const departmentInfo = getDepartmentInfo(user);

  // Email editing states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // Start OTP countdown timer
  const startOtpTimer = () => {
    setOtpTimer(300); // 5 minutes = 300 seconds
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOtp = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailLoading(true);
    setEmailError('');
    setEmailSuccess('');
    try {
      await apiService.request('/users/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail })
      });
      setOtpSent(true);
      setEmailSuccess('OTP sent to your email. Valid for 5 minutes.');
      startOtpTimer();
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send OTP');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setEmailError('Please enter a valid 6-digit OTP');
      return;
    }
    setEmailLoading(true);
    setEmailError('');
    try {
      await apiService.request('/users/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail, otp })
      });
      setEmailSuccess('Email updated successfully!');
      // Update user in context and localStorage
      if (updateUser) {
        updateUser({ ...user, email: newEmail });
      }
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.email = newEmail;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
      // Reset states after success
      setTimeout(() => {
        setIsEditingEmail(false);
        setOtpSent(false);
        setOtp('');
        setNewEmail('');
        setEmailSuccess('');
        setOtpTimer(0);
      }, 2000);
    } catch (err: any) {
      setEmailError(err.message || 'Invalid OTP');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCancelEmailEdit = () => {
    setIsEditingEmail(false);
    setOtpSent(false);
    setOtp('');
    setNewEmail('');
    setEmailError('');
    setEmailSuccess('');
    setOtpTimer(0);
  };

  return (
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
      zIndex: 2000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        maxWidth: '480px',
        width: '90%',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header with gradient background */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '30px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          >
            ×
          </button>
          {/* Avatar */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            margin: '0 auto 15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            color: '#667eea',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
          }}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '22px', fontWeight: 600 }}>
            {user?.username || 'User'}
          </h2>
          <span style={{
            display: 'inline-block',
            marginTop: '10px',
            padding: '5px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#fff'
          }}>
            {user?.role || 'N/A'}
          </span>
        </div>

        {/* Profile Details */}
        <div style={{ padding: '25px 30px' }}>
          <div style={{ marginBottom: '20px' }}>
            {/* Email Section - Editable */}
            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#e8f4fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '15px',
                  fontSize: '18px'
                }}>
                  📧
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#888', fontWeight: 500, marginBottom: '2px' }}>
                    Email Address
                  </div>
                  {!isEditingEmail ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '15px', color: '#333', fontWeight: 500, wordBreak: 'break-all' }}>
                        {user?.email || 'Not set'}
                      </div>
                      <button
                        onClick={() => {
                          setIsEditingEmail(true);
                          setNewEmail(user?.email || '');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#667eea',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: '10px' }}>
                      {!otpSent ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Enter new email"
                            style={{
                              flex: 1,
                              minWidth: '180px',
                              padding: '10px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#667eea')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
                          />
                          <button
                            onClick={handleSendOtp}
                            disabled={emailLoading}
                            style={{
                              padding: '10px 16px',
                              backgroundColor: emailLoading ? '#ccc' : '#667eea',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: emailLoading ? 'not-allowed' : 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {emailLoading ? 'Sending...' : 'Send OTP'}
                          </button>
                          <button
                            onClick={handleCancelEmailEdit}
                            style={{
                              padding: '10px 16px',
                              backgroundColor: '#f0f0f0',
                              color: '#666',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <input
                              type="text"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="Enter 6-digit OTP"
                              maxLength={6}
                              style={{
                                width: '140px',
                                padding: '10px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontFamily: 'monospace',
                                letterSpacing: '4px',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                              onFocus={(e) => (e.currentTarget.style.borderColor = '#667eea')}
                              onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
                            />
                            <button
                              onClick={handleVerifyOtp}
                              disabled={emailLoading || otp.length !== 6}
                              style={{
                                padding: '10px 16px',
                                backgroundColor: emailLoading || otp.length !== 6 ? '#ccc' : '#28a745',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: emailLoading || otp.length !== 6 ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {emailLoading ? 'Verifying...' : 'Verify'}
                            </button>
                            <button
                              onClick={handleCancelEmailEdit}
                              style={{
                                padding: '10px 16px',
                                backgroundColor: '#f0f0f0',
                                color: '#666',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                          {otpTimer > 0 && (
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>
                              OTP expires in: <span style={{ color: otpTimer < 60 ? '#dc3545' : '#667eea', fontWeight: 600 }}>{formatTime(otpTimer)}</span>
                            </div>
                          )}
                          <button
                            onClick={handleSendOtp}
                            disabled={emailLoading || otpTimer > 240}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: otpTimer > 240 ? '#ccc' : '#667eea',
                              cursor: otpTimer > 240 ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: 500,
                              padding: 0
                            }}
                          >
                            Resend OTP {otpTimer > 240 ? `(wait ${formatTime(otpTimer - 240)})` : ''}
                          </button>
                        </div>
                      )}
                      {emailError && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#fee', borderRadius: '6px', color: '#c00', fontSize: '13px' }}>
                          {emailError}
                        </div>
                      )}
                      {emailSuccess && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#efe', borderRadius: '6px', color: '#070', fontSize: '13px' }}>
                          {emailSuccess}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Department */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#fff3e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '15px',
                fontSize: '18px'
              }}>
                🏢
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 500, marginBottom: '2px' }}>
                  Department
                </div>
                <div style={{ fontSize: '15px', color: '#333', fontWeight: 500 }}>
                  {departmentInfo.displayText || 'N/A'}
                </div>
              </div>
            </div>

            {/* Access Level */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#e8f5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '15px',
                fontSize: '18px'
              }}>
                🔑
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 500, marginBottom: '2px' }}>
                  Access Level
                </div>
                <div style={{ fontSize: '15px', color: '#333', fontWeight: 500 }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: user?.role === 'Admin' ? '#d4edda' : user?.role === 'HOD' ? '#fff3cd' : '#cfe2ff',
                    color: user?.role === 'Admin' ? '#155724' : user?.role === 'HOD' ? '#856404' : '#084298'
                  }}>
                    {user?.role === 'Admin' ? 'Full Access' : user?.role === 'HOD' ? 'Department Head' : 'Standard Access'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
