import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import SmoothScroll from '../components/SmoothScroll'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SEOHead from '../components/SEO/SEOHead'
import { useAuth } from '../hooks/useAuth'

function AdminLoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAdmin, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!authLoading && isAdmin) {
      navigate('/blog', { replace: true })
    }
  }, [isAdmin, authLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password)
      // Redirect to blog page after successful login
      navigate('/blog')
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-body text-[var(--color-charcoal)]/60">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAdmin) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] overflow-x-hidden max-w-[100vw] w-full box-border">
      <SEOHead title="Admin Login" noIndex={true} />
      <Navbar />
      
      <section className="pt-32 pb-24 px-3 sm:px-4 md:px-6 overflow-x-clip">
        <div className="max-w-md mx-auto w-full box-border">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="bg-white rounded-2xl shadow-xl p-8 sm:p-10"
          >
            <div className="text-center mb-8">
              <h1 className="font-display text-4xl sm:text-5xl text-[var(--color-primary)] mb-4 uppercase tracking-tight">
                Admin Login
              </h1>
              <p className="font-body text-[var(--color-charcoal)]/60">
                Sign in to create and manage blog posts
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-body text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block font-body font-semibold text-[var(--color-charcoal)] mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 font-body transition-all duration-300"
                  placeholder="admin@example.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block font-body font-semibold text-[var(--color-charcoal)] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 font-body transition-all duration-300"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-6 py-3 rounded-full font-body font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-[var(--color-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="font-body text-sm text-[var(--color-charcoal)]/60">
                Only authorized administrators can access this page.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <SmoothScroll>
      <AdminLoginPageContent />
    </SmoothScroll>
  )
}

