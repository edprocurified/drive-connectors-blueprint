import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { PublicClientApplication } from '@azure/msal-browser'
import { AuthState, AuthTokens } from '../types'
import { msalConfig, loginRequest } from '../config/msalConfig'

interface AuthContextType extends AuthState {
  loginWithGoogle: () => void
  loginWithMicrosoft: () => Promise<void>
  logout: () => void
  setTokens: (tokens: AuthTokens) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const msalInstance = new PublicClientApplication(msalConfig)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    tokens: null,
    loading: true,
    provider: null
  })

  useEffect(() => {
    const initializeMsal = async () => {
      console.log('Initializing MSAL...')
      try {
        await msalInstance.initialize()
        console.log('MSAL initialized successfully')
      } catch (error) {
        console.error('MSAL initialization failed:', error)
      }
    }

    const loadStoredTokens = () => {
      console.log('AuthProvider useEffect: checking stored tokens')
      const storedTokens = localStorage.getItem('drive_tokens')
      console.log('Stored tokens:', storedTokens)
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens) as AuthTokens
        console.log('Parsed tokens:', tokens)
        setAuthState({
          isAuthenticated: true,
          tokens,
          loading: false,
          provider: tokens.provider
        })
      } else {
        console.log('No stored tokens found')
        setAuthState(prev => ({ ...prev, loading: false }))
      }
    }

    initializeMsal().then(loadStoredTokens)
  }, [])

  const loginWithGoogle = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI
    const scope = 'https://www.googleapis.com/auth/drive.readonly'
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=online`

    window.location.href = authUrl
  }

  const loginWithMicrosoft = async () => {
    try {
      const response = await msalInstance.loginPopup(loginRequest)
      
      if (response) {
        const tokens: AuthTokens = {
          access_token: response.accessToken,
          token_type: 'Bearer',
          expires_in: Math.floor((response.expiresOn!.getTime() - Date.now()) / 1000),
          scope: response.scopes.join(' '),
          provider: 'microsoft'
        }
        
        setTokens(tokens)
      }
    } catch (error) {
      console.error('Microsoft login failed:', error)
    }
  }

  const logout = () => {
    localStorage.removeItem('drive_tokens')
    
    if (authState.provider === 'microsoft') {
      msalInstance.logoutPopup()
    }
    
    setAuthState({
      isAuthenticated: false,
      tokens: null,
      loading: false,
      provider: null
    })
  }

  const setTokens = (tokens: AuthTokens) => {
    console.log('setTokens called with:', tokens)
    localStorage.setItem('drive_tokens', JSON.stringify(tokens))
    setAuthState({
      isAuthenticated: true,
      tokens,
      loading: false,
      provider: tokens.provider
    })
    console.log('Auth state updated')
  }

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      loginWithGoogle, 
      loginWithMicrosoft, 
      logout, 
      setTokens 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}