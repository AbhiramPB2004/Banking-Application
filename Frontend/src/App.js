import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

import HeroSection from './components/HeroSection';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import AccountsPage from './components/AccountsPage';
import CreditCardsPage from './components/CreditCardsPage';
import LoansPage from './components/LoansPage';
import InvestmentsPage from './components/InvestmentsPage';
import AdminPanel from './components/AdminPanel';
import RegisterModal from './components/RegisterModal';
import LoginModal from './components/LoginModal';

function AppContent() {
  const { isLoggedIn, isLoading, toast } = useAuth();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-body)'
      }}>
        <div className="loading-spinner lg" />
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar
        onLoginClick={() => setShowLoginModal(true)}
        onRegisterClick={() => setShowRegisterModal(true)}
      />

      {isLoggedIn && <Sidebar />}

      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <HeroSection
                onRegisterClick={() => setShowRegisterModal(true)}
                onLoginClick={() => setShowLoginModal(true)}
              />
            )
          }
        />

        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="app-layout"><div className="main-content animate-fade">
              <Dashboard />
            </div></div>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <div className="app-layout"><div className="main-content animate-fade">
              <ProfilePage />
            </div></div>
          </ProtectedRoute>
        } />

        <Route path="/accounts" element={
          <ProtectedRoute>
            <div className="app-layout"><div className="main-content animate-fade">
              <AccountsPage />
            </div></div>
          </ProtectedRoute>
        } />

        <Route path="/credit-cards" element={
          <ProtectedRoute>
            <div className="app-layout"><div className="main-content animate-fade">
              <CreditCardsPage />
            </div></div>
          </ProtectedRoute>
        } />

        <Route path="/loans" element={
          <ProtectedRoute>
            <div className="app-layout"><div className="main-content animate-fade">
              <LoansPage />
            </div></div>
          </ProtectedRoute>
        } />

        <Route path="/investments" element={
          <ProtectedRoute>
            <div className="app-layout"><div className="main-content animate-fade">
              <InvestmentsPage />
            </div></div>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <div className="app-layout"><div className="main-content animate-fade">
              <AdminPanel />
            </div></div>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Modals */}
      {showRegisterModal && (
        <RegisterModal onClose={() => setShowRegisterModal(false)} />
      )}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {/* Toast */}
      {toast.show && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
