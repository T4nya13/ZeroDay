import React, { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { supabase } from '../config/supabase'
import { faceRecognitionService, db } from '../services/faceRecognitionService'
import '../styles/auth.css'

const Login = ({ onSuccess, onSwitchToSignUp }) => {
  const [loginMethod, setLoginMethod] = useState('face') // 'face' or 'password'
  const [step, setStep] = useState(1) // 1: Method selection, 2: Face login, 3: Liveness check
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  // Face login
  const [capturedImage, setCapturedImage] = useState(null)
  
  // Liveness detection
  const [livenessSession, setLivenessSession] = useState(null)
  const [currentChallenge, setCurrentChallenge] = useState(null)
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [livenessImages, setLivenessImages] = useState([])
  
  const webcamRef = useRef(null)
  const [userProfile, setUserProfile] = useState(null)

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  // Password login
  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })
      
      if (error) {
        setError(error.message)
        return
      }
      
      if (data.user) {
        // Get user profile from database
        const profileResult = await db.getProfile(data.user.id)
        
        setSuccess('Login successful!')
        setTimeout(() => {
          if (onSuccess) onSuccess(data.user, profileResult.data || { email: data.user.email })
        }, 1000)
      }
    } catch (err) {
      setError('Login failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Start face login process
  const startFaceLogin = () => {
    if (!formData.email) {
      setError('Please enter your email address first')
      return
    }
    
    setStep(2)
    setError('')
    setSuccess('')
  }

  // Complete login process
  const completeLogin = useCallback(async (email, profile) => {
    try {
      setSuccess('Login successful!')
      setTimeout(() => {
        if (onSuccess) onSuccess({ email: email }, profile)
      }, 1000)
      
    } catch (err) {
      setError('Failed to complete login: ' + err.message)
    }
  }, [onSuccess])

  // Process face authentication
  const processFaceAuthentication = useCallback(async (imageData) => {
    setLoading(true)
    setError('')
    
    try {
      // First, get user profile from Supabase by email
      let userId
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', formData.email)
          .single()
        
        if (profileError || !profileData) {
          setError('User not found. Please check your email or sign up first.')
          return
        }
        
        userId = profileData.id
        setUserProfile(profileData)
      } catch (err) {
        setError('Failed to find user profile. Please try again.')
        return
      }

      // Use the updated face recognition service with userId
      const result = await faceRecognitionService.authenticateUser(
        userId, 
        imageData, 
        false, // Skip liveness for initial authentication
        {
          similarityThreshold: 0.6,
          detectionThreshold: 0.7,
          spoofingThreshold: 0.5
        }
      )
      
      if (result.success) {
        // Face authentication successful - now create Supabase session
        try {
          // In a production app, you would typically:
          // 1. Verify the face auth result on your backend
          // 2. Generate a secure session token
          // 3. Sign in the user with that token
          
          // For now, we'll use a different approach since we don't have password
          // We'll mark the user as authenticated via face recognition
          
          setSuccess(`Face authentication successful! Confidence: ${(result.confidence * 100).toFixed(1)}%`)
          
          // Update last login time
          await db.updateProfile(userId, {
            last_login_at: new Date().toISOString(),
            failed_login_attempts: 0
          })
          
          // Complete the login process
          setTimeout(() => {
            if (onSuccess) {
              onSuccess(
                { 
                  id: userId,
                  email: formData.email,
                  auth_method: 'face_recognition'
                }, 
                {
                  ...userProfile,
                  authentication_method: 'face_recognition',
                  confidence: result.confidence,
                  verification_details: result.details
                }
              )
            }
          }, 1500)
          
        } catch (authError) {
          console.error('Authentication completion error:', authError)
          setError('Face authentication successful but session creation failed')
        }
      } else {
        setError(`Face authentication failed: ${result.message}`)
        setCapturedImage(null)
        
        // Increment failed login attempts
        if (userId) {
          try {
            const currentAttempts = userProfile?.failed_login_attempts || 0
            await db.updateProfile(userId, {
              failed_login_attempts: currentAttempts + 1,
              last_failed_login_at: new Date().toISOString()
            })
          } catch (err) {
            console.error('Failed to update login attempts:', err)
          }
        }
      }
    } catch (err) {
      setError('Authentication processing failed: ' + err.message)
      setCapturedImage(null)
    } finally {
      setLoading(false)
    }
  }, [formData.email, onSuccess, userProfile])

  // Capture image for face login
  const captureFaceImage = useCallback(async () => {
    if (!webcamRef.current) return
    
    setLoading(true)
    try {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 640,
        height: 480,
        screenshotFormat: 'image/jpeg',
        screenshotQuality: 0.8
      })
      
      if (imageSrc) {
        setCapturedImage(imageSrc)
        
        // Validate the captured image
        const detectionResult = await faceRecognitionService.detectFace(imageSrc, {
          confidenceThreshold: 0.7
        })
        
        if (!detectionResult.success || detectionResult.faces.length === 0) {
          setError('No face detected. Please ensure your face is clearly visible and try again.')
          setCapturedImage(null)
          return
        }
        
        setSuccess('Face captured! Processing authentication...')
        
        // Process face authentication
        await processFaceAuthentication(imageSrc)
      }
    } catch (err) {
      setError('Failed to capture image: ' + err.message)
      setCapturedImage(null)
    } finally {
      setLoading(false)
    }
  }, [processFaceAuthentication])

  // Start liveness detection for two-factor authentication
  const startLivenessDetection = async () => {
    setLoading(true)
    setError('')
    
    try {
      const challenges = ['blink', 'smile']
      
      // For this demo, we'll create a simple liveness session object
      const livenessSessionData = {
        session_token: `liveness_${Date.now()}`,
        challenges: challenges,
        status: 'active',
        created_at: new Date().toISOString()
      }
      
      setLivenessSession(livenessSessionData)
      setCurrentChallenge(challenges[0])
      setChallengeIndex(0)
      setLivenessImages([])
      
    } catch (err) {
      setError('Failed to start liveness detection: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Process liveness detection for login
  const processLivenessDetection = useCallback(async (images, challenges) => {
    setLoading(true)
    setError('')
    
    try {
      const result = await faceRecognitionService.checkLiveness(images, challenges, {
        livenessThreshold: 0.7
      })
      
      if (result.success && result.livenessPassed) {
        setSuccess('Liveness verification successful!')
        
        // Complete login
        await completeLogin(formData.email, userProfile)
        
      } else {
        setError('Liveness detection failed. Please try again.')
        // Reset liveness detection
        setLivenessSession(null)
        setCurrentChallenge(null)
        setChallengeIndex(0)
        setLivenessImages([])
      }
    } catch (err) {
      setError('Liveness processing failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [formData.email, userProfile, completeLogin])

  // Capture image for liveness challenge
  const captureLivenessImage = useCallback(async () => {
    if (!webcamRef.current || !currentChallenge) return
    
    setLoading(true)
    try {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 640,
        height: 480,
        screenshotFormat: 'image/jpeg',
        screenshotQuality: 0.8
      })
      
      if (imageSrc) {
        const newImages = [...livenessImages, imageSrc]
        setLivenessImages(newImages)
        
        const nextIndex = challengeIndex + 1
        const challenges = livenessSession.challenges
        
        if (nextIndex < challenges.length) {
          // Move to next challenge
          setChallengeIndex(nextIndex)
          setCurrentChallenge(challenges[nextIndex])
          setSuccess(`${currentChallenge} captured! Now: ${challenges[nextIndex]}`)
        } else {
          // All challenges completed
          setSuccess('All challenges completed! Processing liveness detection...')
          setTimeout(() => {
            processLivenessDetection(newImages, challenges)
          }, 1000)
        }
      }
    } catch (err) {
      setError('Failed to capture liveness image: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [currentChallenge, challengeIndex, livenessImages, livenessSession, processLivenessDetection])

  // Reset to method selection
  const resetToMethodSelection = () => {
    setStep(1)
    setError('')
    setSuccess('')
    setCapturedImage(null)
    setLivenessSession(null)
    setCurrentChallenge(null)
    setChallengeIndex(0)
    setLivenessImages([])
    setUserProfile(null)
  }

  // Get challenge instruction
  const getChallengeInstruction = (challenge) => {
    const instructions = {
      blink: 'Please blink your eyes naturally',
      smile: 'Please smile naturally',
      turn_left: 'Please turn your head to the left',
      turn_right: 'Please turn your head to the right'
    }
    return instructions[challenge] || 'Please follow the instruction'
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          {step > 1 && (
            <button 
              onClick={resetToMethodSelection}
              className="back-button"
              disabled={loading}
            >
              ← Back
            </button>
          )}
        </div>

        {/* Step 1: Method Selection */}
        {step === 1 && (
          <div className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email address"
              />
            </div>

            <div className="login-methods">
              <div className="method-tabs">
                <button 
                  className={`method-tab ${loginMethod === 'face' ? 'active' : ''}`}
                  onClick={() => setLoginMethod('face')}
                >
                  Face Recognition
                </button>
                <button 
                  className={`method-tab ${loginMethod === 'password' ? 'active' : ''}`}
                  onClick={() => setLoginMethod('password')}
                >
                  Password
                </button>
              </div>

              {loginMethod === 'password' && (
                <form onSubmit={handlePasswordLogin}>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your password"
                    />
                  </div>
                  
                  <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In with Password'}
                  </button>
                </form>
              )}

              {loginMethod === 'face' && (
                <div className="face-login-intro">
                  <div className="face-icon">📸</div>
                  <p>Use your face to sign in securely</p>
                  <button 
                    onClick={startFaceLogin}
                    className="auth-button"
                    disabled={loading || !formData.email}
                  >
                    Continue with Face Recognition
                  </button>
                  {!formData.email && (
                    <small className="form-hint">Please enter your email first</small>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Face Authentication */}
        {step === 2 && (
          <div className="face-authentication">
            <h3>Face Authentication</h3>
            <p>Position your face in the center of the camera</p>
            
            <div className="webcam-container">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                width={400}
                height={300}
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: 'user'
                }}
              />
            </div>

            <div className="instruction">
              <p>Ensure good lighting and look directly at the camera</p>
            </div>

            <div className="button-group">
              <button 
                onClick={captureFaceImage} 
                className="auth-button capture-button"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Authenticate with Face'}
              </button>
            </div>

            {/* Show captured image */}
            {capturedImage && (
              <div className="captured-preview">
                <h4>Captured Image:</h4>
                <img 
                  src={capturedImage} 
                  alt="Captured face" 
                  className="captured-image"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Liveness Detection */}
        {step === 3 && (
          <div className="liveness-detection">
            <h3>Two-Factor Authentication</h3>
            <p>Additional security verification required</p>
            
            {!livenessSession ? (
              <div className="liveness-start">
                <p>Complete these challenges to verify your identity</p>
                <button 
                  onClick={startLivenessDetection} 
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Starting...' : 'Start Verification'}
                </button>
              </div>
            ) : (
              <div className="liveness-challenge">
                <div className="webcam-container">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    width={400}
                    height={300}
                    videoConstraints={{
                      width: 640,
                      height: 480,
                      facingMode: 'user'
                    }}
                  />
                </div>

                <div className="challenge-instruction">
                  <h4>Challenge {challengeIndex + 1} of {livenessSession.challenges.length}</h4>
                  <p>{getChallengeInstruction(currentChallenge)}</p>
                </div>

                <button 
                  onClick={captureLivenessImage} 
                  className="auth-button capture-button"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Capture'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error and Success Messages */}
        {error && <div className="auth-message error">{error}</div>}
        {success && <div className="auth-message success">{success}</div>}

        {/* Switch to Sign Up */}
        <div className="auth-switch">
          <p>
            Don't have an account?{' '}
            <button 
              onClick={onSwitchToSignUp}
              className="link-button"
              disabled={loading}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
