import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase, authService } from './services/supabase';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Routers from './pages/Routers';
import Vouchers from './pages/Vouchers';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Tenants from './pages/Tenants';

function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      // Check active session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        const { user: currentUser, userData } = await authService.getCurrentUser();
        setUser({
          ...currentUser,
          ...userData
        });
      }
      
      setLoading(false);
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session) {
        const { user: currentUser, userData } = await authService.getCurrentUser();
        setUser({
          ...currentUser,
          ...userData
        });
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  // Superadmin gets access to tenant management
  const isSuperAdmin = user?.is_superadmin;

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/routers" element={<Routers user={user} />} />
            <Route path="/vouchers" element={<Vouchers user={user} />} />
            <Route path="/settings" element={<Settings user={user} />} />
            <Route 
              path="/tenants" 
              element={isSuperAdmin ? <Tenants user={user} /> : <Navigate to="/" replace />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;