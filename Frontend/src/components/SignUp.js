import React, { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { supabase } from '../config/supabase'
import { faceRecognitionService, db } from '../services/faceRecognitionService'
import '../styles/auth.css'

const SignUp = ({ onSuccess, onSwitchToLogin }) => {
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Face Registration, 3: Liveness Check
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: ''
  })
  
  // Face registration
  const [capturedImages, setCapturedImages] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [registrationProgress, setRegistrationProgress] = useState({})
  // eslint-disable-next-line no-unused-vars
  const unusedProgress = registrationProgress // Suppress unused warning
  
  // Liveness detection
  const [livenessSession, setLivenessSession] = useState(null)
  const [currentChallenge, setCurrentChallenge] = useState(null)
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [livenessImages, setLivenessImages] = useState([])
  
  const webcamRef = useRef(null)
  const [userId, setUserId] = useState(null)

  // Form validation
  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName || !formData.username) {
      setError('Please fill in all required fields')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long')
      return false
    }
    
    return true
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('') // Clear error when user types
  }

  // Step 1: Basic Information
  const handleBasicInfoSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setError('')
    
    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username
          }
        }
      })
      
      if (error) {
        setError(error.message)
        return
      }
      
      if (data.user) {
        setUserId(data.user.id)
        
        // Immediately sign in the user to establish session
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })
        
        if (signInError) {
          setError(`Account created but sign-in failed: ${signInError.message}`)
          return
        }
        
        console.log('DEBUG: User signed in successfully:', signInData.user?.id)
        
        // Create user profile in database
        try {
          await db.createProfile({
            id: data.user.id,
            email: formData.email,
            username: formData.username,
            full_name: formData.fullName,
            created_at: new Date().toISOString()
          })
        } catch (profileError) {
          console.error('Profile creation error:', profileError)
          // Continue anyway, profile might be created by trigger
        }
        
        setSuccess('Account created successfully! Now let\'s set up face recognition.')
        setTimeout(() => {
          setStep(2)
          setSuccess('')
        }, 2000)
      }
    } catch (err) {
      setError('Registration failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Process face registration
  const processRegistration = useCallback(async (images) => {
    setLoading(true)
    setError('')
    
    console.log('DEBUG: processRegistration called with:', {
      imagesCount: images?.length,
      firstImageStart: images?.[0]?.substring?.(0, 100),
      userId: userId,
      formData: formData
    });
    
    try {
      // Use face recognition service with proper userId
      const result = await faceRecognitionService.registerUserFaces(
        userId, // Use the actual Supabase user ID
        images, // Array of captured images
        {
          minRequiredImages: 2,
          detectionThreshold: 0.8,
          spoofingThreshold: 0.5,
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email
        }
      )
      
      setRegistrationProgress(result)
      
      if (result.success) {
        // Update user profile to indicate face registration completed
        try {
          await db.updateProfile(userId, {
            face_registration_completed: true,
            face_registration_date: new Date().toISOString(),
            total_face_images: result.successCount
          })
        } catch (updateError) {
          console.error('Profile update error:', updateError)
        }
        
        setSuccess(`Face registration complete! ${result.successCount}/${result.totalImages} images processed successfully.`)
        setTimeout(() => {
          setStep(3) // Move to liveness check
        }, 2000)
      } else {
        setError(`Face registration failed: ${result.message}`)
      }
    } catch (err) {
      setError('Registration processing failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, formData.email, formData.username, formData.fullName])

  // Capture image for face registration
  const captureImage = useCallback(async () => {
    if (!webcamRef.current) return
    
    setLoading(true)
    try {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 640,
        height: 480,
        screenshotFormat: 'image/jpeg',
        screenshotQuality: 0.8
      })
      
      console.log('DEBUG: Image captured:', {
        imageSrc: imageSrc?.substring?.(0, 100),
        length: imageSrc?.length,
        type: typeof imageSrc,
        hasDataPrefix: imageSrc?.startsWith?.('data:')
      });
      
      if (imageSrc) {
        // Validate the captured image
        const detectionResult = await faceRecognitionService.detectFace(imageSrc, {
          confidenceThreshold: 0.8
        })
        
        if (!detectionResult.success || detectionResult.faces.length === 0) {
          setError('No face detected. Please ensure your face is clearly visible and try again.')
          return
        }
        
        // Check for anti-spoofing
        const antiSpoofingResult = await faceRecognitionService.checkAntiSpoofing(imageSrc, {
          spoofingThreshold: 0.5
        })
        
        if (!antiSpoofingResult.success || !antiSpoofingResult.isReal) {
          setError('Please use a real face. Potential spoofing detected.')
          return
        }
        
        const newImages = [...capturedImages, imageSrc]
        setCapturedImages(newImages)
        
        setSuccess(`Image ${currentImageIndex + 1} captured successfully!`)
        setCurrentImageIndex(currentImageIndex + 1)
        
        if (newImages.length >= 3) {
          // All images captured, proceed to processing
          setTimeout(() => {
            processRegistration(newImages)
          }, 1000)
        } else {
          setError('')
          setTimeout(() => setSuccess(''), 2000)
        }
      }
    } catch (err) {
      setError('Failed to capture image: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [currentImageIndex, capturedImages, processRegistration])

  // Start liveness detection
  const startLivenessDetection = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Create liveness session
      const challenges = ['blink', 'smile']
      
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

  // Process liveness detection
  const processLivenessDetection = useCallback(async (images, challenges) => {
    setLoading(true)
    setError('')
    
    try {
      const result = await faceRecognitionService.checkLiveness(images, challenges, {
        livenessThreshold: 0.7
      })
      
      if (result.success && result.livenessPassed) {
        setSuccess('Liveness verification successful! Registration complete.')
        
        setTimeout(() => {
          if (onSuccess) {
            onSuccess({ 
              email: formData.email,
              id: userId || `signup_${Date.now()}`
            }, {
              email: formData.email,
              username: formData.username,
              fullName: formData.fullName,
              registration_completed: true
            })
          }
        }, 2000)
        
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
  }, [formData.email, formData.username, formData.fullName, userId, onSuccess])

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

  // Restart face registration
  const restartFaceRegistration = () => {
    setCapturedImages([])
    setCurrentImageIndex(0)
    setRegistrationProgress({})
    setError('')
    setSuccess('')
  }

  // Challenge instructions
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
          <h2>Create Account</h2>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <form onSubmit={handleBasicInfoSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="Choose a username"
                pattern="[a-zA-Z0-9_]+"
                title="Username can only contain letters, numbers, and underscores"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
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

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Create a password (min 6 characters)"
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Confirm your password"
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Next: Face Registration'}
            </button>
          </form>
        )}

        {/* Step 2: Face Registration */}
        {step === 2 && (
          <div className="face-registration">
            <h3>Face Registration</h3>
            <p>We need to capture 3 images of your face for secure authentication.</p>
            
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

            <div className="progress-indicator">
              <span>Image {currentImageIndex + 1} of 3</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(currentImageIndex / 3) * 100}%` }}
                />
              </div>
            </div>

            <div className="instruction">
              <p>Position your face in the center of the camera. Ensure good lighting.</p>
            </div>

            <div className="button-group">
              <button 
                onClick={captureImage} 
                className="auth-button capture-button"
                disabled={loading || currentImageIndex >= 3}
              >
                {loading ? 'Processing...' : `Capture Image ${currentImageIndex + 1}`}
              </button>
              
              {capturedImages.length > 0 && (
                <button 
                  onClick={restartFaceRegistration} 
                  className="auth-button secondary"
                  disabled={loading}
                >
                  Start Over
                </button>
              )}
            </div>

            {/* Show captured images */}
            {capturedImages.length > 0 && (
              <div className="captured-images">
                <h4>Captured Images:</h4>
                <div className="image-grid">
                  {capturedImages.map((img, index) => (
                    <img 
                      key={index} 
                      src={img} 
                      alt={`Captured ${index + 1}`} 
                      className="captured-image"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Liveness Detection */}
        {step === 3 && (
          <div className="liveness-detection">
            <h3>Liveness Verification</h3>
            <p>Please follow the instructions to verify you are a real person.</p>
            
            {!livenessSession ? (
              <div className="liveness-start">
                <p>This step ensures the security of your account by verifying that you are a real person.</p>
                <button 
                  onClick={startLivenessDetection} 
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Starting...' : 'Start Liveness Check'}
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

        {/* Switch to Login */}
        <div className="auth-switch">
          <p>
            Already have an account?{' '}
            <button 
              onClick={onSwitchToLogin}
              className="link-button"
              disabled={loading}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp
