import React, { useState, useEffect } from 'react';
import { Paper, Chip, Typography, Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/commonService';
import { COLORS } from '../../theme/appTheme';

interface HeaderProps {
    departmentInfo: {
        displayText: string;
        showDepartment: boolean;
        name?: string;
    };
    customStyle?: React.CSSProperties;
    textColor?: string;
    logoTextColors?: {
        title: string;
        subtitle: string;
    };
    setShowProfile?: (show: boolean) => void;
    photoRefreshKey?: number;
}

const Header: React.FC<HeaderProps> = ({
    departmentInfo,
    customStyle,
    textColor,
    logoTextColors,
    setShowProfile,
    photoRefreshKey = 0
}) => {
    const { user, logout } = useAuth();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [photoLoading, setPhotoLoading] = useState(true);

    // Load profile photo on mount and when refreshKey changes
    useEffect(() => {
        loadProfilePhoto();
    }, [photoRefreshKey]);

    const loadProfilePhoto = async () => {
        try {
            const response = await apiService.getProfilePhoto();
            if (response.profilePhoto) {
                setProfilePhoto(response.profilePhoto);
            }
        } catch (err) {
            console.error('Error loading profile photo:', err);
        } finally {
            setPhotoLoading(false);
        }
    };

    // Default colors - Dark Theme for Sakthi Auto Component Limited
    const defaultTextColor = '#FFFFFF';
    const backgroundColor = '#2C3E50'; // Dark Slate Grey

    const currentTextColor = defaultTextColor;

    return (
        <>
            <style>
                {`
                    .dashboard-header {
                        background-color: ${backgroundColor};
                        padding: 10px 24px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        color: white !important;
                        flex-shrink: 0;
                        z-index: 1200;
                    }
                    .header-left {
                        display: flex;
                        align-items: center;
                        gap: 24px;
                    }
                    .header-right {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                    }
                    @media (max-width: 900px) {
                        .dashboard-header {
                            padding: 12px 20px;
                        }
                    }
                `}
            </style>
            <header className="dashboard-header" style={customStyle}>
                {/* Left side - Logo/Brand and Department Info */}
                <Box className="header-left">
                    {/* SACL Logo Section */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                        }}
                    >
                        {/* Placeholder Logo Box if image fails, or use image */}
                        <Box sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'white',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            <img
                                src="/assets/SACL-LOGO-01.jpg"
                                alt="Logo"
                                style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            {/* Fallback Text if needed, currently hidden if img works */}
                        </Box>

                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1, color: 'white', fontSize: '1rem' }}>
                                Sakthi Auto Component Limited
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                                {departmentInfo.displayText}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Right side - Icons and Profile */}
                <div className="header-right">
                    {/* Profile Section */}
                    <div style={{ position: 'relative' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s',

                            }}
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            <div style={{
                                width: '36px',
                                height: '36px',
                                backgroundColor: '#E67E22', // Orange for profile
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                overflow: 'hidden',
                                backgroundImage: profilePhoto ? `url(${profilePhoto})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: '2px solid rgba(255,255,255,0.2)'
                            }}>
                                {!profilePhoto && (user?.username?.charAt(0).toUpperCase() || 'U')}
                            </div>
                            <div className="profile-username" style={{ textAlign: 'left' }}>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: 'white'
                                }}>
                                    {user?.username?.toUpperCase() || 'USER'}
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#E67E22', // Orange text
                                    fontWeight: 700,
                                    textTransform: 'uppercase'
                                }}>
                                    {user?.role || 'User Role'}
                                </div>
                            </div>
                        </div>

                        {/* Profile Dropdown */}
                        {showProfileDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '120%',
                                right: '0',
                                backgroundColor: 'white',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                minWidth: '220px',
                                zIndex: 1300,
                            }}>
                                <div style={{ height: '4px', backgroundColor: '#E67E22', width: '100%', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}></div>
                                <div style={{
                                    padding: '16px',
                                    borderBottom: '1px solid #f0f0f0'
                                }}>
                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#333' }}>
                                        {user?.username}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                                        {user?.role}
                                    </div>
                                </div>
                                {setShowProfile && (
                                    <div
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: '#333',
                                            transition: 'background-color 0.2s',
                                            borderBottom: '1px solid #f0f0f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}
                                        onClick={() => {
                                            setShowProfile(true);
                                            setShowProfileDropdown(false);
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <span>👤</span> View Profile
                                    </div>
                                )}
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: '#d32f2f',
                                        transition: 'background-color 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                    onClick={logout}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <span>🚪</span> Logout
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;
