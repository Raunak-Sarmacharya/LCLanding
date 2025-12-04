import type { VercelRequest, VercelResponse } from '@vercel/node'
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
 * Send contact form data to team email (optional - can be implemented later)
 */
async function notifyTeam(contactData: any): Promise<void> {
  // This can be implemented to send an email to the team
  // For now, we'll just log it
  console.log('[Contact Verification] New verified contact submission:', {
    name: contactData.name,
    email: contactData.email,
    inquiryType: contactData.inquiry_type,
  })
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

    // Notify team (optional)
    try {
      await notifyTeam(submission)
    } catch (notifyError) {
      console.error('[Verify Contact API] Error notifying team:', notifyError)
      // Don't fail verification if notification fails
    }

    // Send confirmation email
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.VERCEL_ENV === 'production'
          ? 'https://localcook.shop'
          : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'https://localcook.shop'
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

