import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../hooks/useAuth'
import { getBlogPostsAdmin, deleteBlogPost, toggleBlogPostPublished } from '../../lib/api'
import { clearBlogPostsCache } from '../../hooks/useBlog'
import { formatDate } from '../../lib/blogUtils'
import type { BlogPost } from '../../lib/types'

type Filter = 'all' | 'published' | 'draft'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<BlogPost | null>(null)
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null)

  const loadPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      const allPosts = await getBlogPostsAdmin()
      setPosts(allPosts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPosts() }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const handleDelete = async (post: BlogPost) => {
    setDeletingSlug(post.slug)
    try {
      await deleteBlogPost(post.slug)
      clearBlogPostsCache()
      setPosts((prev) => prev.filter((p) => p.slug !== post.slug))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post')
    } finally {
      setDeletingSlug(null)
      setConfirmDelete(null)
    }
  }

  const handleTogglePublish = async (post: BlogPost) => {
    setTogglingSlug(post.slug)
    try {
      const updated = await toggleBlogPostPublished(post.slug, !post.published)
      clearBlogPostsCache()
      setPosts((prev) => prev.map((p) => p.slug === post.slug ? { ...p, published: updated.published } : p))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post status')
    } finally {
      setTogglingSlug(null)
    }
  }

  const filteredPosts = posts.filter((p) => {
    if (filter === 'published') return p.published
    if (filter === 'draft') return !p.published
    return true
  })

  const publishedCount = posts.filter((p) => p.published).length
  const draftCount = posts.filter((p) => !p.published).length

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--color-charcoal)]/10 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link to="/" className="font-heading text-lg text-[var(--color-primary)] shrink-0">LocalCooks</Link>
          <div className="h-5 w-px bg-[var(--color-charcoal)]/15" />
          <span className="font-body text-sm text-[var(--color-charcoal)]/50 hidden sm:inline">Admin Dashboard</span>
          <div className="flex-1" />
          <Link
            to="/blog/new"
            className="flex items-center gap-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-4 py-2 rounded-full font-body text-sm font-semibold transition-all duration-200 shadow-md shadow-[var(--color-primary)]/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            New Post
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-body text-[var(--color-charcoal)]/50 hover:text-[var(--color-charcoal)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl text-[var(--color-charcoal)] mb-1">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="font-body text-[var(--color-charcoal)]/50">Manage your blog posts from here.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Posts', value: posts.length, icon: '📄', color: 'bg-[var(--color-charcoal)]/5' },
            { label: 'Published', value: publishedCount, icon: '🟢', color: 'bg-green-50' },
            { label: 'Drafts', value: draftCount, icon: '📝', color: 'bg-amber-50' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-2xl px-5 py-4 border border-[var(--color-charcoal)]/8`}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="font-heading text-2xl text-[var(--color-charcoal)]">{stat.value}</div>
              <div className="font-body text-xs text-[var(--color-charcoal)]/50 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-[var(--color-charcoal)]/6 rounded-xl p-1 w-fit mb-6">
          {(['all', 'published', 'draft'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg font-body text-sm font-medium capitalize transition-all duration-200 ${
                filter === f
                  ? 'bg-white text-[var(--color-charcoal)] shadow-sm'
                  : 'text-[var(--color-charcoal)]/50 hover:text-[var(--color-charcoal)]'
              }`}
            >
              {f} {f === 'all' ? `(${posts.length})` : f === 'published' ? `(${publishedCount})` : `(${draftCount})`}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm font-body text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <svg className="w-4 h-4 text-red-400 hover:text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        {/* Posts Table */}
        <div className="bg-white rounded-2xl border border-[var(--color-charcoal)]/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <p className="font-body text-sm text-[var(--color-charcoal)]/50">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-heading text-2xl text-[var(--color-charcoal)]/30 mb-2">No posts yet</p>
              <p className="font-body text-sm text-[var(--color-charcoal)]/40 mb-6">
                {filter !== 'all' ? `No ${filter} posts found` : 'Start writing your first post!'}
              </p>
              <Link to="/blog/new" className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-full font-body text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors">
                Write a Post
              </Link>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-charcoal)]/8 bg-[var(--color-charcoal)]/3">
                  <th className="px-5 py-3 font-body text-xs font-semibold text-[var(--color-charcoal)]/40 uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3 font-body text-xs font-semibold text-[var(--color-charcoal)]/40 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-5 py-3 font-body text-xs font-semibold text-[var(--color-charcoal)]/40 uppercase tracking-wider hidden md:table-cell">Author</th>
                  <th className="px-5 py-3 font-body text-xs font-semibold text-[var(--color-charcoal)]/40 uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="px-5 py-3 font-body text-xs font-semibold text-[var(--color-charcoal)]/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post, i) => (
                  <motion.tr
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-[var(--color-charcoal)]/6 hover:bg-[var(--color-charcoal)]/2 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-body font-medium text-[var(--color-charcoal)] text-sm line-clamp-1">{post.title}</p>
                        {post.excerpt && <p className="font-body text-xs text-[var(--color-charcoal)]/40 line-clamp-1 mt-0.5">{post.excerpt}</p>}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs font-body text-[var(--color-primary)] bg-[var(--color-primary)]/8 px-2 py-0.5 rounded-md">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      {/* Read-only status badge */}
                      <span className={`inline-flex items-center gap-1.5 text-xs font-body font-medium px-2.5 py-1 rounded-full select-none
                        ${post.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${post.published ? 'bg-green-500' : 'bg-amber-500'}`} />
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="font-body text-sm text-[var(--color-charcoal)]/60">{post.author_name}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div>
                        <span className="font-body text-xs text-[var(--color-charcoal)]/40">{formatDate(post.created_at)}</span>
                        {post.updated_at && post.updated_at !== post.created_at && (
                          <p className="font-body text-xs text-[var(--color-charcoal)]/30 mt-0.5">
                            Edited {formatDate(post.updated_at)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Publish / Unpublish — always visible, clearly labelled */}
                        <button
                          onClick={() => handleTogglePublish(post)}
                          disabled={togglingSlug === post.slug}
                          title={post.published ? 'Unpublish this post' : 'Publish this post'}
                          className={`inline-flex items-center gap-1 text-xs font-body font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-wait
                            ${post.published
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                              : 'text-green-700 bg-green-50 hover:bg-green-100'
                            }`}
                        >
                          {togglingSlug === post.slug ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : post.published ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                          {togglingSlug === post.slug ? '...' : post.published ? 'Unpublish' : 'Publish'}
                        </button>

                        {/* Divider */}
                        <div className="w-px h-4 bg-[var(--color-charcoal)]/10" />

                        {/* Preview */}
                        <Link
                          to={`/blog/${post.slug}`}
                          target="_blank"
                          title={post.published ? 'View live post' : 'Preview draft'}
                          className="p-1.5 rounded-lg text-[var(--color-charcoal)]/30 hover:text-[var(--color-charcoal)] hover:bg-[var(--color-charcoal)]/8 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </Link>

                        {/* Edit */}
                        <Link to={`/blog/${post.slug}/edit`} title="Edit" className="p-1.5 rounded-lg text-[var(--color-charcoal)]/30 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/8 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Link>

                        {/* Delete */}
                        <button
                          onClick={() => setConfirmDelete(post)}
                          disabled={deletingSlug === post.slug}
                          title="Delete"
                          className="p-1.5 rounded-lg text-[var(--color-charcoal)]/30 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                        >
                          {deletingSlug === post.slug ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
              </div>
              <h3 className="font-heading text-xl text-[var(--color-charcoal)] mb-1">Delete post?</h3>
              <p className="font-body text-sm text-[var(--color-charcoal)]/60 mb-2 line-clamp-2">"{confirmDelete.title}"</p>
              <p className="font-body text-xs text-[var(--color-charcoal)]/40 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-full border border-[var(--color-charcoal)]/20 font-body text-sm font-medium hover:bg-[var(--color-charcoal)]/5 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-body text-sm font-semibold transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
