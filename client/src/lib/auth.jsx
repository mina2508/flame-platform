import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('flame_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('flame_token'))
      .finally(() => setLoading(false));
  }, []);

  // login accepts a username OR an email (server matches either).
  async function login(loginId, password) {
    const { data } = await api.post('/auth/login', { login: loginId, email: loginId, password });
    localStorage.setItem('flame_token', data.token);
    setUser(data.user);
    return data.user;
  }

  // First-login / self-service password change.
  async function changePassword(currentPassword, newPassword) {
    const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
    // After a successful change the user is no longer forced to change it.
    setUser((u) => (u ? { ...u, mustChangePassword: false } : u));
    return data;
  }

  function logout() {
    localStorage.removeItem('flame_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
