import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Routers from './pages/Routers';
import Vouchers from './pages/Vouchers';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Tenants from './pages/Tenants';

function App() {
  const [session, setSession] = useState(null);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Fetch tenant info for logged in user
        fetchTenantInfo(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchTenantInfo(session.user.id);
      } else {
        setTenant(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTenantInfo = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*, tenants(*)')
      .eq('id', userId)
      .single();
    
    if (!error) {
      setTenant(data.tenants);
    }
  };

  if (!session) {
    return <Login />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar tenant={tenant} />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard tenant={tenant} />} />
            <Route path="/routers" element={<Routers tenant={tenant} />} />
            <Route path="/vouchers" element={<Vouchers tenant={tenant} />} />
            <Route path="/settings" element={<Settings tenant={tenant} />} />
            <Route path="/tenants" element={<Tenants />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;