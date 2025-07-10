import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthCallback() {
  const { setTokens } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('AuthCallback useEffect')
    const hash = window.location.hash.substring(1)
    console.log('URL hash:', hash)
    const params = new URLSearchParams(hash)
    
    const accessToken = params.get('access_token')
    const tokenType = params.get('token_type')
    const expiresIn = params.get('expires_in')
    const scope = params.get('scope')

    console.log('Extracted params:', { accessToken: !!accessToken, tokenType, expiresIn, scope })

    if (accessToken && tokenType && expiresIn && scope) {
      console.log('Valid tokens found, setting tokens')
      setTokens({
        access_token: accessToken,
        token_type: tokenType,
        expires_in: parseInt(expiresIn),
        scope: scope,
        provider: 'google'
      })
      console.log('Navigating to /files')
      navigate('/files')
    } else {
      console.error('Failed to get tokens from callback', { accessToken: !!accessToken, tokenType, expiresIn, scope })
      navigate('/')
    }
  }, [setTokens, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    </div>
  )
}