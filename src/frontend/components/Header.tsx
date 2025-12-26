import React, { useState, useEffect, createContext, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthService'
import './Header.css'

// Theme Context
export const ThemeContext = createContext<{
  isDarkTheme: boolean;
  setIsDarkTheme: (theme: boolean) => void;
}>({
  isDarkTheme: false,
  setIsDarkTheme: () => {}
});

/**
 * Header component props
 */
interface HeaderProps {
  isAuthenticated: boolean
}

// Theme Provider Component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Apply theme class to document body
  React.useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    } else {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    }
  }, [isDarkTheme]);

  return (
    <ThemeContext.Provider value={{ isDarkTheme, setIsDarkTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Application header with navigation
 */
const Header: React.FC<HeaderProps> = ({ isAuthenticated }) => {
  const { authService } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const { isDarkTheme, setIsDarkTheme } = useContext(ThemeContext)

  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    authService.logout()
    navigate('/')
  }

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''} ${isLandingPage ? 'landing-page-header' : 'other-pages-header'}`}>
      <div className="header-container modern">
        {/* Left: Brand */}
        <Link to="/" className="brand">
          <img src={`${import.meta.env.VITE_BASE || '/'}Logo.jpg`} alt="Gas Pipeline Monitor" />
          <span className="brand-name">Pipeline Monitor</span>
        </Link>

        {/* Center: Primary nav */}
        <nav className="nav-center">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/overview" className={`nav-link ${location.pathname === '/overview' ? 'active' : ''}`}>Overview</Link>
          <Link to="/upload" className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}>Upload</Link>
          <Link to="/reports" className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}>Reports</Link>
          <Link to="/ai-mode" className={`nav-link ${location.pathname === '/ai-mode' ? 'active' : ''}`}>AI Mode</Link>
          <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
          <span className="active-indicator" aria-hidden="true"></span>
        </nav>

        {/* Right: Theme + Auth */}
        <div className="nav-right">
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className="icon-btn theme-toggle-modern"
            title={`Switch to ${isDarkTheme ? 'Light' : 'Dark'} theme`}
            aria-label="Toggle theme"
          >
            {isDarkTheme ? '☀️' : '🌙'}
          </button>

          {isAuthenticated ? (
            <button onClick={handleLogout} className="pill-btn">
              Logout
            </button>
          ) : (
            <Link to="/login" className="pill-btn">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
