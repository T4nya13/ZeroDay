import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Add any JavaScript functionality here that was in your script.js
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Contact form handling
    const contactForm = document.querySelector('.form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! We\'ll get back to you soon.');
        contactForm.reset();
      });
    }

    // Add glitch effect to security dashboard (from original script.js)
    const addGlitchEffect = () => {
      const securityElements = document.querySelectorAll('.security-dashboard, .monitor-screen');
      
      securityElements.forEach(element => {
        const glitchInterval = setInterval(() => {
          if (Math.random() < 0.1) { // 10% chance every 2 seconds
            element.style.filter = 'hue-rotate(180deg)';
            setTimeout(() => {
              element.style.filter = '';
            }, 100);
          }
        }, 2000);
        
        // Store interval for cleanup
        element.glitchInterval = glitchInterval;
      });
    };

    // Initialize glitch effect
    addGlitchEffect();

    // Security dashboard real-time updates
    const updateSecurityDashboard = () => {
      const activityFeed = document.querySelector('.activity-feed');
      if (!activityFeed) return;
      
      const activities = [
        { type: 'success', icon: 'fas fa-check', text: 'Face authentication verified' },
        { type: 'success', icon: 'fas fa-check', text: 'Behavior pattern normal' },
        { type: 'warning', icon: 'fas fa-exclamation', text: 'New device detected - blocked' },
        { type: 'success', icon: 'fas fa-check', text: 'Transaction approved' },
        { type: 'success', icon: 'fas fa-shield-alt', text: 'SIM swap protection active' },
        { type: 'success', icon: 'fas fa-check', text: 'Biometric scan completed' },
        { type: 'warning', icon: 'fas fa-exclamation-triangle', text: 'Login location flagged' },
        { type: 'success', icon: 'fas fa-check', text: 'Real-time monitoring active' },
        { type: 'success', icon: 'fas fa-lock', text: 'Account security verified' },
        { type: 'success', icon: 'fas fa-check', text: 'Identity confirmation done' }
      ];
      
      const dashboardInterval = setInterval(() => {
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        const activityItems = activityFeed.querySelectorAll('.activity-item');
        
        // Remove oldest activity if we have too many (keep max 3 items like original)
        if (activityItems.length >= 3) {
          const oldestItem = activityItems[activityItems.length - 1];
          oldestItem.classList.add('slide-out');
          setTimeout(() => {
            if (oldestItem.parentNode) {
              oldestItem.remove();
            }
          }, 300); // Match animation duration
        }
        
        // Create new activity item
        const newActivity = document.createElement('div');
        newActivity.className = 'activity-item slide-in';
        
        const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        newActivity.innerHTML = `
          <div class="activity-icon ${randomActivity.type}">
            <i class="${randomActivity.icon}"></i>
          </div>
          <span>${randomActivity.text}</span>
          <span class="activity-time">${currentTime}</span>
        `;
        
        // Insert at the beginning
        activityFeed.insertBefore(newActivity, activityFeed.firstChild);
        
        // Remove animation class after animation completes
        setTimeout(() => {
          newActivity.classList.remove('slide-in');
        }, 300);
      }, 4000); // Update every 4 seconds for better visibility
      
      // Store interval for cleanup
      return dashboardInterval;
    };

    // Start security dashboard updates
    const dashboardInterval = updateSecurityDashboard();

    return () => {
      // Cleanup event listeners
      if (hamburger) {
        hamburger.removeEventListener('click', () => {});
      }
      navLinks.forEach(link => {
        link.removeEventListener('click', () => {});
      });
      if (contactForm) {
        contactForm.removeEventListener('submit', () => {});
      }
      
      // Cleanup glitch intervals
      const securityElements = document.querySelectorAll('.security-dashboard, .monitor-screen');
      securityElements.forEach(element => {
        if (element.glitchInterval) {
          clearInterval(element.glitchInterval);
        }
      });
      
      // Cleanup dashboard interval
      if (dashboardInterval) {
        clearInterval(dashboardInterval);
      }
    };
  }, []);

  const handleGetStarted = () => {
    navigate('/auth');
  };

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
          <ul className="nav-menu">
            <li><a href="#home" className="nav-link">Home</a></li>
            <li><a href="#features" className="nav-link">Features</a></li>
            <li><a href="#security" className="nav-link">Security</a></li>
            <li><a href="#contact" className="nav-link">Contact</a></li>
          </ul>
          <div className="nav-cta">
            <button className="btn-primary" onClick={handleGetStarted}>Get Started</button>
          </div>
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero template-hero-full">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="line-1">Secure Banking</span>
              <span className="line-2">with Advanced</span>
              <span className="line-3 gradient-text-clean">Authentication</span>
            </h1>
            <p className="hero-description">
              Protect your financial transactions with cutting-edge face authentication, 
              behavior detection, and real-time fraud prevention technology.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary large" onClick={handleGetStarted}>
                <i className="fas fa-rocket"></i>
                Start Protecting Now
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Fraud Detection</span>
              </div>
              <div className="stat">
                <span className="stat-number">2M+</span>
                <span className="stat-label">Protected Users</span>
              </div>
              <div className="stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Monitoring</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="security-dashboard">
              <div className="dashboard-header">
                <div className="status-indicator active"></div>
                <span>Active Security Features</span>
              </div>
              <div className="auth-methods">
                <div className="auth-item">
                  <i className="fas fa-face-smile"></i>
                  <span>Face Authentication</span>
                  <div className="auth-status verified"></div>
                </div>
                <div className="auth-item">
                  <i className="fas fa-brain"></i>
                  <span>Behavior Analysis</span>
                  <div className="auth-status verified"></div>
                </div>
                <div className="auth-item">
                  <i className="fas fa-sim-card"></i>
                  <span>SIM Swap Protection</span>
                  <div className="auth-status verified"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Advanced Security Features</h2>
            <p className="section-description">
              Comprehensive protection powered by AI and machine learning
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-face-smile"></i>
              </div>
              <h3>Face Authentication</h3>
              <p>Biometric facial recognition with liveness detection to prevent spoofing attacks and ensure genuine user verification.</p>
              <ul className="feature-list">
                <li><i className="fas fa-check"></i> 3D Liveness Detection</li>
                <li><i className="fas fa-check"></i> Anti-Spoofing Technology</li>
                <li><i className="fas fa-check"></i> Real-time Verification</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-brain"></i>
              </div>
              <h3>Behavior Detection</h3>
              <p>AI-powered behavioral analysis that learns your patterns and detects suspicious activities in real-time.</p>
              <ul className="feature-list">
                <li><i className="fas fa-check"></i> Pattern Recognition</li>
                <li><i className="fas fa-check"></i> Anomaly Detection</li>
                <li><i className="fas fa-check"></i> Machine Learning</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-sim-card"></i>
              </div>
              <h3>SIM Swap and Fraud Detection</h3>
              <p>Comprehensive protection combining SIM swap monitoring and multi-layered fraud prevention to safeguard your banking transactions and mobile authentication systems.</p>
              <ul className="feature-list">
                <li><i className="fas fa-check"></i> Real-time SIM Monitoring</li>
                <li><i className="fas fa-check"></i> Transaction Analysis</li>
                <li><i className="fas fa-check"></i> Instant Alerts</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security Dashboard Section */}
      <section id="security" className="security-section">
        <div className="container">
          <div className="security-content">
            <div className="security-text">
              <h2>Real-time Security Monitoring</h2>
              <p>Our advanced security dashboard provides comprehensive monitoring and instant threat detection across all your banking activities.</p>
              <div className="security-features">
                <div className="security-feature">
                  <i className="fas fa-eye"></i>
                  <div>
                    <h4>24/7 Monitoring</h4>
                    <p>Continuous surveillance of all account activities</p>
                  </div>
                </div>
                <div className="security-feature">
                  <i className="fas fa-bolt"></i>
                  <div>
                    <h4>Instant Alerts</h4>
                    <p>Immediate notifications for suspicious activities</p>
                  </div>
                </div>
                <div className="security-feature">
                  <i className="fas fa-lock"></i>
                  <div>
                    <h4>Auto Protection</h4>
                    <p>Automatic account lockdown during security threats</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="security-visual">
              <div className="monitor-screen">
                <div className="screen-header">
                  <div className="screen-controls">
                    <div className="control red"></div>
                    <div className="control yellow"></div>
                    <div className="control green"></div>
                  </div>
                  <span>Security Monitor</span>
                </div>
                <div className="screen-content">
                  <div className="threat-level">
                    <div className="threat-indicator low">
                      <span>Threat Level: LOW</span>
                    </div>
                  </div>
                  <div className="activity-feed">
                    <div className="activity-item">
                      <div className="activity-icon success">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>Face authentication verified</span>
                      <span className="activity-time">12:34 PM</span>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon success">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>Behavior pattern normal</span>
                      <span className="activity-time">12:33 PM</span>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon warning">
                        <i className="fas fa-exclamation"></i>
                      </div>
                      <span>New device detected - blocked</span>
                      <span className="activity-time">12:30 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <div className="contact-content">
            <div className="contact-info">
              <h2>Ready to Secure Your Banking?</h2>
              <p>Get started with Zeroday's advanced authentication system and protect your financial future today.</p>
              <div className="contact-methods">
                <div className="contact-method">
                  <i className="fas fa-envelope"></i>
                  <span>aletheawayne@gmail.com</span>
                </div>
                <div className="contact-method">
                  <i className="fas fa-phone"></i>
                  <span>(+91)9006763363</span>
                </div>
                <div className="contact-method">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Gwalior, MP</span>
                </div>
              </div>
            </div>
            <div className="contact-form">
              <form className="form">
                <div className="form-group">
                  <input type="text" placeholder="Full Name" required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Email Address" required />
                </div>
                <div className="form-group">
                  <input type="text" placeholder="Company Name" />
                </div>
                <div className="form-group">
                  <textarea placeholder="Message" rows="4" required></textarea>
                </div>
                <button type="submit" className="btn-primary full-width">
                  <i className="fas fa-paper-plane"></i>
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="brand-logo">
                <i className="fas fa-shield-alt"></i>
                <span>Zeroday</span>
              </div>
              <p>Securing the future of digital banking with advanced authentication technology.</p>
            </div>
            <div className="footer-links">
              <div className="link-group">
                <h4>Product</h4>
                <a href="#">Features</a>
                <a href="#">Security</a>
                <a href="#">Pricing</a>
                <a href="#">Documentation</a>
              </div>
              <div className="link-group">
                <h4>Company</h4>
                <a href="#">Careers</a>
                <a href="#">Press</a>
                <a href="#">Contact</a>
              </div>
              <div className="link-group">
                <h4>Resources</h4>
                <a href="#">Blog</a>
                <a href="#">Help Center</a>
                <a href="#">API Docs</a>
                <a href="#">Status</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Zeroday. All rights reserved.</p>
            <div className="social-links">
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-linkedin"></i></a>
              <a href="#"><i className="fab fa-github"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
