import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified' | 'expired'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const alreadyVerified = searchParams.get('already_verified')

    if (success === 'true' && alreadyVerified === 'true') {
      setStatus('already_verified')
    } else if (success === 'true') {
      setStatus('success')
    } else if (error) {
      setStatus('error')
      switch (error) {
        case 'missing_token':
          setErrorMessage('Verification token is missing. Please check your email and click the verification link again.')
          break
        case 'invalid_token':
          setErrorMessage('Invalid verification token. The link may have been used already or is incorrect.')
          break
        case 'expired_token':
          setErrorMessage('This verification link has expired. Please request a new verification email.')
          break
        case 'verification_failed':
          setErrorMessage('Verification failed. Please try again or contact support if the problem persists.')
          break
        case 'server_error':
          setErrorMessage('A server error occurred. Please try again later.')
          break
        default:
          setErrorMessage('An error occurred during verification. Please try again.')
      }
    } else {
      // No parameters - show loading or redirect
      setStatus('error')
      setErrorMessage('No verification token provided.')
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-[var(--color-cream)] flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-2xl border border-white/50">
            {status === 'loading' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6">
                  <svg className="animate-spin w-full h-full text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <h1 className="font-heading text-2xl text-[var(--color-charcoal)] mb-2">
                  Verifying...
                </h1>
                <p className="font-body text-[var(--color-charcoal)]/60">
                  Please wait while we verify your email address.
                </p>
              </div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-6 bg-[var(--color-sage)]/20 rounded-full flex items-center justify-center"
                >
                  <svg className="w-10 h-10 text-[var(--color-sage)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h1 className="font-heading text-3xl text-[var(--color-charcoal)] mb-4">
                  Email Verified! 🎉
                </h1>
                <p className="font-body text-lg text-[var(--color-charcoal)]/70 mb-2">
                  Thank you for verifying your email address.
                </p>
                <p className="font-body text-base text-[var(--color-charcoal)]/60 mb-8">
                  You're now subscribed to our newsletter and will receive updates about new chefs, exclusive deals, and authentic recipes.
                </p>
                <div className="space-y-3">
                  <Link
                    to="/"
                    className="block w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-body font-semibold py-4 px-6 rounded-full transition-colors duration-300 text-center"
                  >
                    Return to Home
                  </Link>
                  <Link
                    to="/blog"
                    className="block w-full bg-transparent border-2 border-[var(--color-charcoal)]/20 hover:border-[var(--color-primary)] text-[var(--color-charcoal)] font-body font-semibold py-4 px-6 rounded-full transition-colors duration-300 text-center"
                  >
                    Explore Our Blog
                  </Link>
                </div>
              </motion.div>
            )}

            {status === 'already_verified' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-6 bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center"
                >
                  <svg className="w-10 h-10 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h1 className="font-heading text-3xl text-[var(--color-charcoal)] mb-4">
                  Already Verified
                </h1>
                <p className="font-body text-lg text-[var(--color-charcoal)]/70 mb-8">
                  Your email address has already been verified. You're all set!
                </p>
                <Link
                  to="/"
                  className="inline-block bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-body font-semibold py-4 px-8 rounded-full transition-colors duration-300"
                >
                  Return to Home
                </Link>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.div>
                <h1 className="font-heading text-3xl text-[var(--color-charcoal)] mb-4">
                  Verification Failed
                </h1>
                <p className="font-body text-base text-[var(--color-charcoal)]/70 mb-8">
                  {errorMessage || 'An error occurred during verification. Please try again.'}
                </p>
                <div className="space-y-3">
                  <Link
                    to="/"
                    className="block w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-body font-semibold py-4 px-6 rounded-full transition-colors duration-300 text-center"
                  >
                    Return to Home
                  </Link>
                  <Link
                    to="/contact"
                    className="block w-full bg-transparent border-2 border-[var(--color-charcoal)]/20 hover:border-[var(--color-primary)] text-[var(--color-charcoal)] font-body font-semibold py-4 px-6 rounded-full transition-colors duration-300 text-center"
                  >
                    Contact Support
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}

