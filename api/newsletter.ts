import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createSign, randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from './utils/email.js'

// Configure runtime
export const config = {
  runtime: 'nodejs'
}

interface NewsletterRequest {
  email: string
}

interface ServiceAccountKey {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
}

/**
 * Get service account credentials from environment variable
 */
function getServiceAccount(): ServiceAccountKey {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const spreadsheetId = process.env.GOOGLE_SHEET_ID

  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set')
  }

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is not set')
  }

  let credentials: ServiceAccountKey
  try {
    credentials = typeof serviceAccountKey === 'string' 
      ? JSON.parse(serviceAccountKey) 
      : serviceAccountKey
  } catch (error) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format. Must be valid JSON.')
  }

  if (!credentials.private_key || !credentials.client_email) {
    throw new Error('Invalid service account key: missing private_key or client_email')
  }

  return credentials
}

/**
 * Convert base64 to base64url (URL-safe base64)
 */
function base64UrlEncode(str: string): string {
  return str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Create a JWT token for Google API authentication
 */
function createJWT(serviceAccount: ServiceAccountKey): string {
  const now = Math.floor(Date.now() / 1000)
  const expiry = now + 3600 // 1 hour expiry

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const claim = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now
  }

  // Encode header and claim
  const encodedHeader = base64UrlEncode(Buffer.from(JSON.stringify(header)).toString('base64'))
  const encodedClaim = base64UrlEncode(Buffer.from(JSON.stringify(claim)).toString('base64'))
  const signatureInput = `${encodedHeader}.${encodedClaim}`

  // Sign with private key
  const sign = createSign('RSA-SHA256')
  sign.update(signatureInput)
  const signature = base64UrlEncode(sign.sign(serviceAccount.private_key, 'base64'))

  return `${signatureInput}.${signature}`
}

/**
 * Get access token from Google OAuth2
 */
async function getAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  const jwt = createJWT(serviceAccount)
  const tokenUrl = serviceAccount.token_uri || 'https://oauth2.googleapis.com/token'

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get access token: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.access_token
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
 * Store newsletter subscription with verification token in Supabase
 */
async function storeSubscriptionRequest(email: string, verificationToken: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  // Set expiration to 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  
  // Check if email already exists
  const { data: existing } = await supabase
    .from('newsletter_subscriptions')
    .select('email, verified')
    .eq('email', email)
    .single()
  
  if (existing) {
    if (existing.verified) {
      throw new Error('This email is already subscribed and verified')
    } else {
      // Update existing unverified subscription with new token
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({
          verification_token: verificationToken,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('email', email)
      
      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`)
      }
      return
    }
  }
  
  // Insert new subscription
  const { error } = await supabase
    .from('newsletter_subscriptions')
    .insert({
      email,
      verification_token: verificationToken,
      verified: false,
      expires_at: expiresAt.toISOString(),
    })
  
  if (error) {
    throw new Error(`Failed to store subscription: ${error.message}`)
  }
}

/**
 * Add newsletter subscription to Google Sheet using direct API calls
 */
async function addToSheet(email: string): Promise<void> {
  const serviceAccount = getServiceAccount()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1'

  // Get access token
  const accessToken = await getAccessToken(serviceAccount)

  // Get current timestamp
  const timestamp = new Date().toISOString()

  // Construct range for Google Sheets API append operation
  // For append, we can use: SheetName!A:B or just SheetName!A1 (starting cell)
  // Sheet names with special characters should be single-quoted
  // Try using A1 notation which is more reliable
  let range: string
  // Quote sheet name if it contains spaces or starts/ends with special chars
  const needsQuotes = sheetName.includes(' ') || /^[^a-zA-Z0-9_]|[^a-zA-Z0-9_]$/.test(sheetName)
  
  if (needsQuotes) {
    range = `'${sheetName}'!A1`
  } else {
    range = `${sheetName}!A1`
  }
  
  // URL-encode the range for the API path
  const encodedRange = encodeURIComponent(range)
  
  // Append row to sheet using Google Sheets API v4
  // Format: POST /v4/spreadsheets/{spreadsheetId}/values/{range}:append
  const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`
  
  console.log('[Newsletter API] Appending to sheet:', {
    spreadsheetId,
    sheetName,
    range,
    encodedRange
  })

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[email, timestamp]],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Google Sheets API error: ${response.status}`
    
    try {
      const errorData = JSON.parse(errorText)
      if (errorData.error?.message) {
        errorMessage = errorData.error.message
      }
    } catch {
      errorMessage = `${errorMessage} - ${errorText}`
    }

    throw new Error(errorMessage)
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
    const body: NewsletterRequest = req.body

    if (!body || typeof body !== 'object') {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(400).json({ error: 'Invalid request body' })
    }

    const { email } = body

    // Validate email
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
    
    // Store subscription request in Supabase (unverified)
    try {
      await storeSubscriptionRequest(trimmedEmail, verificationToken)
    } catch (dbError) {
      console.error('[Newsletter API] Error storing subscription:', dbError)
      
      // Check if it's a duplicate verified email
      if (dbError instanceof Error && dbError.message.includes('already subscribed')) {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(409).json({ 
          error: 'Email already subscribed',
          message: 'This email is already subscribed to our newsletter'
        })
      }
      
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(500).json({ 
        error: 'Failed to process subscription',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      })
    }
    
    // Send verification email
    try {
      await sendVerificationEmail(trimmedEmail, verificationToken, baseUrl)
    } catch (emailError) {
      console.error('[Newsletter API] Error sending verification email:', emailError)
      
      // Even if email fails, we've stored the subscription
      // Log the error but don't fail the request
      // The user can request a new verification email if needed
      console.warn('[Newsletter API] Verification email failed, but subscription stored')
    }

    // Success response - ask user to verify email
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).json({ 
      success: true,
      message: 'Please check your email to verify your subscription',
      requiresVerification: true
    })

  } catch (error) {
    console.error('[Newsletter API] Unexpected error:', error)
    
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
