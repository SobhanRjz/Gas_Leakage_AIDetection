import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './services/AuthService'
import { ThemeProvider } from './components/Header'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import ReportPage from './pages/ReportPage'

/**
 * Main application component with routing configuration
 */
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router basename="/Gas_Leakage_AIDetection">
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/reports" element={<ReportPage />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
