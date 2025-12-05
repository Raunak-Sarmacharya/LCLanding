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
  
  // Construct logo URL - use absolute URL for email
  const logoUrl = `${baseUrl}/logo-lc.png`
  
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
            .logo-heading {font-family: Georgia, serif !important; text-align: center !important;}
          </style>
          <![endif]-->
          <!--[if !mso]><!-->
          <style type="text/css">
            /* Import Instrument Sans for body text - web-safe Georgia for headings */
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
            /* Responsive design */
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; max-width: 100% !important; }
              .email-padding { padding: 32px 24px !important; }
              .logo-container { padding: 32px 24px 24px 24px !important; }
              .logo-img { width: 120px !important; height: auto !important; }
              .heading-text { font-size: 28px !important; }
              .body-text { font-size: 15px !important; }
              .button-text { font-size: 15px !important; padding: 14px 32px !important; }
            }
          </style>
          <!--<![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <!-- Wrapper -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F5F5F5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <!-- Main Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                  
                  <!-- Logo Header -->
                  <tr>
                    <td class="logo-container" style="padding: 48px 48px 32px 48px; text-align: center; border-bottom: 1px solid #F0F0F0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding: 0;">
                            <img src="${logoUrl}" alt="LocalCooks" class="logo-img" width="140" height="140" style="display: block; width: 140px; height: auto; max-width: 140px; margin: 0 auto 28px auto;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding: 0;">
                            <h1 class="logo-heading heading-text" style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 36px; line-height: 1.3; color: #f51042; font-weight: 400; letter-spacing: 0.5px; text-align: center;">
                              Welcome to LocalCooks.
                            </h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td class="email-padding" style="padding: 48px 48px;">
                      <p class="body-text" style="margin: 0 0 32px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1A1A1A;">
                        Please confirm your email to start receiving our newsletter.
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
                        <tr>
                          <td align="center" style="padding: 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" style="background-color: #f51042; border-radius: 8px; box-shadow: 0 4px 12px rgba(245, 16, 66, 0.25);">
                                  <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" class="button-text" style="display: inline-block; padding: 16px 40px; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.5; color: #FFFFFF; text-decoration: none; border-radius: 8px; -webkit-text-size-adjust: none; mso-hide: all;">
                                    Confirm Email Address
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Benefits -->
                      <p class="body-text" style="margin: 40px 0 0 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1A1A1A;">
                        You'll be the first to know when new chefs join, exclusive deals drop, and fresh recipes go live.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td class="email-padding" style="padding: 40px 48px 48px 48px; border-top: 1px solid #F0F0F0;">
                      <p style="margin: 0 0 20px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                        — The LocalCooks Team
                      </p>
                      <p style="margin: 0 0 20px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #999999; text-align: center;">
                        <a href="${baseUrl}" style="color: #f51042; text-decoration: none; font-weight: 500;">Visit our website</a>
                        <span style="color: #E0E0E0; margin: 0 10px;">|</span>
                        <a href="mailto:${config.unsubscribeEmail}" style="color: #f51042; text-decoration: none; font-weight: 500;">Contact Support</a>
                      </p>
                      <p style="margin: 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #CCCCCC; text-align: center;">
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
  const logoUrl = `${baseUrl}/logo-lc.png`
  
  const mailOptions = {
    from: `"${config.org}" <${config.user}>`,
    to: email,
    subject: 'Please verify your contact form submission',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Verify Your Contact Form - LocalCooks</title>
          <!--[if mso]>
          <style type="text/css">
            body, table, td {font-family: Arial, sans-serif !important;}
            .logo-heading {font-family: Georgia, serif !important; text-align: center !important;}
          </style>
          <![endif]-->
          <!--[if !mso]><!-->
          <style type="text/css">
            /* Import Instrument Sans for body text - web-safe Georgia for headings */
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; max-width: 100% !important; }
              .email-padding { padding: 32px 24px !important; }
              .logo-container { padding: 32px 24px 24px 24px !important; }
              .logo-img { width: 120px !important; height: auto !important; }
              .heading-text { font-size: 28px !important; }
              .body-text { font-size: 15px !important; }
              .button-text { font-size: 15px !important; padding: 14px 32px !important; }
            }
          </style>
          <!--<![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F5F5F5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                  
                  <!-- Logo Header -->
                  <tr>
                    <td class="logo-container" style="padding: 48px 48px 32px 48px; text-align: center; border-bottom: 1px solid #F0F0F0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding: 0;">
                            <img src="${logoUrl}" alt="LocalCooks" class="logo-img" width="140" height="140" style="display: block; width: 140px; height: auto; max-width: 140px; margin: 0 auto 28px auto;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding: 0;">
                            <h1 class="logo-heading heading-text" style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 36px; line-height: 1.3; color: #f51042; font-weight: 400; letter-spacing: 0.5px; text-align: center;">
                              Verify Your Message
                            </h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td class="email-padding" style="padding: 48px 48px;">
                      <p class="body-text" style="margin: 0 0 32px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1A1A1A;">
                        Thank you for reaching out to LocalCooks. We're excited to hear from you.
                      </p>
                      
                      <p class="body-text" style="margin: 0 0 40px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1A1A1A;">
                        To ensure we can respond to your message, please verify your email address by clicking the button below.
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
                        <tr>
                          <td align="center" style="padding: 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" style="background-color: #f51042; border-radius: 8px; box-shadow: 0 4px 12px rgba(245, 16, 66, 0.25);">
                                  <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" class="button-text" style="display: inline-block; padding: 16px 40px; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.5; color: #FFFFFF; text-decoration: none; border-radius: 8px; -webkit-text-size-adjust: none; mso-hide: all;">
                                    Verify Email Address
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p class="body-text" style="margin: 40px 0 0 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #666666; text-align: center; padding: 16px; background-color: #FFF9F5; border-radius: 6px;">
                        This verification link will expire in 7 days. If you didn't submit a contact form, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td class="email-padding" style="padding: 40px 48px 48px 48px; border-top: 1px solid #F0F0F0;">
                      <p style="margin: 0 0 20px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #999999; text-align: center;">
                        <a href="${baseUrl}" style="color: #f51042; text-decoration: none; font-weight: 500;">Visit our website</a>
                        <span style="color: #E0E0E0; margin: 0 10px;">|</span>
                        <a href="mailto:${config.unsubscribeEmail}" style="color: #f51042; text-decoration: none; font-weight: 500;">Contact Support</a>
                      </p>
                      <p style="margin: 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #CCCCCC; text-align: center;">
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
      Verify Your Contact Form Submission
      
      Thank you for reaching out to LocalCooks. We're excited to hear from you.
      
      To ensure we can respond to your message, please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This verification link will expire in 7 days. If you didn't submit a contact form, you can safely ignore this email.
      
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
  
  const logoUrl = `${baseUrl}/logo-lc.png`
  
  const mailOptions = {
    from: `"${config.org}" <${config.user}>`,
    to: email,
    subject: 'We received your message',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Message Received - LocalCooks</title>
          <!--[if mso]>
          <style type="text/css">
            body, table, td {font-family: Arial, sans-serif !important;}
            .logo-heading {font-family: Georgia, serif !important; text-align: center !important;}
          </style>
          <![endif]-->
          <!--[if !mso]><!-->
          <style type="text/css">
            /* Import Instrument Sans for body text - web-safe Georgia for headings */
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; max-width: 100% !important; }
              .email-padding { padding: 32px 24px !important; }
              .logo-container { padding: 32px 24px 24px 24px !important; }
              .logo-img { width: 120px !important; height: auto !important; }
              .heading-text { font-size: 28px !important; }
              .body-text { font-size: 15px !important; }
              .button-text { font-size: 15px !important; padding: 14px 32px !important; }
            }
          </style>
          <!--<![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F5F5F5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                  
                  <!-- Logo Header -->
                  <tr>
                    <td class="logo-container" style="padding: 48px 48px 32px 48px; text-align: center; border-bottom: 1px solid #F0F0F0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding: 0;">
                            <img src="${logoUrl}" alt="LocalCooks" class="logo-img" width="140" height="140" style="display: block; width: 140px; height: auto; max-width: 140px; margin: 0 auto 28px auto;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding: 0;">
                            <h1 class="logo-heading heading-text" style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 36px; line-height: 1.3; color: #f51042; font-weight: 400; letter-spacing: 0.5px; text-align: center;">
                              Message Received
                            </h1>
                            <p style="margin: 12px 0 0 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #666666; text-align: center;">
                              Hi ${name},
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td class="email-padding" style="padding: 48px 48px;">
                      <p class="body-text" style="margin: 0 0 32px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1A1A1A;">
                        Great news! Your email has been verified and we've received your message.
                      </p>
                      
                      <p class="body-text" style="margin: 0 0 24px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.7; color: #1A1A1A;">
                        What happens next?
                      </p>
                      
                      <!-- Next steps list -->
                      <div style="background-color: #FFF9F5; padding: 24px; border-radius: 6px; border-left: 3px solid #f51042; margin-bottom: 32px;">
                        <ul style="font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1A1A1A; padding-left: 20px; margin: 0; line-height: 1.8;">
                          <li style="margin-bottom: 12px;">We'll review your message carefully</li>
                          <li style="margin-bottom: 12px;">Expect a response within 24 hours</li>
                          <li>We'll get back to you at this email address</li>
                        </ul>
                      </div>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
                        <tr>
                          <td align="center" style="padding: 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" style="background-color: #f51042; border-radius: 8px; box-shadow: 0 4px 12px rgba(245, 16, 66, 0.25);">
                                  <a href="${baseUrl}" target="_blank" rel="noopener noreferrer" class="button-text" style="display: inline-block; padding: 16px 40px; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.5; color: #FFFFFF; text-decoration: none; border-radius: 8px; -webkit-text-size-adjust: none; mso-hide: all;">
                                    Visit LocalCooks
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td class="email-padding" style="padding: 40px 48px 48px 48px; border-top: 1px solid #F0F0F0;">
                      <p style="margin: 0 0 20px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #999999; text-align: center;">
                        <a href="${baseUrl}" style="color: #f51042; text-decoration: none; font-weight: 500;">Visit our website</a>
                      </p>
                      <p style="margin: 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #CCCCCC; text-align: center;">
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
      Message Received
      
      Hi ${name},
      
      Great news! Your email has been verified and we've received your message.
      
      What happens next?
      - We'll review your message carefully
      - Expect a response within 24 hours
      - We'll get back to you at this email address
      
      Visit us at: ${baseUrl}
      
      © ${new Date().getFullYear()} LocalCooks. All rights reserved.
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
  
  const logoUrl = `${baseUrl}/logo-lc.png`
  
  const mailOptions = {
    from: `"${config.org}" <${config.user}>`,
    to: email,
    subject: 'Welcome to LocalCooks',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Welcome to LocalCooks</title>
          <!--[if mso]>
          <style type="text/css">
            body, table, td {font-family: Arial, sans-serif !important;}
            .logo-heading {font-family: Georgia, serif !important; text-align: center !important;}
          </style>
          <![endif]-->
          <!--[if !mso]><!-->
          <style type="text/css">
            /* Import Instrument Sans for body text - web-safe Georgia for headings */
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; max-width: 100% !important; }
              .email-padding { padding: 32px 24px !important; }
              .logo-container { padding: 32px 24px 24px 24px !important; }
              .logo-img { width: 120px !important; height: auto !important; }
              .heading-text { font-size: 28px !important; }
              .body-text { font-size: 15px !important; }
              .button-text { font-size: 15px !important; padding: 14px 32px !important; }
            }
          </style>
          <!--<![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F5F5F5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                  
                  <!-- Logo Header -->
                  <tr>
                    <td class="logo-container" style="padding: 48px 48px 32px 48px; text-align: center; border-bottom: 1px solid #F0F0F0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding: 0;">
                            <img src="${logoUrl}" alt="LocalCooks" class="logo-img" width="140" height="140" style="display: block; width: 140px; height: auto; max-width: 140px; margin: 0 auto 28px auto;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding: 0;">
                            <h1 class="logo-heading heading-text" style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 36px; line-height: 1.3; color: #f51042; font-weight: 400; letter-spacing: 0.5px; text-align: center;">
                              You're All Set
                            </h1>
                            <p style="margin: 12px 0 0 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #666666; text-align: center;">
                              Welcome to the LocalCooks family
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td class="email-padding" style="padding: 48px 48px;">
                      <p class="body-text" style="margin: 0 0 32px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1A1A1A;">
                        Great news! Your email has been verified and you're now subscribed to the LocalCooks newsletter.
                      </p>
                      
                      <p class="body-text" style="margin: 0 0 24px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.7; color: #1A1A1A;">
                        You'll now receive:
                      </p>
                      
                      <!-- Benefits list -->
                      <div style="background-color: #FFF9F5; padding: 24px; border-radius: 6px; border-left: 3px solid #f51042; margin-bottom: 32px;">
                        <ul style="font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1A1A1A; padding-left: 20px; margin: 0; line-height: 1.8;">
                          <li style="margin-bottom: 12px;">Updates about new chefs joining our platform</li>
                          <li style="margin-bottom: 12px;">Exclusive deals and special offers</li>
                          <li style="margin-bottom: 12px;">Authentic recipes from your neighborhood</li>
                          <li>Tips and stories from our community</li>
                        </ul>
                      </div>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
                        <tr>
                          <td align="center" style="padding: 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" style="background-color: #f51042; border-radius: 8px; box-shadow: 0 4px 12px rgba(245, 16, 66, 0.25);">
                                  <a href="${baseUrl}" target="_blank" rel="noopener noreferrer" class="button-text" style="display: inline-block; padding: 16px 40px; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.5; color: #FFFFFF; text-decoration: none; border-radius: 8px; -webkit-text-size-adjust: none; mso-hide: all;">
                                    Explore LocalCooks
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Unsubscribe info -->
                      <p class="body-text" style="margin: 40px 0 0 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.7; color: #666666; padding-top: 32px; border-top: 1px solid #F0F0F0;">
                        If you ever want to unsubscribe, just reply to this email or contact us at 
                        <a href="mailto:${config.unsubscribeEmail}" style="color: #f51042; text-decoration: none; font-weight: 500;">${config.unsubscribeEmail}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td class="email-padding" style="padding: 40px 48px 48px 48px; border-top: 1px solid #F0F0F0;">
                      <p style="margin: 0 0 20px 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #999999; text-align: center;">
                        <a href="${baseUrl}" style="color: #f51042; text-decoration: none; font-weight: 500;">Visit our website</a>
                      </p>
                      <p style="margin: 0; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #CCCCCC; text-align: center;">
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
      You're All Set
      
      Welcome to the LocalCooks family!
      
      Great news! Your email has been verified and you're now subscribed to the LocalCooks newsletter.
      
      You'll now receive:
      - Updates about new chefs joining our platform
      - Exclusive deals and special offers
      - Authentic recipes from your neighborhood
      - Tips and stories from our community
      
      Visit us at: ${baseUrl}
      
      If you ever want to unsubscribe, just reply to this email or contact us at ${config.unsubscribeEmail}
      
      © ${new Date().getFullYear()} LocalCooks. All rights reserved.
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

