import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthService'
import './Header.css'

/**
 * Header component props
 */
interface HeaderProps {
  isAuthenticated: boolean
}

/**
 * Application header with navigation
 */
const Header: React.FC<HeaderProps> = ({ isAuthenticated }) => {
  const { authService } = useAuth()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)

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
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <Link to="/" className="logo">
          <img src="/Logo.jpg" alt="Gas Pipeline Monitor" className="logo-image" />
        </Link>
        <nav className="nav">
          <a href="#features" className="nav-link">
            Features
          </a>
          <Link to="/docs" className="nav-link">
            Docs
          </Link>
          <Link to="/about" className="nav-link">
            About
          </Link>
          <Link to="/contact" className="nav-link">
            Contact
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/overview" className="nav-link">
                Overview
              </Link>
              <button onClick={handleLogout} className="nav-button">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link login-link">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
