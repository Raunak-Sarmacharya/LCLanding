import { Navigate, useParams } from 'react-router-dom'
import SmoothScroll from '../components/SmoothScroll'
import BlogMetaTags from '../components/Blog/BlogMetaTags'
import BlogEditor from '../components/Blog/BlogEditor'
import { useAuth } from '../hooks/useAuth'

export default function EditBlogPostPage() {
  const { isAdmin, isLoading } = useAuth()
  const { slug } = useParams<{ slug: string }>()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) return <Navigate to="/admin/login" replace />

  return (
    <SmoothScroll>
      <BlogMetaTags title="Edit Post — LocalCooks Admin" description="Edit your blog post." />
      <BlogEditor mode="edit" postSlug={slug} />
    </SmoothScroll>
  )
}
