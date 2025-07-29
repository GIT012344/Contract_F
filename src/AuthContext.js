import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [role, setRole] = useState(() => localStorage.getItem('role'));
  const [authMethod, setAuthMethod] = useState(() => localStorage.getItem('authMethod'));

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (role) localStorage.setItem('role', role);
    else localStorage.removeItem('role');
  }, [role]);

  useEffect(() => {
    if (authMethod) localStorage.setItem('authMethod', authMethod);
    else localStorage.removeItem('authMethod');
  }, [authMethod]);

  const login = (token, userData) => {
    setToken(token);
    setUser(userData);
    setRole(userData.role);
    setAuthMethod(userData.authMethod);
  };
  
  const logout = () => {
    setToken(null);
    setUser(null);
    setRole(null);
    setAuthMethod(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('authMethod');
  };

  return (
    <AuthContext.Provider value={{ token, user, role, authMethod, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Helper fetch ที่แนบ token อัตโนมัติ
export async function authFetch(url, options = {}, token) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
} 