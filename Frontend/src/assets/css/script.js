// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const navbar = document.querySelector('.navbar');

// Mobile Menu Toggle
hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('active');
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate elements on scroll
const animateElements = document.querySelectorAll('.feature-card, .security-feature, .contact-method');
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// Counter animation for stats
const animateCounters = () => {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = counter.innerText;
        const isPercentage = target.includes('%');
        const isPlus = target.includes('+');
        const numericValue = parseFloat(target.replace(/[^\d.]/g, ''));
        
        let current = 0;
        const increment = numericValue / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
                current = numericValue;
                clearInterval(timer);
            }
            
            let displayValue = current.toFixed(1);
            if (numericValue >= 1000000) {
                displayValue = (current / 1000000).toFixed(1) + 'M';
            } else if (numericValue >= 1000) {
                displayValue = (current / 1000).toFixed(1) + 'K';
            }
            
            counter.innerText = displayValue + (isPercentage ? '%' : '') + (isPlus ? '+' : '');
        }, 20);
    });
};

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Form handling
const contactForm = document.querySelector('.form');
contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Simulate form submission
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        submitBtn.style.background = 'linear-gradient(135deg, #00ff88, #00d4ff)';
        
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
            e.target.reset();
        }, 2000);
    }, 1500);
});

// Security dashboard real-time updates
const updateSecurityDashboard = () => {
    const activityFeed = document.querySelector('.activity-feed');
    if (!activityFeed) return;
    
    const activities = [
        { type: 'success', icon: 'fas fa-check', text: 'Face authentication verified', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
        { type: 'success', icon: 'fas fa-check', text: 'Behavior pattern normal', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
        { type: 'warning', icon: 'fas fa-exclamation', text: 'New device detected - blocked', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
        { type: 'success', icon: 'fas fa-check', text: 'Transaction approved', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
        { type: 'success', icon: 'fas fa-shield-alt', text: 'SIM swap protection active', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
    ];
    
    setInterval(() => {
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        const activityItems = activityFeed.querySelectorAll('.activity-item');
        
        // Remove oldest activity if we have too many
        if (activityItems.length >= 4) {
            activityItems[activityItems.length - 1].remove();
        }
        
        // Create new activity item
        const newActivity = document.createElement('div');
        newActivity.className = 'activity-item';
        newActivity.style.opacity = '0';
        newActivity.style.transform = 'translateX(-20px)';
        newActivity.innerHTML = `
            <div class="activity-icon ${randomActivity.type}">
                <i class="${randomActivity.icon}"></i>
            </div>
            <span>${randomActivity.text}</span>
            <span class="activity-time">${randomActivity.time}</span>
        `;
        
        // Insert at the beginning
        activityFeed.insertBefore(newActivity, activityFeed.firstChild);
        
        // Animate in
        setTimeout(() => {
            newActivity.style.opacity = '1';
            newActivity.style.transform = 'translateX(0)';
        }, 100);
    }, 5000);
};

// Start security dashboard updates
updateSecurityDashboard();

// Parallax effect for floating shapes
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const shapes = document.querySelectorAll('.shape');
    
    shapes.forEach((shape, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = -(scrolled * speed);
        shape.style.transform = `translateY(${yPos}px) rotate(${scrolled * 0.1}deg)`;
    });
});

// Simple hero title display - no complex animations to avoid conflicts
console.log('Script loaded - hero title should be visible');

// Add glitch effect to security elements
const addGlitchEffect = () => {
    const securityElements = document.querySelectorAll('.security-dashboard, .monitor-screen');
    
    securityElements.forEach(element => {
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance
                element.style.filter = 'hue-rotate(180deg)';
                setTimeout(() => {
                    element.style.filter = '';
                }, 100);
            }
        }, 2000);
    });
};

// Initialize glitch effect
addGlitchEffect();

// Add mouse follow effect for cursor
document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.cursor');
    if (!cursor) {
        const newCursor = document.createElement('div');
        newCursor.className = 'cursor';
        newCursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(0, 212, 255, 0.5), transparent);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: all 0.1s ease;
        `;
        document.body.appendChild(newCursor);
    }
    
    const cursorElement = document.querySelector('.cursor');
    cursorElement.style.left = e.clientX - 10 + 'px';
    cursorElement.style.top = e.clientY - 10 + 'px';
});

// Add hover effects for interactive elements
document.querySelectorAll('button, .nav-link, .feature-card').forEach(element => {
    element.addEventListener('mouseenter', () => {
        const cursor = document.querySelector('.cursor');
        if (cursor) {
            cursor.style.transform = 'scale(2)';
            cursor.style.background = 'radial-gradient(circle, rgba(255, 0, 110, 0.5), transparent)';
        }
    });
    
    element.addEventListener('mouseleave', () => {
        const cursor = document.querySelector('.cursor');
        if (cursor) {
            cursor.style.transform = 'scale(1)';
            cursor.style.background = 'radial-gradient(circle, rgba(0, 212, 255, 0.5), transparent)';
        }
    });
});

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .navbar.scrolled {
        background: rgba(10, 10, 10, 0.95);
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
    }
    
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            top: 70px;
            left: -100%;
            width: 100%;
            height: calc(100vh - 70px);
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(20px);
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding-top: 2rem;
            transition: left 0.3s ease;
        }
        
        .nav-menu.active {
            left: 0;
        }
        
        .hamburger.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .hamburger.active span:nth-child(2) {
            opacity: 0;
        }
        
        .hamburger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
    }
`;
document.head.appendChild(style);
