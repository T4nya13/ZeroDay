import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://rrgsixcdunbbsatbycfz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZ3NpeGNkdW5iYnNhdGJ5Y2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjY1ODEsImV4cCI6MjA3MDIwMjU4MX0.UAKIhvWgrfelLk_eItwnoyxYHZRx6SHXLHCbgq6PS3U'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper functions for authentication
export const auth = {
  // Sign up with email and password
  signUp: async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.fullName || '',
            username: metadata.username || '',
            face_registered: false
          }
        }
      })
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err) {
      return { error: err }
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser()
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helper functions
export const db = {
  // Create user profile
  createProfile: async (userId, profileData) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            username: profileData.username,
            full_name: profileData.fullName,
            face_registered: false,
            registration_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Get user profile
  getProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Update profile
  updateProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Store face embedding
  storeFaceEmbedding: async (userId, embeddingData, imageNumber) => {
    try {
      const { data, error } = await supabase
        .from('face_embeddings')
        .insert([
          {
            user_id: userId,
            embedding_data: embeddingData.embedding,
            image_number: imageNumber,
            confidence_score: embeddingData.confidence,
            anti_spoofing_passed: embeddingData.antiSpoofing,
            model_config: embeddingData.modelConfig || {},
            embedding_version: 'v1.0',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ])
        .select()
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Get face embeddings
  getFaceEmbeddings: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('face_embeddings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Log face recognition activity
  logActivity: async (userId, activityData) => {
    try {
      const { data, error } = await supabase
        .from('face_recognition_logs')
        .insert([
          {
            user_id: userId,
            session_id: activityData.sessionId || null,
            activity_type: activityData.type,
            success: activityData.success,
            confidence_score: activityData.confidence || null,
            anti_spoofing_result: activityData.antiSpoofing || null,
            details: activityData.details || {},
            error_message: activityData.errorMessage || null,
            ip_address: activityData.ipAddress || null,
            user_agent: activityData.userAgent || navigator.userAgent,
            device_info: activityData.deviceInfo || {},
            location_info: activityData.locationInfo || {},
            created_at: new Date().toISOString()
          }
        ])
        .select()
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Create liveness session
  createLivenessSession: async (userId, sessionType, challenges) => {
    try {
      const sessionToken = `liveness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      
      const { data, error } = await supabase
        .from('liveness_sessions')
        .insert([
          {
            user_id: userId,
            session_token: sessionToken,
            session_type: sessionType,
            challenges: challenges,
            completed_challenges: [],
            challenge_results: {},
            status: 'pending',
            attempts: 0,
            max_attempts: 3,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
          }
        ])
        .select()
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Update liveness session
  updateLivenessSession: async (sessionToken, updates) => {
    try {
      const { data, error } = await supabase
        .from('liveness_sessions')
        .update(updates)
        .eq('session_token', sessionToken)
        .select()
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Get liveness session
  getLivenessSession: async (sessionToken) => {
    try {
      const { data, error } = await supabase
        .from('liveness_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .single()
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}

// Storage helper functions
export const storage = {
  // Upload face image
  uploadFaceImage: async (userId, imageFile, imageName) => {
    try {
      const filePath = `faces/${userId}/${imageName}`
      
      console.log('DEBUG: Upload attempt:', {
        userId,
        imageName,
        filePath,
        fileSize: imageFile?.size,
        fileType: imageFile?.type,
        fileName: imageFile?.name
      });
      
      const { data, error } = await supabase.storage
        .from('face-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        })
      
      console.log('DEBUG: Upload result:', { data, error });
      
      if (error) return { data: null, error }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('face-images')
        .getPublicUrl(filePath)
      
      return { 
        data: { 
          ...data, 
          publicUrl: urlData.publicUrl,
          path: filePath
        }, 
        error: null 
      }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Delete face image
  deleteFaceImage: async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('face-images')
        .remove([filePath])
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Get face image URL
  getFaceImageUrl: async (filePath) => {
    try {
      const { data } = supabase.storage
        .from('face-images')
        .getPublicUrl(filePath)
      return { data: data.publicUrl, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}

export default supabase
