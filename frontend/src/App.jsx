import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import Home from './pages/Home';
import PromptDetail from './pages/PromptDetail';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import Legal from './pages/Legal';
import Contact from './pages/Contact';
import VideoComingSoon from './pages/VideoComingSoon';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1A1D26', color: '#F0F1F5', border: '1px solid rgba(255,255,255,0.08)' } }} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/prompt/:id" element={<PromptDetail />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/legal/:slug" element={<Legal />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/video" element={<VideoComingSoon />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
