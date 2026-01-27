import React, { useState, useEffect } from 'react';
import { Paper, Chip, Typography, Box, IconButton } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/commonService';
import { COLORS } from '../../theme/appTheme';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

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
    showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({
    departmentInfo,
    customStyle,
    textColor,
    logoTextColors,
    setShowProfile,
    photoRefreshKey = 0,
    showBackButton = false
}) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
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
                        gap: 16px;
                        min-height: 64px;
                    }
                    .header-left {
                        display: flex;
                        align-items: center;
                        gap: 24px;
                        flex: 0 0 auto;
                    }
                    .header-right {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        flex: 1;
                        justify-content: flex-end;
                    }
                    .profile-username {
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    @media (max-width: 1024px) {
                        .dashboard-header {
                            padding: 12px 20px;
                            min-height: 60px;
                        }
                        .header-left {
                            gap: 16px;
                        }
                    }
                    @media (max-width: 768px) {
                        .dashboard-header {
                            padding: 10px 16px;
                            min-height: 56px;
                        }
                        .profile-username {
                            display: none;
                        }
                        .header-right {
                            gap: 12px;
                        }
                    }
                    @media (max-width: 480px) {
                        .dashboard-header {
                            padding: 8px 12px;
                            min-height: 52px;
                            gap: 12px;
                        }
                        .header-left {
                            gap: 10px;
                        }
                    }
                `}
            </style>
            <header className="dashboard-header" style={customStyle}>
                {/* Left side - Logo/Brand and Department Info */}
                <Box className="header-left">
                    {showBackButton && (
                        <IconButton
                            onClick={() => navigate('/dashboard')}
                            sx={{ color: 'white', mr: 1 }}
                            size="small"
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    {/* SACL Logo Section */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                        }}
                    >
                        <Box
                            component="img"
                            src="/assets/SACL-LOGO-01.svg"
                            alt="Sakthi Auto"
                            sx={{
                                height: { xs: 35, sm: 40, md: 45 },
                                width: 'auto',
                                objectFit: 'contain',
                                filter: 'brightness(0) invert(1)' // Make it white for the dark header
                            }}
                        />
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column' }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    fontSize: '1.2rem',
                                    color: 'white',
                                    letterSpacing: '1px'
                                }}
                            >
                                SACL
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: '0.65rem',
                                    fontWeight: 500,
                                    color: 'rgba(255,255,255,0.7)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Sakthi Auto Component Limited
                            </Typography>
                        </Box>
                    </Box>

                    {/* Department Title Section */}
                    {departmentInfo.showDepartment && (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            ml: 2,
                            px: 2,
                            py: 0.5,
                            bgcolor: 'rgba(230, 126, 34, 0.15)',
                            borderRadius: '20px',
                            border: '1px solid rgba(230, 126, 34, 0.3)',
                        }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: { xs: '0.85rem', sm: '1.1rem' },
                                    color: '#E67E22',
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {departmentInfo.displayText}
                            </Typography>
                        </Box>
                    )}
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
                                padding: '8px 12px',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s',
                                minHeight: '44px',
                                minWidth: '44px',
                            }}
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
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
                                border: '2px solid rgba(255,255,255,0.2)',
                                flexShrink: 0,
                                minWidth: '40px'
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
                                maxWidth: 'calc(100vw - 20px)',
                                zIndex: 1300,
                            }}>
                                <div style={{ height: '4px', backgroundColor: '#E67E22', width: '100%', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}></div>
                                <div style={{
                                    padding: '16px',
                                    borderBottom: '1px solid #f0f0f0'
                                }}>
                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#333', wordBreak: 'break-word' }}>
                                        {user?.username}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px', wordBreak: 'break-word' }}>
                                        {user?.role}
                                    </div>
                                </div>
                                {setShowProfile && (
                                    <div
                                        style={{
                                            padding: '14px 16px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: '#333',
                                            transition: 'background-color 0.2s',
                                            borderBottom: '1px solid #f0f0f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            minHeight: '44px',
                                            alignContent: 'center'
                                        }}
                                        onClick={() => {
                                            setShowProfile(true);
                                            setShowProfileDropdown(false);
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <PersonIcon sx={{ fontSize: '18px', color: '#333' }} /> View Profile
                                    </div>
                                )}
                                <div
                                    style={{
                                        padding: '14px 16px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: '#d32f2f',
                                        fontWeight: 600,
                                        transition: 'background-color 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        minHeight: '44px',
                                        alignContent: 'center'
                                    }}
                                    onClick={logout}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffebee')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <LogoutIcon sx={{ fontSize: '18px', color: '#d32f2f' }} /> Logout
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header >
        </>
    );
};

export default Header;
