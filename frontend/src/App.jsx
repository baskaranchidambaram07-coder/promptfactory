import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect, createContext, useContext } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { AdminAuthProvider, useAdminAuth } from './hooks/useAdminAuth';

import Home            from './pages/Home';
import Explore         from './pages/Explore';
import Categories      from './pages/Categories';
import PromptDetail    from './pages/PromptDetail';
import Auth            from './pages/Auth';
import Legal           from './pages/Legal';
import Contact         from './pages/Contact';
import VideoComingSoon from './pages/VideoComingSoon';

import AdminLogin  from './pages/admin/Login';
import AdminShell  from './pages/admin/index';

export const ThemeContext = createContext(null);
export function useTheme() { return useContext(ThemeContext); }

/* ── Guard: redirects to /admin if not authenticated ── */
function AdminRoute({ tab }) {
  const { adminUser } = useAdminAuth();
  if (!adminUser) return <Navigate to="/admin" replace />;
  return <AdminShell activeTab={tab} />;
}

/* ── Guard: redirects to /admin/dashboard if already authenticated ── */
function AdminLoginRoute() {
  const { adminUser } = useAdminAuth();
  if (adminUser) return <Navigate to="/admin/dashboard" replace />;
  return <AdminLogin />;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('pf-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pf-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const toastStyle =
    theme === 'light'
      ? { background: '#FFFFFF', color: '#0D0D1E', border: '1px solid rgba(107,92,231,0.2)' }
      : { background: '#1A1A3E', color: '#F0F1F5', border: '1px solid rgba(138,116,249,0.2)' };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ style: toastStyle }} />
            <Routes>
              {/* ── Public app routes ── */}
              <Route path="/"            element={<Home />} />
              <Route path="/explore"          element={<Explore />} />
              <Route path="/categories"       element={<Categories />} />
              <Route path="/categories/:name" element={<Categories />} />
              <Route path="/prompt/:id"       element={<PromptDetail />} />
              <Route path="/auth"        element={<Auth />} />
              <Route path="/legal/:slug" element={<Legal />} />
              <Route path="/contact"     element={<Contact />} />
              <Route path="/video"       element={<VideoComingSoon />} />

              {/* ── Admin portal routes ── */}
              <Route path="/admin"                element={<AdminLoginRoute />} />
              <Route path="/admin/dashboard"      element={<AdminRoute tab="dashboard" />} />
              <Route path="/admin/prompts"        element={<AdminRoute tab="prompts" />} />
              <Route path="/admin/images"         element={<AdminRoute tab="images" />} />
              <Route path="/admin/users"          element={<AdminRoute tab="users" />} />
              <Route path="/admin/subscriptions"  element={<AdminRoute tab="subscriptions" />} />
              <Route path="/admin/usage"          element={<AdminRoute tab="usage" />} />
              <Route path="/admin/llm-keys"       element={<AdminRoute tab="llm-keys" />} />
              <Route path="/admin/admin-users"    element={<AdminRoute tab="admin-users" />} />
            </Routes>
          </BrowserRouter>
        </AdminAuthProvider>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}
