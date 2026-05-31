import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Navigation from './components/Navigation';
import { GamificationProvider } from './contexts/GamificationContext';
import Wingman from './components/Wingman';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#111827]">
        <div className="w-12 h-12 border-4 border-[#4F7CFF]/30 border-t-[#4F7CFF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <GamificationProvider>
        <div className="min-h-screen">
          <Navigation isAuthenticated={!!user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Auth type="login" onAuthSuccess={() => {}} />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Auth type="signup" onAuthSuccess={() => {}} />} />
            <Route 
              path="/dashboard/*" 
              element={user ? <Dashboard /> : <Navigate to="/login" />} 
            />
          </Routes>
          <Wingman />
        </div>
      </GamificationProvider>
    </Router>
  );
}
