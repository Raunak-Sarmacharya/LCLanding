import { Navigate } from 'react-router-dom'
import AdminDashboard from '../components/Blog/AdminDashboard'
import SEOHead from '../components/SEO/SEOHead'
import { useAuth } from '../hooks/useAuth'

export default function AdminDashboardPage() {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) return <Navigate to="/admin/login" replace />

  return (
    <>
      <SEOHead title="Admin Dashboard — LocalCooks" noIndex={true} />
      <AdminDashboard />
    </>
  )
}
