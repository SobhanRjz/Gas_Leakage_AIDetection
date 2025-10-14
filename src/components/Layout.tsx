import React, { ReactNode } from 'react'
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

  return (
    <div className="layout">
      <Header isAuthenticated={authState.isAuthenticated} />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout
