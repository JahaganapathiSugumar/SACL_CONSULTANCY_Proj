import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthContextType, LoginCredentials } from '../types/auth';
import { authService } from '../services/authService';
import { apiService } from '../services/commonService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(() => authService.getStoredUser());
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const fetchProfilePhoto = async () => {
    try {
      const response = await apiService.getProfilePhoto();
      if (response.profilePhoto) {
        setProfilePhoto(response.profilePhoto);
      } else {
        setProfilePhoto(null);
      }
    } catch (err) {
      console.error('Error loading profile photo:', err);
      setProfilePhoto(null);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (token && user) {
        await fetchProfilePhoto();
      }
      setLoading(false);
    };
    initialize();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(
      credentials.username,
      credentials.password
    );
    setUser(response.user);
    setToken(response.token);
    fetchProfilePhoto();
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setProfilePhoto(null);
  };

  const updateUser = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token,
        loading,
        profilePhoto,
        refreshProfilePhoto: fetchProfilePhoto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
