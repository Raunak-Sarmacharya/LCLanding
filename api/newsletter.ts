import { google } from 'googleapis'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Configure runtime
export const config = {
  runtime: 'nodejs'
}

interface NewsletterRequest {
  email: string
}

/**
 * Get Google Sheets client using service account credentials
 */
function getSheetsClient() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const spreadsheetId = process.env.GOOGLE_SHEET_ID

  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set')
  }

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is not set')
  }

  let credentials
  try {
    // Parse the service account key (can be JSON string or already parsed)
    credentials = typeof serviceAccountKey === 'string' 
      ? JSON.parse(serviceAccountKey) 
      : serviceAccountKey
  } catch (error) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format. Must be valid JSON.')
  }

  // Create auth client
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  // Create sheets client
  const sheets = google.sheets({ version: 'v4', auth })

  return { sheets, spreadsheetId }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Add newsletter subscription to Google Sheet
 */
async function addToSheet(email: string): Promise<void> {
  const { sheets, spreadsheetId } = getSheetsClient()
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1' // Default to Sheet1 if not specified

  // Get current timestamp
  const timestamp = new Date().toISOString()

  // Append row to sheet: [Email, Timestamp]
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:B`, // Columns A (Email) and B (Timestamp)
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[email, timestamp]],
    },
  })
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

