import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Login from './Login';
import SignUp from './SignUp';
import '../styles/auth.css';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Handle successful authentication
  const handleAuthSuccess = (userData, profileData) => {
    setUser(userData);
    setUserProfile(profileData);
    console.log('Authentication successful:', userData, profileData);
  };

  // Switch between login and signup
  const switchToLogin = () => setIsSignUp(false);
  const switchToSignUp = () => setIsSignUp(true);

  // If user is authenticated, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {/* Background Elements */}
      <div className="background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <i className="fas fa-shield-halved" style={{color: '#00d4ff', fontSize: '1.8rem'}}></i>
            <span>Zeroday</span>
          </div>
          <div className="nav-center">
            <h1 className="auth-title nav-no-glow">
              <span className="gradient-text">Secure Access</span>
            </h1>
          </div>
          <div className="nav-back">
            <button className="btn-secondary" onClick={() => window.location.href = '/'}>
              <i className="fas fa-arrow-left"></i>
              Back to Home
            </button>
          </div>
        </div>
      </nav>

      {/* Authentication Container */}
      <main className="auth-main">
        <div className="auth-container">
          {/* Auth Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <i className="fas fa-shield-halved shield-enhanced"></i>
            </div>
          </div>

          {/* Auth Toggle */}
          <div className="auth-toggle">
            <button 
              className={`toggle-btn ${!isSignUp ? 'active' : ''}`} 
              onClick={switchToLogin}
            >
              <i className="fas fa-sign-in-alt"></i>
              Sign In
            </button>
            <button 
              className={`toggle-btn ${isSignUp ? 'active' : ''}`} 
              onClick={switchToSignUp}
            >
              <i className="fas fa-user-plus"></i>
              Sign Up
            </button>
          </div>

          {/* Render Login or SignUp Component */}
          <div className="auth-form-wrapper">
            {!isSignUp ? (
              <Login 
                onSuccess={handleAuthSuccess} 
                onSwitchToSignUp={switchToSignUp} 
              />
            ) : (
              <SignUp 
                onSuccess={handleAuthSuccess} 
                onSwitchToLogin={switchToLogin} 
              />
            )}
          </div>

          {/* Security Features Showcase */}
          <div className="security-showcase">
            <div className="security-grid">
              <div className="security-item">
                <div className="security-icon">
                  <i className="fas fa-face-smile"></i>
                </div>
                <h4>3D Face Recognition</h4>
                <p>Advanced biometric authentication with liveness detection</p>
              </div>
              <div className="security-item">
                <div className="security-icon">
                  <i className="fas fa-brain"></i>
                </div>
                <h4>AI Behavior Analysis</h4>
                <p>Intelligent pattern recognition for enhanced security</p>
              </div>
              <div className="security-item">
                <div className="security-icon">
                  <i className="fas fa-shield-virus"></i>
                </div>
                <h4>Fraud Prevention</h4>
                <p>Real-time monitoring and threat detection</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="auth-footer">
        <div className="footer-content">
          <p>&copy; 2025 Zeroday. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Auth;
