import React, { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthService'
import Header from './Header'
import './Layout.css'

/**
 * Layout component props
 */
interface LayoutProps {
  children: ReactNode
}

/**
 * Main layout component with header and navigation
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { authState } = useAuth()
  const location = useLocation()
  const isLandingPage = location.pathname === '/'
  const isLoginPage = location.pathname === '/login'

  return (
    <div className="layout">
      {!isLandingPage && !isLoginPage && <Header isAuthenticated={authState.isAuthenticated} />}
      <main className={`main-content ${isLoginPage ? 'no-header' : ''}`}>
        {children}
      </main>
    </div>
  )
}

export default Layout
