import axios from 'axios'
import { db, storage, supabase } from '../config/supabase'

// Configuration
const FACE_API_BASE_URL = 'http://localhost:8000' // Python Flask server
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000

class FaceRecognitionService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: FACE_API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // Helper function to convert base64 to proper format
  cleanBase64Image(base64String) {
    // Validate input
    if (!base64String || typeof base64String !== 'string') {
      throw new Error('Invalid base64 string: input is empty or not a string')
    }

    // Remove data URL prefix if present
    if (base64String.startsWith('data:image')) {
      base64String = base64String.split(',')[1]
    }

    // Validate the cleaned string
    if (!base64String || base64String.length < 4) {
      throw new Error('Invalid base64 string: too short after cleaning')
    }

    return base64String.trim()
  }

  // Retry mechanism for API calls
  async retryApiCall(apiCall, attempts = MAX_RETRY_ATTEMPTS) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await apiCall()
      } catch (error) {
        console.log(`API call attempt ${i + 1} failed:`, error.message)
        if (i === attempts - 1) throw error
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)))
      }
    }
  }

  // 1. Face Detection and Validation
  async detectFace(imageData, options = {}) {
    try {
      const cleanImage = typeof imageData === 'string' ? this.cleanBase64Image(imageData) : imageData
      
      const requestData = {
        image: cleanImage,
        options: {
          min_face_size: options.minFaceSize || 100,
          max_faces: options.maxFaces || 1,
          confidence_threshold: options.confidenceThreshold || 0.7,
          ...options
        }
      }

      const response = await this.retryApiCall(async () => {
        return await this.apiClient.post('/detect_face', requestData)
      })

      return {
        success: response.data.success || false,
        faces: response.data.face_count || 0,
        facesDetected: response.data.faces_detected || false,
        confidence: response.data.confidence || 0,
        message: response.data.message || '',
        processingTime: response.data.processing_time || 0
      }
    } catch (error) {
      console.error('Face detection error:', error)
      return {
        success: false,
        faces: 0,
        facesDetected: false,
        confidence: 0,
        message: error.response?.data?.message || 'Face detection failed',
        error: error.message
      }
    }
  }

  // 2. Anti-Spoofing Detection
  async checkAntiSpoofing(imageData, options = {}) {
    try {
      const cleanImage = typeof imageData === 'string' ? this.cleanBase64Image(imageData) : imageData
      
      const requestData = {
        image: cleanImage,
        options: {
          spoofing_threshold: options.spoofingThreshold || 0.5,
          model_type: options.modelType || 'default',
          ...options
        }
      }

      const response = await this.retryApiCall(async () => {
        return await this.apiClient.post('/check_anti_spoofing', requestData)
      })

      return {
        success: response.data.success || false,
        isReal: response.data.is_real || false,
        confidence: response.data.confidence || 0,
        antiSpoofingPassed: response.data.anti_spoofing_passed || false,
        message: response.data.message || '',
        processingTime: response.data.processing_time || 0
      }
    } catch (error) {
      console.error('Anti-spoofing check error:', error)
      return {
        success: false,
        isReal: false,
        confidence: 0,
        antiSpoofingPassed: false,
        message: error.response?.data?.message || 'Anti-spoofing check failed',
        error: error.message
      }
    }
  }

  // 3. Liveness Detection
  async checkLiveness(imageSequence, challenges, options = {}) {
    try {
      const cleanImages = imageSequence.map(img => 
        typeof img === 'string' ? this.cleanBase64Image(img) : img
      )
      
      const requestData = {
        images: cleanImages,
        challenge_type: challenges[0] || 'blink',
        options: {
          liveness_threshold: options.livenessThreshold || 0.7,
          movement_threshold: options.movementThreshold || 0.3,
          ...options
        }
      }

      const response = await this.retryApiCall(async () => {
        return await this.apiClient.post('/check_liveness', requestData, {
          timeout: 45000 // Longer timeout for liveness detection
        })
      })

      return {
        success: response.data.success || false,
        livenessPassed: response.data.liveness_passed || false,
        confidence: response.data.confidence || 0,
        challengeType: response.data.challenge_type || challenges[0],
        facesDetected: response.data.faces_detected || 0,
        totalImages: response.data.total_images || imageSequence.length,
        message: response.data.message || '',
        processingTime: response.data.processing_time || 0
      }
    } catch (error) {
      console.error('Liveness detection error:', error)
      return {
        success: false,
        livenessPassed: false,
        confidence: 0,
        message: error.response?.data?.message || 'Liveness detection failed',
        error: error.message
      }
    }
  }

  // 4. Face Embedding Generation
  async generateEmbedding(imageData, options = {}) {
    try {
      const formData = new FormData()
      
      if (imageData instanceof Blob) {
        formData.append('image', imageData, 'embedding_gen.jpg')
      } else {
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
        const blob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: 'image/jpeg' })
        formData.append('image', blob, 'embedding_gen.jpg')
      }

      formData.append('options', JSON.stringify({
        model_name: options.modelName || 'ArcFace',
        normalize: options.normalize !== false,
        detector_backend: options.detectorBackend || 'opencv',
        ...options
      }))

      const response = await this.retryApiCall(async () => {
        return await this.apiClient.post('/generate_embedding', formData)
      })

      return {
        success: response.data.success,
        embedding: response.data.embedding,
        confidence: response.data.confidence,
        faceArea: response.data.face_area,
        modelConfig: response.data.model_config || {},
        qualityScore: response.data.quality_score,
        message: response.data.message,
        processingTime: response.data.processing_time
      }
    } catch (error) {
      console.error('Embedding generation error:', error)
      return {
        success: false,
        embedding: null,
        confidence: 0,
        message: error.response?.data?.message || 'Embedding generation failed',
        error: error.message
      }
    }
  }

  // 5. Face Verification (Compare faces)
  async verifyFace(newImageData, storedEmbeddings, options = {}) {
    try {
      const formData = new FormData()
      
      if (newImageData instanceof Blob) {
        formData.append('image', newImageData, 'verify_image.jpg')
      } else {
        const base64Data = newImageData.replace(/^data:image\/[a-z]+;base64,/, '')
        const blob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: 'image/jpeg' })
        formData.append('image', blob, 'verify_image.jpg')
      }

      formData.append('stored_embeddings', JSON.stringify(storedEmbeddings))
      formData.append('options', JSON.stringify({
        similarity_threshold: options.similarityThreshold || 0.6,
        model_name: options.modelName || 'ArcFace',
        verification_method: options.verificationMethod || 'cosine',
        ...options
      }))

      const response = await this.retryApiCall(async () => {
        return await this.apiClient.post('/verify_face', formData)
      })

      return {
        success: response.data.success,
        isMatch: response.data.is_match,
        confidence: response.data.confidence,
        similarity: response.data.similarity,
        bestMatch: response.data.best_match,
        allScores: response.data.all_scores || [],
        threshold: response.data.threshold,
        message: response.data.message,
        processingTime: response.data.processing_time
      }
    } catch (error) {
      console.error('Face verification error:', error)
      return {
        success: false,
        isMatch: false,
        confidence: 0,
        similarity: 0,
        message: error.response?.data?.message || 'Face verification failed',
        error: error.message
      }
    }
  }

  // 6. Complete Registration Flow - Integrated with Supabase
  async registerUserFaces(userId, imageDataArray, options = {}) {
    try {
      // Check current user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('DEBUG: Auth check:', { 
        user: user?.id, 
        userId, 
        authError,
        isAuthenticated: !!user 
      })

      if (authError || !user) {
        throw new Error(`User not authenticated: ${authError?.message || 'No user found'}`)
      }

      if (user.id !== userId) {
        throw new Error(`User ID mismatch: auth=${user.id}, provided=${userId}`)
      }

      console.log('DEBUG: registerUserFaces called with:', {
        userId,
        imageDataArrayType: typeof imageDataArray,
        imageDataArrayLength: imageDataArray?.length,
        firstItem: imageDataArray?.[0]?.substring?.(0, 50),
        options
      })

      const results = []
      const validImages = []
      const embeddings = []

      // Validate all images first
      for (let i = 0; i < imageDataArray.length; i++) {
        const imageData = imageDataArray[i]
        
        // Step 1: Detect face
        const detectionResult = await this.detectFace(imageData, {
          confidenceThreshold: options.detectionThreshold || 0.8
        })

        if (!detectionResult.success || !detectionResult.facesDetected) {
          results.push({
            imageNumber: i + 1,
            success: false,
            message: 'No face detected in image',
            step: 'detection'
          })
          continue
        }

        // Step 2: Anti-spoofing check
        const antiSpoofingResult = await this.checkAntiSpoofing(imageData, {
          spoofingThreshold: options.spoofingThreshold || 0.5
        })

        if (!antiSpoofingResult.success || !antiSpoofingResult.isReal) {
          results.push({
            imageNumber: i + 1,
            success: false,
            message: 'Potential spoofing detected',
            step: 'anti-spoofing',
            spoofingScore: antiSpoofingResult.confidence
          })
          continue
        }

        // Step 3: Generate embedding using backend API
        const cleanImage = typeof imageData === 'string' ? this.cleanBase64Image(imageData) : imageData
        
        const embeddingResult = await this.retryApiCall(async () => {
          return await this.apiClient.post('/generate_embedding', {
            image: cleanImage,
            options: {
              model_name: options.modelName || 'ArcFace',
              detector_backend: 'retinaface'
            }
          })
        })

        if (!embeddingResult.data.success) {
          results.push({
            imageNumber: i + 1,
            success: false,
            message: 'Failed to generate face embedding',
            step: 'embedding'
          })
          continue
        }

        // Step 4: Upload image to Supabase storage
        let imagePath = null
        if (options.saveImages !== false) {
          try {
            // Convert base64 data URL to blob properly
            let imageBlob
            if (typeof imageData === 'string') {
              // Extract base64 data from data URL
              const base64Data = imageData.split(',')[1]
              const byteCharacters = atob(base64Data)
              const byteNumbers = new Array(byteCharacters.length)
              for (let j = 0; j < byteCharacters.length; j++) {
                byteNumbers[j] = byteCharacters.charCodeAt(j)
              }
              const byteArray = new Uint8Array(byteNumbers)
              imageBlob = new Blob([byteArray], { type: 'image/jpeg' })
            } else {
              imageBlob = imageData
            }
            
            const uploadResult = await storage.uploadFaceImage(
              userId, 
              imageBlob, 
              `image_${i + 1}.jpg`
            )
            
            if (uploadResult.data) {
              imagePath = uploadResult.data.path
            }
          } catch (uploadError) {
            console.error('Image upload error:', uploadError)
          }
        }

        // Step 5: Store embedding in Supabase database
        const embeddingData = {
          embedding: embeddingResult.data.embedding,
          confidence: embeddingResult.data.confidence || detectionResult.confidence,
          antiSpoofing: antiSpoofingResult.isReal,
          modelConfig: {
            model_name: options.modelName || 'ArcFace',
            detector_backend: 'retinaface',
            embedding_size: embeddingResult.data.embedding_size
          }
        }

        try {
          const dbResult = await db.storeFaceEmbedding(userId, embeddingData, i + 1)
          
          if (dbResult.error) {
            results.push({
              imageNumber: i + 1,
              success: false,
              message: 'Failed to store embedding in database',
              step: 'database',
              error: dbResult.error.message
            })
            continue
          }
        } catch (dbError) {
          console.error('Database storage error:', dbError)
          results.push({
            imageNumber: i + 1,
            success: false,
            message: 'Database storage failed',
            step: 'database'
          })
          continue
        }

        validImages.push(imageData)
        embeddings.push(embeddingResult.data.embedding)
        results.push({
          imageNumber: i + 1,
          success: true,
          message: 'Face registered successfully',
          confidence: detectionResult.confidence,
          antiSpoofingScore: antiSpoofingResult.confidence,
          imagePath
        })
      }

      const successCount = results.filter(r => r.success).length
      const minRequired = options.minRequiredImages || 2
      const isComplete = successCount >= minRequired

      // Update profile if registration is complete
      if (isComplete) {
        try {
          await db.updateProfile(userId, {
            face_registered: true,
            registration_completed: true
          })
        } catch (error) {
          console.error('Profile update error:', error)
        }
      }

      // Log registration activity
      try {
        await db.logActivity(userId, {
          type: 'registration',
          success: isComplete,
          details: {
            images_processed: imageDataArray.length,
            successful_registrations: successCount,
            results: results
          }
        })
      } catch (error) {
        console.error('Activity logging error:', error)
      }

      return {
        success: isComplete,
        results,
        successCount,
        totalImages: imageDataArray.length,
        embeddings: isComplete ? embeddings : [],
        message: isComplete ? 
          `Successfully registered ${successCount} face images` :
          `Registration incomplete: only ${successCount} images processed successfully`
      }

    } catch (error) {
      console.error('Registration process error:', error)
      return {
        success: false,
        results: [],
        successCount: 0,
        message: 'Registration process failed',
        error: error.message
      }
    }
  }

  // 7. Complete Login Flow - Integrated with Supabase
  async authenticateUser(userId, imageData, livenessRequired = false, options = {}) {
    try {
      const sessionId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Step 1: Get stored embeddings from Supabase
      const embeddingsResult = await db.getFaceEmbeddings(userId)
      if (embeddingsResult.error || !embeddingsResult.data || embeddingsResult.data.length === 0) {
        await db.logActivity(userId, {
          sessionId,
          type: 'login_attempt',
          success: false,
          details: { error: 'No stored face embeddings found' }
        })
        
        return {
          success: false,
          message: 'No face registration found for this user',
          step: 'embeddings_retrieval'
        }
      }

      const storedEmbeddings = embeddingsResult.data.map(item => ({
        embedding: item.embedding_data,
        image_number: item.image_number,
        confidence: item.confidence_score
      }))

      // Step 2: Face detection first
      const detectionResult = await this.detectFace(imageData, {
        confidenceThreshold: options.detectionThreshold || 0.7
      })

      if (!detectionResult.success || !detectionResult.facesDetected) {
        await db.logActivity(userId, {
          sessionId,
          type: 'login_attempt',
          success: false,
          details: { error: 'No face detected' }
        })

        return {
          success: false,
          message: 'No face detected in the image',
          step: 'detection',
          sessionId
        }
      }

      // Step 3: Anti-spoofing check
      const antiSpoofingResult = await this.checkAntiSpoofing(imageData, {
        spoofingThreshold: options.spoofingThreshold || 0.5
      })

      if (!antiSpoofingResult.success || !antiSpoofingResult.isReal) {
        await db.logActivity(userId, {
          sessionId,
          type: 'login_attempt',
          success: false,
          details: { 
            error: 'Potential spoofing detected',
            spoofing_score: antiSpoofingResult.confidence
          }
        })

        return {
          success: false,
          message: 'Potential spoofing attempt detected',
          step: 'anti-spoofing',
          sessionId,
          spoofingScore: antiSpoofingResult.confidence
        }
      }

      // Step 4: Liveness detection (if required)
      if (livenessRequired && options.livenessImages && options.challenges) {
        const livenessResult = await this.checkLiveness(
          options.livenessImages, 
          options.challenges,
          { livenessThreshold: options.livenessThreshold || 0.7 }
        )

        if (!livenessResult.success || !livenessResult.livenessPassed) {
          await db.logActivity(userId, {
            sessionId,
            type: 'login_attempt',
            success: false,
            details: { 
              error: 'Liveness detection failed',
              liveness_score: livenessResult.confidence
            }
          })

          return {
            success: false,
            message: 'Liveness detection failed',
            step: 'liveness',
            sessionId,
            livenessScore: livenessResult.confidence
          }
        }
      }

      // Step 5: Face verification using backend API
      const cleanImage = typeof imageData === 'string' ? this.cleanBase64Image(imageData) : imageData
      
      const verificationResult = await this.retryApiCall(async () => {
        return await this.apiClient.post('/verify_face', {
          image1: cleanImage,
          embeddings: storedEmbeddings.map(item => item.embedding),
          threshold: options.similarityThreshold || 0.6,
          options: {
            model_name: 'ArcFace',
            detector_backend: 'retinaface'
          }
        })
      })

      // Step 6: Log authentication attempt in Supabase
      const isMatch = verificationResult.data.success && verificationResult.data.is_match
      const confidence = verificationResult.data.confidence || 0

      await db.logActivity(userId, {
        sessionId,
        type: 'login_attempt',
        success: isMatch,
        confidence: confidence,
        antiSpoofing: antiSpoofingResult.isReal,
        details: {
          similarity_score: verificationResult.data.similarity || 0,
          detection_confidence: detectionResult.confidence,
          anti_spoofing_score: antiSpoofingResult.confidence,
          liveness_required: livenessRequired,
          liveness_passed: livenessRequired ? (options.livenessImages ? true : false) : true,
          processing_time: verificationResult.data.processing_time || 0
        }
      })

      if (isMatch) {
        // Update last login time in Supabase
        try {
          await db.updateProfile(userId, {
            last_login_at: new Date().toISOString(),
            failed_login_attempts: 0
          })
        } catch (error) {
          console.error('Profile update error:', error)
        }

        return {
          success: true,
          message: 'Face authentication successful',
          confidence: confidence,
          similarity: verificationResult.data.similarity || 0,
          sessionId,
          processingTime: verificationResult.data.processing_time || 0,
          details: {
            detectionConfidence: detectionResult.confidence,
            antiSpoofingScore: antiSpoofingResult.confidence,
            verificationScore: verificationResult.data.similarity || 0
          }
        }
      } else {
        return {
          success: false,
          message: verificationResult.data.message || 'Face verification failed',
          step: 'verification',
          sessionId,
          confidence: confidence,
          similarity: verificationResult.data.similarity || 0,
          threshold: verificationResult.data.threshold || options.similarityThreshold
        }
      }

    } catch (error) {
      console.error('Authentication process error:', error)
      
      // Log error in Supabase
      try {
        await db.logActivity(userId, {
          type: 'login_attempt',
          success: false,
          errorMessage: error.message,
          details: { error: 'Authentication process failed' }
        })
      } catch (logError) {
        console.error('Error logging failed:', logError)
      }

      return {
        success: false,
        message: 'Authentication process failed',
        step: 'process_error',
        error: error.message
      }
    }
  }

  // 8. Health Check
  async healthCheck() {
    try {
      const response = await this.apiClient.get('/health')
      return {
        success: true,
        status: response.data.status,
        services: response.data.services || {},
        version: response.data.version
      }
    } catch (error) {
      return {
        success: false,
        status: 'error',
        message: error.message
      }
    }
  }
}

const faceRecognitionService = new FaceRecognitionService()

// Export both named and default exports
export { faceRecognitionService, db }
export default faceRecognitionService
