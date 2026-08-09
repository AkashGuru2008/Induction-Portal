import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('role'));
  const [profile, setProfile] = useState(() => {
    const raw = localStorage.getItem('profile');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback((token, role, profile) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('profile', JSON.stringify(profile || {}));
    setRole(role);
    setProfile(profile || {});
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('profile');
    setRole(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ role, profile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
