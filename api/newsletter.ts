import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createSign } from 'crypto'

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
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
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

    // Add to Google Sheet
    try {
      await addToSheet(trimmedEmail)
    } catch (sheetError) {
      console.error('[Newsletter API] Error adding to sheet:', sheetError)
      
      // Check if it's a configuration error
      if (sheetError instanceof Error) {
        if (sheetError.message.includes('GOOGLE_SERVICE_ACCOUNT_KEY') || 
            sheetError.message.includes('GOOGLE_SHEET_ID')) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          return res.status(500).json({ 
            error: 'Server configuration error',
            details: 'Google Sheets integration is not properly configured'
          })
        }
      }

      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(500).json({ 
        error: 'Failed to save subscription',
        details: sheetError instanceof Error ? sheetError.message : 'Unknown error'
      })
    }

    // Success response
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).json({ 
      success: true,
      message: 'Successfully subscribed to newsletter'
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
