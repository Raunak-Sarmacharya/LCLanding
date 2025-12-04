import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendContactVerificationEmail } from './utils/email.js'

// Configure runtime
export const config = {
  runtime: 'nodejs'
}

interface ContactRequest {
  name: string
  email: string
  phone?: string
  message?: string
  inquiryType: 'general' | 'chef'
  topic?: string
  cookingDescription?: string
  experience?: string
  heardFrom?: string
}

/**
 * Get Supabase client
 */
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard.')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generate a secure verification token
 */
function generateVerificationToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Store contact form submission with verification token in Supabase
 */
async function storeContactSubmission(
  contactData: ContactRequest,
  verificationToken: string
): Promise<void> {
  const supabase = getSupabaseClient()
  
  // Set expiration to 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  
  // Insert new contact submission
  const { error } = await supabase
    .from('contact_submissions')
    .insert({
      name: contactData.name,
      email: contactData.email.trim().toLowerCase(),
      phone: contactData.phone || null,
      message: contactData.message || null,
      inquiry_type: contactData.inquiryType,
      topic: contactData.topic || null,
      cooking_description: contactData.cookingDescription || null,
      experience: contactData.experience || null,
      heard_from: contactData.heardFrom || null,
      verification_token: verificationToken,
      verified: false,
      expires_at: expiresAt.toISOString(),
    })
  
  if (error) {
    throw new Error(`Failed to store contact submission: ${error.message}`)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Max-Age', '86400')
    return res.status(204).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse request body
    const body: ContactRequest = req.body

    if (!body || typeof body !== 'object') {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(400).json({ error: 'Invalid request body' })
    }

    const { name, email, inquiryType } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(400).json({ error: 'Name is required' })
    }

    if (!email || typeof email !== 'string') {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(400).json({ error: 'Email is required' })
    }

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(400).json({ error: 'Email cannot be empty' })
    }

    if (!isValidEmail(trimmedEmail)) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(400).json({ error: 'Invalid email format' })
    }

    if (!inquiryType || !['general', 'chef'].includes(inquiryType)) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(400).json({ error: 'Invalid inquiry type' })
    }

    // Validate inquiry-specific required fields
    if (inquiryType === 'general' && (!body.message || !body.message.trim())) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(400).json({ error: 'Message is required for general inquiries' })
    }

    if (inquiryType === 'chef' && (!body.experience || !body.experience.trim())) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(400).json({ error: 'Experience is required for chef applications' })
    }

    // Generate verification token
    const verificationToken = generateVerificationToken()
    
    // Get base URL for verification link
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.VERCEL_ENV === 'production'
        ? 'https://localcook.shop'
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'https://localcook.shop'
    
    // Store contact submission in Supabase (unverified)
    try {
      await storeContactSubmission(
        {
          ...body,
          email: trimmedEmail,
        },
        verificationToken
      )
    } catch (dbError) {
      console.error('[Contact API] Error storing submission:', dbError)
      
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(500).json({ 
        error: 'Failed to process submission',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      })
    }
    
    // Send verification email
    try {
      await sendContactVerificationEmail(trimmedEmail, verificationToken, baseUrl)
    } catch (emailError) {
      console.error('[Contact API] Error sending verification email:', emailError)
      
      // Even if email fails, we've stored the submission
      // Log the error but don't fail the request
      console.warn('[Contact API] Verification email failed, but submission stored')
    }

    // Success response - ask user to verify email
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).json({ 
      success: true,
      message: 'Please check your email to verify your submission',
      requiresVerification: true
    })

  } catch (error) {
    console.error('[Contact API] Unexpected error:', error)
    
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

