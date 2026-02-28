import React, { useState, useEffect } from 'react'
import { auth } from '../config/supabase'
import Login from './Login'
import SignUp from './SignUp'
import '../styles/auth.css'

const AuthNew = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState('login') // 'login' or 'signup'
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing auth session
    const checkAuth = async () => {
      try {
        const { data } = await auth.getCurrentUser()
        if (data.user) {
          setUser(data.user)
          if (onAuthSuccess) {
            onAuthSuccess(data.user)
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        if (onAuthSuccess) {
          onAuthSuccess(session.user)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [onAuthSuccess])

  const handleAuthSuccess = (userData, profileData) => {
    setUser(userData)
    if (onAuthSuccess) {
      onAuthSuccess(userData, profileData)
    }
  }

  const switchToSignUp = () => {
    setAuthMode('signup')
  }

  const switchToLogin = () => {
    setAuthMode('login')
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (user) {
    // User is authenticated, this component should no longer be shown
    return null
  }

  return (
    <div className="auth-wrapper-new">
      {authMode === 'login' ? (
        <Login 
          onSuccess={handleAuthSuccess}
          onSwitchToSignUp={switchToSignUp}
        />
      ) : (
        <SignUp 
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={switchToLogin}
        />
      )}
    </div>
  )
}

export default AuthNew
