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
  getToken(): string | null
  init(): Promise<void>
  setAuthStateCallback(callback: (state: AuthState) => void): void
}

/**
 * Authentication service implementation
 */
export class AuthService implements IAuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
  }
  private authStateCallback: ((state: AuthState) => void) | null = null

  /**
   * Authenticate user with credentials
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('access_token', data.access_token)
        this.updateAuthState({
          isAuthenticated: true,
          user: username,
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('access_token')
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
    })
  }

  /**
   * Verify token with backend
   */
  async verifyToken(): Promise<boolean> {
    const token = localStorage.getItem('access_token')
    if (!token) return false

    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        this.updateAuthState({
          isAuthenticated: true,
          user: data.username,
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Token verification error:', error)
      return false
    }
  }

  /**
   * Initialize authentication state by checking for existing token
   */
  async init(): Promise<void> {
    await this.verifyToken()
  }

  /**
   * Set callback for auth state changes
   */
  setAuthStateCallback(callback: (state: AuthState) => void): void {
    this.authStateCallback = callback
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  /**
   * Get access token
   */
  getToken(): string | null {
    return localStorage.getItem('access_token')
  }

  /**
   * Update auth state and notify callback
   */
  private updateAuthState(newState: AuthState): void {
    this.authState = newState
    if (this.authStateCallback) {
      this.authStateCallback(newState)
    }
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

  React.useEffect(() => {
    authService.setAuthStateCallback(setAuthState)

    const initializeAuth = async () => {
      await authService.init()
    }
    initializeAuth()
  }, [authService])

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
