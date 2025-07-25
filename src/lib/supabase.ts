import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: Log environment variables (remove this after debugging)
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)
console.log('Supabase Key length:', supabaseAnonKey?.length)

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  user_id: string
  email: string
  full_name: string
  phone?: string
  company_name?: string
  bio?: string
  avatar_url?: string
  role: 'student' | 'admin'
  credit_balance: number
  created_at: string
  updated_at: string
}

export interface Instructor {
  id: string
  name: string
  bio?: string
  specialties: string[]
  image_url?: string
  email?: string
  phone?: string
  is_active: boolean
  created_at: string
}

export interface ClassType {
  id: string
  name: string
  description?: string
  credit_cost: number
  duration_minutes: number
  max_capacity: number
  image_url?: string
  is_active: boolean
  created_at: string
}

export interface ClassSchedule {
  id: string
  class_type_id: string
  instructor_id: string
  start_time: string
  end_time: string
  capacity: number
  enrolled_count: number
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
  class_type?: ClassType
  instructor?: Instructor
}

export interface Booking {
  id: string
  user_id: string
  class_schedule_id: string
  booking_status: 'confirmed' | 'cancelled' | 'attended' | 'no_show'
  credits_used: number
  booking_time: string
  cancellation_time?: string
  created_at: string
  updated_at: string
  class_schedule?: ClassSchedule
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  transaction_type: 'credit_purchase' | 'credit_added' | 'credit_deducted' | 'booking_payment' | 'booking_refund'
  description?: string
  booking_id?: string
  admin_user_id?: string
  created_at: string
}

// Helper functions
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
    }
  })

  if (error) {
    console.error('Error signing up:', error.message)
    throw error
  }

  // Create user profile
  if (data.user) {
    const { error: profileError } = await supabase.functions.invoke('handle-user-signup', {
      body: {
        user_id: data.user.id,
        email: email,
        full_name: fullName,
        role: 'student'
      }
    })

    if (profileError) {
      console.error('Error creating profile:', profileError)
    }
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('Error signing in:', error.message)
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error.message)
    throw error
  }
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error getting user profile:', error)
    return null
  }

  return data
}
