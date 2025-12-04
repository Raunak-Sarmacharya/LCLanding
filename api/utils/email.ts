import nodemailer from 'nodemailer'

/**
 * Get email configuration from environment variables
 */
function getEmailConfig() {
  const host = process.env.EMAIL_HOST || 'smtp.hostinger.com'
  const port = parseInt(process.env.EMAIL_PORT || '587', 10)
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465
  const user = process.env.EMAIL_USER
  const password = process.env.EMAIL_PASSWORD
  const org = process.env.EMAIL_ORG || 'LocalCooks'
  const domain = process.env.EMAIL_DOMAIN || 'localcook.shop'
  const unsubscribeEmail = process.env.EMAIL_UNSUBSCRIBE || 'unsubscribe@localcook.shop'

  if (!host || !user || !password) {
    throw new Error('Email configuration is incomplete. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD environment variables.')
  }

  return {
    host,
    port,
    secure,
    user,
    password,
    org,
    domain,
    unsubscribeEmail,
  }
}

/**
 * Create SMTP transporter for Hostinger
 */
export function createEmailTransporter() {
  const config = getEmailConfig()
  
  // For Hostinger SMTP, port 587 uses STARTTLS (secure: false, requireTLS: true)
  // Port 465 uses SSL/TLS (secure: true)
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for 465, false for other ports
    requireTLS: !config.secure, // Require TLS for port 587 (STARTTLS)
    auth: {
      user: config.user,
      pass: config.password,
    },
    tls: {
      rejectUnauthorized: false, // For development, set to true in production with proper certs
    },
  })
  
  return transporter
}

/**
 * Verify SMTP connection and authentication
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = createEmailTransporter()
    await transporter.verify()
    return true
  } catch (error) {
    console.error('[Email] SMTP connection verification failed:', error)
    return false
  }
}

/**
 * Send verification email for newsletter subscription
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  baseUrl: string = 'https://localcook.shop'
): Promise<void> {
  const config = getEmailConfig()
  
  // Verify connection before sending
  const transporter = createEmailTransporter()
  
  try {
    // Verify SMTP connection
    await transporter.verify()
  } catch (verifyError) {
    const errorMessage = verifyError instanceof Error ? verifyError.message : 'Unknown error'
    console.error('[Email] SMTP verification failed:', {
      host: config.host,
      port: config.port,
      user: config.user,
      error: errorMessage,
    })
    throw new Error(`SMTP authentication failed: ${errorMessage}. Please check EMAIL_USER and EMAIL_PASSWORD environment variables.`)
  }
  
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`
  
  const mailOptions = {
    from: `"${config.org}" <${config.user}>`,
    to: email,
    subject: 'Please verify your email address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - LocalCooks</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to LocalCooks!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for subscribing to our newsletter! We're excited to have you join our community of food lovers.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              To complete your subscription and start receiving updates about new chefs, exclusive deals, and authentic recipes, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #999; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
              ${verificationUrl}
            </p>
            
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                <strong>Why verify?</strong>
              </p>
              <ul style="font-size: 14px; color: #666; padding-left: 20px; margin: 0;">
                <li>Ensures we have your correct email address</li>
                <li>Protects you from spam and unauthorized subscriptions</li>
                <li>Helps us maintain a high-quality subscriber list</li>
                <li>Complies with email marketing best practices</li>
              </ul>
            </div>
            
            <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
              This verification link will expire in 7 days. If you didn't request this subscription, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} LocalCooks. All rights reserved.</p>
            <p style="margin: 10px 0 0 0;">
              <a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Visit our website</a> | 
              <a href="mailto:${config.unsubscribeEmail}" style="color: #667eea; text-decoration: none;">Contact Support</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to LocalCooks!
      
      Thank you for subscribing to our newsletter! To complete your subscription, please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This verification link will expire in 7 days.
      
      If you didn't request this subscription, you can safely ignore this email.
      
      © ${new Date().getFullYear()} ${config.org}. All rights reserved.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (sendError) {
    const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error'
    const errorCode = sendError && typeof sendError === 'object' && 'code' in sendError ? sendError.code : undefined
    console.error('[Email] Failed to send verification email:', {
      to: email,
      error: errorMessage,
      code: errorCode,
    })
    throw sendError
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(
  email: string,
  baseUrl: string = 'https://localcook.shop'
): Promise<void> {
  const config = getEmailConfig()
  const transporter = createEmailTransporter()
  
  // Verify connection before sending
  try {
    await transporter.verify()
  } catch (verifyError) {
    const errorMessage = verifyError instanceof Error ? verifyError.message : 'Unknown error'
    console.error('[Email] SMTP verification failed for welcome email:', {
      host: config.host,
      port: config.port,
      user: config.user,
      error: errorMessage,
    })
    throw new Error(`SMTP authentication failed: ${errorMessage}. Please check EMAIL_USER and EMAIL_PASSWORD environment variables.`)
  }
  
  const mailOptions = {
    from: `"${config.org}" <${config.user}>`,
    to: email,
    subject: 'Welcome to LocalCooks! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to LocalCooks</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're All Set! 🎉</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! Your email has been verified and you're now subscribed to the LocalCooks newsletter.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              You'll now receive:
            </p>
            
            <ul style="font-size: 16px; color: #666; padding-left: 20px; margin-bottom: 30px;">
              <li>Updates about new chefs joining our platform</li>
              <li>Exclusive deals and special offers</li>
              <li>Authentic recipes from your neighborhood</li>
              <li>Tips and stories from our community</li>
            </ul>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${baseUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                Explore LocalCooks
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
              If you ever want to unsubscribe, just reply to this email or contact us at 
              <a href="mailto:${config.unsubscribeEmail}" style="color: #667eea; text-decoration: none;">${config.unsubscribeEmail}</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} LocalCooks. All rights reserved.</p>
            <p style="margin: 10px 0 0 0;">
              <a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Visit our website</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      You're All Set! 🎉
      
      Great news! Your email has been verified and you're now subscribed to the LocalCooks newsletter.
      
      You'll now receive:
      - Updates about new chefs joining our platform
      - Exclusive deals and special offers
      - Authentic recipes from your neighborhood
      - Tips and stories from our community
      
      Visit us at: ${baseUrl}
      
      If you ever want to unsubscribe, just reply to this email or contact us at ${config.unsubscribeEmail}
      
      © ${new Date().getFullYear()} ${config.org}. All rights reserved.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (sendError) {
    const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error'
    const errorCode = sendError && typeof sendError === 'object' && 'code' in sendError ? sendError.code : undefined
    console.error('[Email] Failed to send welcome email:', {
      to: email,
      error: errorMessage,
      code: errorCode,
    })
    throw sendError
  }
}

