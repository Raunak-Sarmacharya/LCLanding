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
 * Tries multiple authentication methods for compatibility
 */
export function createEmailTransporter() {
  const config = getEmailConfig()
  
  // For Hostinger SMTP, port 587 uses STARTTLS (secure: false, requireTLS: true)
  // Port 465 uses SSL/TLS (secure: true)
  // Nodemailer will automatically try different auth methods (PLAIN, LOGIN, etc.)
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
      minVersion: 'TLSv1.2', // Ensure minimum TLS version
    },
    // Connection timeout
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
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
    const errorCode = verifyError && typeof verifyError === 'object' && 'code' in verifyError ? verifyError.code : undefined
    
    // Enhanced error logging with troubleshooting hints
    console.error('[Email] SMTP verification failed:', {
      host: config.host,
      port: config.port,
      user: config.user,
      error: errorMessage,
      code: errorCode,
      troubleshooting: [
        '1. Verify EMAIL_USER and EMAIL_PASSWORD are set correctly in Vercel environment variables',
        '2. If 2FA is enabled, use an app-specific password instead of your regular password',
        '3. Check if the email account is active and not restricted',
        '4. Try using port 465 with SSL (set EMAIL_PORT=465 and EMAIL_SECURE=true)',
        '5. Verify SMTP is enabled in your Hostinger email account settings',
      ],
    })
    
    // Provide more helpful error message
    let helpfulMessage = `SMTP authentication failed: ${errorMessage}`
    if (errorCode === 'EAUTH') {
      helpfulMessage += '\n\nTroubleshooting steps:'
      helpfulMessage += '\n- Verify EMAIL_USER and EMAIL_PASSWORD are correct in Vercel environment variables'
      helpfulMessage += '\n- If 2FA is enabled, generate an app-specific password and use that'
      helpfulMessage += '\n- Check that SMTP is enabled in your Hostinger email account'
      helpfulMessage += '\n- Try port 465 with SSL: set EMAIL_PORT=465 and EMAIL_SECURE=true'
    }
    
    throw new Error(helpfulMessage)
  }
  
  // URL-encode the token to handle any special characters
  const encodedToken = encodeURIComponent(verificationToken)
  const verificationUrl = `${baseUrl}/api/verify-email?token=${encodedToken}`
  
  const mailOptions = {
    from: `"${config.org}" <${config.user}>`,
    to: email,
    subject: 'LocalCooks Newsletter – One step to complete your signup',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Complete Your Signup - LocalCooks</title>
          <!--[if mso]>
          <style type="text/css">
            body, table, td {font-family: Arial, sans-serif !important;}
          </style>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <!-- Wrapper -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F5F5F5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <!-- Main Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 48px 48px 32px 48px; text-align: left; border-bottom: 1px solid #E5E5E5;">
                      <h1 style="margin: 0; font-family: 'Lobster', cursive; font-size: 32px; line-height: 1.2; color: #f51042; font-weight: 400; letter-spacing: -0.5px;">
                        Welcome to LocalCooks.
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 48px;">
                      <p style="margin: 0 0 24px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1A1A1A;">
                        Please confirm your email to start receiving our newsletter.
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                        <tr>
                          <td align="center" style="padding: 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" style="background-color: #f51042; border-radius: 6px; box-shadow: 0 2px 4px rgba(245, 16, 66, 0.2);">
                                  <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.5; color: #FFFFFF; text-decoration: none; border-radius: 6px; -webkit-text-size-adjust: none; mso-hide: all;">
                                    Confirm Email Address
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Benefits -->
                      <p style="margin: 32px 0 0 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1A1A1A;">
                        You'll be the first to know when new chefs join, exclusive deals drop, and fresh recipes go live.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 48px 48px 48px; border-top: 1px solid #E5E5E5;">
                      <p style="margin: 0 0 16px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #666666; text-align: center;">
                        — The LocalCooks Team
                      </p>
                      <p style="margin: 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #999999; text-align: center;">
                        <a href="${baseUrl}" style="color: #f51042; text-decoration: none; font-weight: 500;">Visit our website</a>
                        <span style="color: #CCCCCC; margin: 0 8px;">|</span>
                        <a href="mailto:${config.unsubscribeEmail}" style="color: #f51042; text-decoration: none; font-weight: 500;">Contact Support</a>
                      </p>
                      <p style="margin: 16px 0 0 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #999999; text-align: center;">
                        © ${new Date().getFullYear()} LocalCooks. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
      Welcome to LocalCooks.

      Please confirm your email to start receiving our newsletter.

      ${verificationUrl}

      You'll be the first to know when new chefs join, exclusive deals drop, and fresh recipes go live.

      — The LocalCooks Team

      © ${new Date().getFullYear()} LocalCooks. All rights reserved.
      Visit our website: ${baseUrl}
      Contact Support: ${config.unsubscribeEmail}
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
 * Send verification email for contact form submission
 */
export async function sendContactVerificationEmail(
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
    const errorCode = verifyError && typeof verifyError === 'object' && 'code' in verifyError ? verifyError.code : undefined
    
    console.error('[Email] SMTP verification failed:', {
      host: config.host,
      port: config.port,
      user: config.user,
      error: errorMessage,
      code: errorCode,
    })
    
    let helpfulMessage = `SMTP authentication failed: ${errorMessage}`
    if (errorCode === 'EAUTH') {
      helpfulMessage += '\n\nTroubleshooting: Check EMAIL_USER and EMAIL_PASSWORD in Vercel environment variables. Use app-specific password if 2FA is enabled.'
    }
    
    throw new Error(helpfulMessage)
  }
  
  // URL-encode the token to handle any special characters
  const encodedToken = encodeURIComponent(verificationToken)
  const verificationUrl = `${baseUrl}/api/verify-contact?token=${encodedToken}`
  
  const mailOptions = {
    from: `"${config.org}" <${config.user}>`,
    to: email,
    subject: 'Please verify your contact form submission',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Contact Form - LocalCooks</title>
        </head>
        <body style="font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1A1A1A; background-color: #FFF9F5; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header with brand gradient -->
            <div style="background: linear-gradient(135deg, #f51042 0%, #ff4d6d 50%, #FF8A7A 100%); padding: 40px 30px; text-align: center; border-radius: 20px 20px 0 0; box-shadow: 0 10px 40px -10px rgba(245, 16, 66, 0.3);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-family: 'Lobster', cursive; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">Verify Your Message 📧</h1>
            </div>
            
            <!-- Main content with cream background -->
            <div style="background: #FFF9F5; padding: 40px 30px; border: 1px solid rgba(245, 16, 66, 0.1); border-top: none; border-radius: 0 0 20px 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              <p style="font-size: 18px; margin-bottom: 20px; color: #1A1A1A; font-weight: 500;">
                Thank you for reaching out to LocalCooks! We're excited to hear from you. 🍽️
              </p>
              
              <p style="font-size: 16px; margin-bottom: 30px; color: #333333; line-height: 1.7;">
                To ensure we can respond to your message, please verify your email address by clicking the link below:
              </p>
              
              <!-- Verification link -->
              <div style="text-align: center; margin: 40px 0;">
                <p style="font-size: 12px; color: #999; word-break: break-all; background: #FFEDD5; padding: 15px; border-radius: 8px; border: 1px solid rgba(245, 16, 66, 0.1); margin: 0;">
                  <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" style="color: #f51042; text-decoration: underline; font-size: 14px;">${verificationUrl}</a>
                </p>
              </div>
              
              <!-- Why verify section -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid rgba(245, 16, 66, 0.1);">
                <p style="font-size: 16px; color: #1A1A1A; margin-bottom: 15px; font-weight: 600;">
                  Why verify? 🤔
                </p>
                <ul style="font-size: 15px; color: #333333; padding-left: 20px; margin: 0; line-height: 1.8;">
                  <li style="margin-bottom: 8px;">Ensures we have your correct email address to respond</li>
                  <li style="margin-bottom: 8px;">Protects you from spam and unauthorized submissions</li>
                  <li style="margin-bottom: 8px;">Helps us maintain a high-quality contact list</li>
                  <li>Complies with email best practices</li>
                </ul>
              </div>
              
              <p style="font-size: 13px; color: #999; margin-top: 30px; text-align: center; padding: 15px; background: #FFF0E8; border-radius: 8px;">
                ⏰ This verification link will expire in 7 days. If you didn't submit a contact form, you can safely ignore this email.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding: 25px 20px; color: #999; font-size: 12px;">
              <p style="margin: 0; color: #666;">© ${new Date().getFullYear()} LocalCooks. All rights reserved.</p>
              <p style="margin: 15px 0 0 0;">
                <a href="${baseUrl}" style="color: #f51042; text-decoration: none; font-weight: 500; margin: 0 10px;">Visit our website</a> | 
                <a href="mailto:${config.unsubscribeEmail}" style="color: #f51042; text-decoration: none; font-weight: 500; margin: 0 10px;">Contact Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Verify Your Contact Form Submission
      
      Thank you for reaching out to LocalCooks! To ensure we can respond to your message, please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This verification link will expire in 7 days.
      
      If you didn't submit a contact form, you can safely ignore this email.
      
      © ${new Date().getFullYear()} ${config.org}. All rights reserved.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (sendError) {
    const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error'
    const errorCode = sendError && typeof sendError === 'object' && 'code' in sendError ? sendError.code : undefined
    console.error('[Email] Failed to send contact verification email:', {
      to: email,
      error: errorMessage,
      code: errorCode,
    })
    throw sendError
  }
}

/**
 * Send confirmation email after contact form verification
 */
export async function sendContactConfirmationEmail(
  email: string,
  name: string,
  baseUrl: string = 'https://localcook.shop'
): Promise<void> {
  const config = getEmailConfig()
  const transporter = createEmailTransporter()
  
  // Verify connection before sending
  try {
    await transporter.verify()
  } catch (verifyError) {
    const errorMessage = verifyError instanceof Error ? verifyError.message : 'Unknown error'
    const errorCode = verifyError && typeof verifyError === 'object' && 'code' in verifyError ? verifyError.code : undefined
    
    console.error('[Email] SMTP verification failed for contact confirmation email:', {
      host: config.host,
      port: config.port,
      user: config.user,
      error: errorMessage,
      code: errorCode,
    })
    
    let helpfulMessage = `SMTP authentication failed: ${errorMessage}`
    if (errorCode === 'EAUTH') {
      helpfulMessage += '\n\nTroubleshooting: Check EMAIL_USER and EMAIL_PASSWORD in Vercel environment variables. Use app-specific password if 2FA is enabled.'
    }
    
    throw new Error(helpfulMessage)
  }
  
  const mailOptions = {
    from: `"${config.org}" <${config.user}>`,
    to: email,
    subject: 'We received your message! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Message Received - LocalCooks</title>
        </head>
        <body style="font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1A1A1A; background-color: #FFF9F5; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header with celebration gradient -->
            <div style="background: linear-gradient(135deg, #f51042 0%, #E5A84B 50%, #FF8A7A 100%); padding: 40px 30px; text-align: center; border-radius: 20px 20px 0 0; box-shadow: 0 10px 40px -10px rgba(245, 16, 66, 0.3);">
              <h1 style="color: white; margin: 0; font-size: 36px; font-family: 'Lobster', cursive; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">Message Received! 🎉</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">Hi ${name}!</p>
            </div>
            
            <!-- Main content with cream background -->
            <div style="background: #FFF9F5; padding: 40px 30px; border: 1px solid rgba(245, 16, 66, 0.1); border-top: none; border-radius: 0 0 20px 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              <p style="font-size: 18px; margin-bottom: 25px; color: #1A1A1A; font-weight: 500; line-height: 1.7;">
                Great news! Your email has been verified and we've received your message. 🎊
              </p>
              
              <p style="font-size: 17px; margin-bottom: 20px; color: #1A1A1A; font-weight: 600;">
                What happens next?
              </p>
              
              <!-- Next steps list -->
              <div style="background: #FFEDD5; padding: 25px; border-radius: 12px; border-left: 4px solid #f51042; margin-bottom: 30px;">
                <ul style="font-size: 16px; color: #1A1A1A; padding-left: 0; margin: 0; list-style: none;">
                  <li style="margin-bottom: 12px; padding-left: 30px; position: relative;">
                    <span style="position: absolute; left: 0; color: #f51042; font-size: 20px;">📬</span>
                    We'll review your message carefully
                  </li>
                  <li style="margin-bottom: 12px; padding-left: 30px; position: relative;">
                    <span style="position: absolute; left: 0; color: #E5A84B; font-size: 20px;">⏱️</span>
                    Expect a response within 24 hours
                  </li>
                  <li style="padding-left: 30px; position: relative;">
                    <span style="position: absolute; left: 0; color: #FF8A7A; font-size: 20px;">💬</span>
                    We'll get back to you at this email address
                  </li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${baseUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #f51042 0%, #d10d38 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(245, 16, 66, 0.25), 0 4px 10px rgba(245, 16, 66, 0.15); transition: all 0.3s ease;">
                  Visit LocalCooks 🚀
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding: 25px 20px; color: #999; font-size: 12px;">
              <p style="margin: 0; color: #666;">© ${new Date().getFullYear()} LocalCooks. All rights reserved.</p>
              <p style="margin: 15px 0 0 0;">
                <a href="${baseUrl}" style="color: #f51042; text-decoration: none; font-weight: 500;">Visit our website</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Message Received! 🎉
      
      Hi ${name}!
      
      Great news! Your email has been verified and we've received your message.
      
      What happens next?
      - We'll review your message carefully
      - Expect a response within 24 hours
      - We'll get back to you at this email address
      
      Visit us at: ${baseUrl}
      
      © ${new Date().getFullYear()} ${config.org}. All rights reserved.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (sendError) {
    const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error'
    const errorCode = sendError && typeof sendError === 'object' && 'code' in sendError ? sendError.code : undefined
    console.error('[Email] Failed to send contact confirmation email:', {
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
    const errorCode = verifyError && typeof verifyError === 'object' && 'code' in verifyError ? verifyError.code : undefined
    
    console.error('[Email] SMTP verification failed for welcome email:', {
      host: config.host,
      port: config.port,
      user: config.user,
      error: errorMessage,
      code: errorCode,
    })
    
    let helpfulMessage = `SMTP authentication failed: ${errorMessage}`
    if (errorCode === 'EAUTH') {
      helpfulMessage += '\n\nTroubleshooting: Check EMAIL_USER and EMAIL_PASSWORD in Vercel environment variables. Use app-specific password if 2FA is enabled.'
    }
    
    throw new Error(helpfulMessage)
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
        <body style="font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1A1A1A; background-color: #FFF9F5; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header with celebration gradient -->
            <div style="background: linear-gradient(135deg, #f51042 0%, #E5A84B 50%, #FF8A7A 100%); padding: 40px 30px; text-align: center; border-radius: 20px 20px 0 0; box-shadow: 0 10px 40px -10px rgba(245, 16, 66, 0.3);">
              <h1 style="color: white; margin: 0; font-size: 36px; font-family: 'Lobster', cursive; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">You're All Set! 🎉</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">Welcome to the LocalCooks family!</p>
            </div>
            
            <!-- Main content with cream background -->
            <div style="background: #FFF9F5; padding: 40px 30px; border: 1px solid rgba(245, 16, 66, 0.1); border-top: none; border-radius: 0 0 20px 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              <p style="font-size: 18px; margin-bottom: 25px; color: #1A1A1A; font-weight: 500; line-height: 1.7;">
                Great news! Your email has been verified and you're now subscribed to the LocalCooks newsletter. 🎊
              </p>
              
              <p style="font-size: 17px; margin-bottom: 20px; color: #1A1A1A; font-weight: 600;">
                You'll now receive:
              </p>
              
              <!-- Benefits list with icons -->
              <div style="background: #FFEDD5; padding: 25px; border-radius: 12px; border-left: 4px solid #f51042; margin-bottom: 30px;">
                <ul style="font-size: 16px; color: #1A1A1A; padding-left: 0; margin: 0; list-style: none;">
                  <li style="margin-bottom: 12px; padding-left: 30px; position: relative;">
                    <span style="position: absolute; left: 0; color: #f51042; font-size: 20px;">👨‍🍳</span>
                    Updates about new chefs joining our platform
                  </li>
                  <li style="margin-bottom: 12px; padding-left: 30px; position: relative;">
                    <span style="position: absolute; left: 0; color: #E5A84B; font-size: 20px;">💰</span>
                    Exclusive deals and special offers
                  </li>
                  <li style="margin-bottom: 12px; padding-left: 30px; position: relative;">
                    <span style="position: absolute; left: 0; color: #FF8A7A; font-size: 20px;">📜</span>
                    Authentic recipes from your neighborhood
                  </li>
                  <li style="padding-left: 30px; position: relative;">
                    <span style="position: absolute; left: 0; color: #f51042; font-size: 20px;">💬</span>
                    Tips and stories from our community
                  </li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${baseUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #f51042 0%, #d10d38 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(245, 16, 66, 0.25), 0 4px 10px rgba(245, 16, 66, 0.15); transition: all 0.3s ease;">
                  Explore LocalCooks 🚀
                </a>
              </div>
              
              <!-- Unsubscribe info -->
              <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 25px; border-top: 2px solid rgba(245, 16, 66, 0.1); line-height: 1.7;">
                If you ever want to unsubscribe, just reply to this email or contact us at 
                <a href="mailto:${config.unsubscribeEmail}" style="color: #f51042; text-decoration: none; font-weight: 500;">${config.unsubscribeEmail}</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding: 25px 20px; color: #999; font-size: 12px;">
              <p style="margin: 0; color: #666;">© ${new Date().getFullYear()} LocalCooks. All rights reserved.</p>
              <p style="margin: 15px 0 0 0;">
                <a href="${baseUrl}" style="color: #f51042; text-decoration: none; font-weight: 500;">Visit our website</a>
              </p>
            </div>
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

