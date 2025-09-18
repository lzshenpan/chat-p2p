import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CallPage from './pages/CallPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

function App() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" replace /> : <RegisterPage />} 
        />
        <Route 
          path="/" 
          element={user ? <Layout><HomePage /></Layout> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/call/:callId" 
          element={user ? <Layout><CallPage /></Layout> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Layout><ProfilePage /></Layout> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
