import { useEffect, useState } from 'react';
import { apiClient } from '../apiClient';

const sanitizeSavedUser = (user) => {
  if (!user || typeof user !== 'object') return null;

  return {
    id: user.id,
    name: user.name ?? '',
    email: user.email,
    role: user.role,
  };
};

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('current_user');
      return saved ? sanitizeSavedUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('current_user');
    }
  }, [currentUser]);

  const authenticate = async (credentials, isLoginMode) => {
    try {
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
      const { user, token } = await apiClient.post(endpoint, credentials);
      localStorage.setItem('auth_token', token);
      setCurrentUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
  };

  return { currentUser, authenticate, logout };
}
