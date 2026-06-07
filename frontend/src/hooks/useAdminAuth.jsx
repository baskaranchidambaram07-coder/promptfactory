import { useState, createContext, useContext } from 'react';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pf_admin_user')); }
    catch { return null; }
  });

  const loginAdmin = (token, userData) => {
    localStorage.setItem('pf_admin_token', token);
    localStorage.setItem('pf_admin_user', JSON.stringify(userData));
    setAdminUser(userData);
  };

  const logoutAdmin = () => {
    localStorage.removeItem('pf_admin_token');
    localStorage.removeItem('pf_admin_user');
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
