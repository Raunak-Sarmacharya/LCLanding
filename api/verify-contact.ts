import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createSign } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendContactConfirmationEmail } from './utils/email.js'

// Configure runtime
export const config = {
  runtime: 'nodejs'
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
 * Get service account credentials from environment variable
 */
function getServiceAccount() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const spreadsheetId = process.env.GOOGLE_SHEET_ID

  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set')
  }

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is not set')
  }

  let credentials: any
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
function createJWT(serviceAccount: any): string {
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
async function getAccessToken(serviceAccount: any): Promise<string> {
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
 * Add verified contact submission to Google Sheet
 * Uses the same sheet as newsletter, but you can specify a different sheet name via env var
 */
async function addContactToSheet(contactData: any): Promise<void> {
  const serviceAccount = getServiceAccount()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!
  // Use a different sheet name for contacts, or same as newsletter if not specified
  const sheetName = process.env.GOOGLE_SHEET_CONTACTS_NAME || process.env.GOOGLE_SHEET_NAME || 'Contacts'

  // Get access token
  const accessToken = await getAccessToken(serviceAccount)

  // Get current timestamp
  const timestamp = new Date().toISOString()

  // Construct range for Google Sheets API append operation
  let range: string
  const needsQuotes = sheetName.includes(' ') || /^[^a-zA-Z0-9_]|[^a-zA-Z0-9_]$/.test(sheetName)
  
  if (needsQuotes) {
    range = `'${sheetName}'!A1`
  } else {
    range = `${sheetName}!A1`
  }
  
  const encodedRange = encodeURIComponent(range)
  const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`

  console.log('[Contact Verification] Appending to sheet:', {
    spreadsheetId,
    sheetName,
    range,
  })

  // Prepare row data: Name, Email, Phone, Inquiry Type, Topic, Message/Experience, Heard From, Timestamp
  const rowData = [
    contactData.name || '',
    contactData.email || '',
    contactData.phone || '',
    contactData.inquiry_type || '',
    contactData.topic || '',
    contactData.inquiry_type === 'general' 
      ? (contactData.message || '')
      : (contactData.experience || ''),
    contactData.heard_from || '',
    timestamp,
  ]

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowData],
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Max-Age', '86400')
    return res.status(204).end()
  }

  // Only allow GET requests (for email verification links)
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = req.query

    // Log for debugging (without exposing full token)
    console.log('[Verify Contact API] Received verification request:', {
      hasToken: !!token,
      tokenType: typeof token,
      tokenLength: typeof token === 'string' ? token.length : 0,
    })

    if (!token || typeof token !== 'string') {
      console.error('[Verify Contact API] Missing or invalid token')
      // Redirect to error page or show error
      return res.redirect(302, '/verify-email?error=missing_token&type=contact')
    }

    const supabase = getSupabaseClient()

    // Find submission by verification token
    const { data: submission, error: fetchError } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('verification_token', token)
      .single()

    if (fetchError || !submission) {
      console.error('[Verify Contact API] Submission not found:', fetchError)
      return res.redirect(302, '/verify-email?error=invalid_token&type=contact')
    }

    // Check if already verified
    if (submission.verified) {
      return res.redirect(302, '/verify-email?success=true&already_verified=true&type=contact')
    }

    // Check if token has expired
    const expiresAt = new Date(submission.expires_at)
    const now = new Date()
    if (now > expiresAt) {
      return res.redirect(302, '/verify-email?error=expired_token&type=contact')
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('contact_submissions')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('verification_token', token)

    if (updateError) {
      console.error('[Verify Contact API] Error updating submission:', updateError)
      return res.redirect(302, '/verify-email?error=verification_failed&type=contact')
    }

    // Add to Google Sheet
    try {
      await addContactToSheet(submission)
    } catch (sheetError) {
      console.error('[Verify Contact API] Error adding to sheet:', sheetError)
      // Don't fail verification if sheet update fails - submission is already verified
    }

    // Send confirmation email
    try {
      const baseUrl = 'https://lc-landing-eight.vercel.app'
      await sendContactConfirmationEmail(submission.email, submission.name, baseUrl)
    } catch (emailError) {
      console.error('[Verify Contact API] Error sending confirmation email:', emailError)
      // Don't fail verification if confirmation email fails
    }

    // Redirect to success page
    return res.redirect(302, '/verify-email?success=true&type=contact')

  } catch (error) {
    console.error('[Verify Contact API] Unexpected error:', error)
    return res.redirect(302, '/verify-email?error=server_error&type=contact')
  }
}

