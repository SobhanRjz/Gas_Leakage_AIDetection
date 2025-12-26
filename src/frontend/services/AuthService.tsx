import React, { createContext, useContext, useState, ReactNode } from 'react'

/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean
  user: string | null
}

/**
 * Authentication service interface
 */
export interface IAuthService {
  login(username: string, password: string): Promise<boolean>
  logout(): void
  getAuthState(): AuthState
}

/**
 * Authentication service implementation
 */
export class AuthService implements IAuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
  }

  /**
   * Authenticate user with credentials
   */
  async login(username: string, password: string): Promise<boolean> {
    // Mock authentication - replace with actual API call
    if (username && password) {
      this.authState = {
        isAuthenticated: true,
        user: username,
      }
      return true
    }
    return false
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authState = {
      isAuthenticated: false,
      user: null,
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState }
  }
}

/**
 * Authentication context type
 */
interface AuthContextType {
  authService: IAuthService
  authState: AuthState
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode
}

/**
 * Authentication provider component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authService] = useState<IAuthService>(() => new AuthService())
  const [authState, setAuthState] = useState<AuthState>(() => authService.getAuthState())

  const contextValue: AuthContextType = {
    authService,
    authState,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use authentication service
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
