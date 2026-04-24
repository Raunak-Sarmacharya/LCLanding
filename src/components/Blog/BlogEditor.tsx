import { useState, useEffect, useCallback, useRef, DragEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { createBlogPost, updateBlogPost, getBlogPost } from '../../lib/api'
import { clearBlogPostsCache } from '../../hooks/useBlog'
import type { BlogPost } from '../../lib/types'
import TiptapEditor from './TiptapEditor'
import TagInput from './TagInput'

interface BlogEditorProps {
  mode: 'create' | 'edit'
  postSlug?: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type UploadStatus = 'idle' | 'uploading' | 'done' | 'error'

const LOCAL_DRAFT_KEY = (slug: string) => `lc_blog_draft_${slug}`

async function uploadImageToSupabase(file: File): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase env vars not set')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('You must be logged in to upload images')

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `cover-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`

  const { error } = await supabase.storage
    .from('blog-images')
    .upload(filename, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('blog-images').getPublicUrl(filename)
  return data.publicUrl
}

export default function BlogEditor({ mode, postSlug }: BlogEditorProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [hasDraftRestore, setHasDraftRestore] = useState(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [existingPost, setExistingPost] = useState<BlogPost | null>(null)

  // Image upload state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftKey = postSlug ? LOCAL_DRAFT_KEY(postSlug) : LOCAL_DRAFT_KEY('new')

  // Load existing post for edit mode
  useEffect(() => {
    if (mode !== 'edit' || !postSlug) { setIsLoading(false); return }
    getBlogPost(postSlug).then((post) => {
      if (!post) { setError('Post not found'); setIsLoading(false); return }
      setExistingPost(post)
      setTitle(post.title)
      setContent(post.content)
      setExcerpt(post.excerpt || '')
      setAuthorName(post.author_name)
      setTags(post.tags || [])
      setImageUrl(post.image_url || '')
      setSlug(post.slug)
      setIsLoading(false)
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load post')
      setIsLoading(false)
    })
  }, [mode, postSlug])

  // Check for local draft on mount (create mode only)
  useEffect(() => {
    if (mode !== 'create') return
    const saved = localStorage.getItem(draftKey)
    if (saved) {
      try {
        const draft = JSON.parse(saved)
        if (draft.title || draft.content) setHasDraftRestore(true)
      } catch {}
    }
  }, [])

  const restoreDraft = () => {
    const saved = localStorage.getItem(draftKey)
    if (!saved) return
    try {
      const draft = JSON.parse(saved)
      if (draft.title) setTitle(draft.title)
      if (draft.content) setContent(draft.content)
      if (draft.excerpt) setExcerpt(draft.excerpt)
      if (draft.authorName) setAuthorName(draft.authorName)
      if (draft.tags) setTags(draft.tags)
      if (draft.imageUrl) setImageUrl(draft.imageUrl)
    } catch {}
    setHasDraftRestore(false)
  }

  const discardDraft = () => {
    localStorage.removeItem(draftKey)
    setHasDraftRestore(false)
  }

  // Auto-save to localStorage
  const scheduleSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      const draft = { title, content, excerpt, authorName, tags, imageUrl }
      localStorage.setItem(draftKey, JSON.stringify(draft))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 2500)
    setSaveStatus('saving')
  }, [title, content, excerpt, authorName, tags, imageUrl, draftKey])

  useEffect(() => {
    if (title || content) scheduleSave()
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [title, content, excerpt, authorName, tags, imageUrl])

  const handleSubmit = async (publish: boolean) => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!content.trim()) { setError('Content is required'); return }
    if (!authorName.trim()) { setError('Author name is required'); return }
    setIsSubmitting(true)
    setError(null)
    try {
      let post: BlogPost
      if (mode === 'create') {
        post = await createBlogPost({
          title: title.trim(),
          slug: slug.trim() || undefined,
          content: content.trim(),
          excerpt: excerpt.trim() || undefined,
          author_name: authorName.trim(),
          tags: tags.length > 0 ? tags : undefined,
          image_url: imageUrl.trim() || undefined,
          published: publish,
        } as any)
      } else {
        post = await updateBlogPost(postSlug!, {
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || null,
          author_name: authorName.trim(),
          tags: tags.length > 0 ? tags : null,
          image_url: imageUrl.trim() || null,
          published: publish,
        })
      }
      clearBlogPostsCache()
      localStorage.removeItem(draftKey)
      window.dispatchEvent(new CustomEvent(mode === 'create' ? 'blogPostCreated' : 'blogPostUpdated', { detail: { slug: post.slug } }))
      navigate(publish ? `/blog/${post.slug}` : '/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post')
      setIsSubmitting(false)
    }
  }

  const wordCount = content ? content.replace(/#+\s|[*_`>~\[\]()]/g, '').trim().split(/\s+/).filter(Boolean).length : 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  const liveSlug = slug || title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

  // Image upload handlers
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPG, PNG, GIF, WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5 MB')
      return
    }
    setUploadStatus('uploading')
    setUploadError(null)
    try {
      const url = await uploadImageToSupabase(file)
      setImageUrl(url)
      setUploadStatus('done')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
      setUploadStatus('error')
    }
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingOver(true) }
  const handleDragLeave = () => setIsDraggingOver(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-body text-[var(--color-charcoal)]/60">Loading post...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] flex flex-col">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-[var(--color-charcoal)]/10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-1.5 text-[var(--color-charcoal)]/50 hover:text-[var(--color-charcoal)] transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span className="text-sm font-body hidden sm:inline">Dashboard</span>
          </Link>

          <div className="flex-1 min-w-0">
            <p className="font-body text-sm text-[var(--color-charcoal)]/50 truncate">
              {title || <span className="italic">Untitled post</span>}
            </p>
          </div>

          {/* Save status */}
          <div className="shrink-0">
            <AnimatePresence mode="wait">
              {saveStatus === 'saving' && (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-[var(--color-charcoal)]/40 font-body">
                  Saving draft...
                </motion.span>
              )}
              {saveStatus === 'saved' && (
                <motion.span key="saved" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-green-600 font-body flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Saved locally
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--color-charcoal)]/20 text-[var(--color-charcoal)] font-body text-sm font-medium hover:bg-[var(--color-charcoal)]/5 transition-colors disabled:opacity-40"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-4 py-2 rounded-full font-body text-sm font-semibold transition-all duration-200 shadow-md shadow-[var(--color-primary)]/25 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" /> Publishing...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{mode === 'create' ? 'Publish' : 'Update'}</>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Draft Restore Banner ── */}
      <AnimatePresence>
        {hasDraftRestore && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-3 text-sm font-body">
              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              <span className="text-amber-800">You have an unsaved draft. Restore it?</span>
              <button onClick={restoreDraft} className="font-semibold text-amber-700 hover:text-amber-900 underline">Restore</button>
              <button onClick={discardDraft} className="text-amber-600/60 hover:text-amber-600">Discard</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center gap-2 text-sm font-body text-red-700">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* Editor Panel */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 md:px-12 py-10">
          <div className="max-w-[720px] mx-auto">
            {/* Title */}
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title..."
              rows={2}
              className="w-full bg-transparent outline-none resize-none font-heading text-3xl sm:text-4xl md:text-5xl text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal)]/25 leading-tight mb-4 border-none"
            />

            {/* Excerpt */}
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short excerpt (shown on blog cards)..."
              rows={2}
              className="w-full bg-transparent outline-none resize-none font-body text-lg text-[var(--color-charcoal)]/60 placeholder:text-[var(--color-charcoal)]/25 leading-relaxed mb-6 border-none border-b border-dashed border-[var(--color-charcoal)]/15 pb-6"
            />

            {/* Tiptap */}
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your post..."
            />
          </div>
        </main>

        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-[300px] xl:w-[340px] shrink-0 border-l border-[var(--color-charcoal)]/10 bg-white/50 px-6 py-8 gap-6 overflow-y-auto max-h-[calc(100vh-3.5rem)] sticky top-14">

          {/* Post Status */}
          <div>
            <p className="text-xs font-body font-semibold text-[var(--color-charcoal)]/40 uppercase tracking-widest mb-2">Status</p>
            {mode === 'edit' && existingPost ? (
              <span className={`inline-flex items-center gap-1.5 text-sm font-body font-medium px-3 py-1.5 rounded-full ${existingPost.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${existingPost.published ? 'bg-green-500' : 'bg-amber-500'}`} />
                {existingPost.published ? 'Published' : 'Draft'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-body font-medium px-3 py-1.5 rounded-full bg-[var(--color-charcoal)]/8 text-[var(--color-charcoal)]/60">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-charcoal)]/30" />
                Not published
              </span>
            )}
          </div>

          <div className="w-full h-px bg-[var(--color-charcoal)]/8" />

          {/* Author */}
          <div>
            <label className="text-xs font-body font-semibold text-[var(--color-charcoal)]/40 uppercase tracking-widest block mb-2">Author *</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-charcoal)]/20 bg-white focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none font-body text-sm text-[var(--color-charcoal)] transition-all duration-200"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-body font-semibold text-[var(--color-charcoal)]/40 uppercase tracking-widest block mb-2">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
            <p className="text-xs text-[var(--color-charcoal)]/40 font-body mt-1.5">Press Enter or comma to add</p>
          </div>

          {/* Cover Image */}
          <div>
            <label className="text-xs font-body font-semibold text-[var(--color-charcoal)]/40 uppercase tracking-widest block mb-2">Cover Image</label>

            {/* Uploaded / existing preview */}
            {imageUrl.trim() ? (
              <div className="relative rounded-xl overflow-hidden border border-[var(--color-charcoal)]/10 aspect-video bg-[var(--color-charcoal)]/5 group">
                <img
                  src={imageUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/90 text-[var(--color-charcoal)] text-xs font-semibold font-body px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => { setImageUrl(''); setUploadStatus('idle') }}
                    className="bg-red-500/90 text-white text-xs font-semibold font-body px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 py-7 px-4 text-center
                  ${isDraggingOver
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 scale-[1.01]'
                    : 'border-[var(--color-charcoal)]/20 bg-[var(--color-charcoal)]/2 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/3'
                  }`}
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                    <p className="font-body text-xs text-[var(--color-charcoal)]/50">Uploading...</p>
                  </>
                ) : (
                  <>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDraggingOver ? 'bg-[var(--color-primary)]/15' : 'bg-[var(--color-charcoal)]/8'}`}>
                      <svg className={`w-5 h-5 ${isDraggingOver ? 'text-[var(--color-primary)]' : 'text-[var(--color-charcoal)]/40'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-[var(--color-charcoal)]/70">
                        {isDraggingOver ? 'Drop to upload' : 'Upload cover image'}
                      </p>
                      <p className="font-body text-xs text-[var(--color-charcoal)]/40 mt-0.5">Drag & drop or click · JPG, PNG, WebP · max 5 MB</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = '' }}
            />

            {/* Upload error */}
            {uploadError && (
              <p className="mt-1.5 text-xs text-red-500 font-body">{uploadError}</p>
            )}

            {/* Paste URL fallback */}
            {!imageUrl && (
              <div className="mt-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste image URL..."
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-charcoal)]/15 bg-white focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none font-body text-xs text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal)]/30 transition-all duration-200"
                />
              </div>
            )}
          </div>

          {/* URL Slug */}
          <div>
            <label className="text-xs font-body font-semibold text-[var(--color-charcoal)]/40 uppercase tracking-widest block mb-2">URL Slug</label>
            {mode === 'edit' ? (
              <p className="font-mono text-xs text-[var(--color-charcoal)]/60 bg-[var(--color-charcoal)]/5 px-3 py-2 rounded-lg">{slug}</p>
            ) : (
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-from-title"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-charcoal)]/20 bg-white focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none font-mono text-xs text-[var(--color-charcoal)] transition-all duration-200"
              />
            )}
            <p className="text-xs text-[var(--color-charcoal)]/35 font-body mt-1.5 break-all">
              /blog/<span className="text-[var(--color-charcoal)]/60">{liveSlug || '...'}</span>
            </p>
          </div>

          {/* Stats */}
          <div>
            <label className="text-xs font-body font-semibold text-[var(--color-charcoal)]/40 uppercase tracking-widest block mb-2">Stats</label>
            <div className="flex gap-4 text-sm font-body text-[var(--color-charcoal)]/60">
              <div><span className="font-semibold text-[var(--color-charcoal)]">{wordCount}</span> words</div>
              <div><span className="font-semibold text-[var(--color-charcoal)]">~{readTime}</span> min read</div>
            </div>
          </div>

          <div className="w-full h-px bg-[var(--color-charcoal)]/8" />

          {/* Mobile publish buttons */}
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-full border border-[var(--color-charcoal)]/20 text-[var(--color-charcoal)] font-body text-sm font-medium hover:bg-[var(--color-charcoal)]/5 transition-colors disabled:opacity-40"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-body text-sm font-semibold transition-all duration-200 shadow-md shadow-[var(--color-primary)]/25 disabled:opacity-50"
          >
            {mode === 'create' ? 'Publish Post' : 'Update & Publish'}
          </button>

          {/* Delete (edit mode only) */}
          {mode === 'edit' && (
            <>
              <div className="w-full h-px bg-[var(--color-charcoal)]/8" />
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-sm font-body text-red-500 hover:text-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                Delete this post
              </button>
            </>
          )}
        </aside>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="font-heading text-xl text-[var(--color-charcoal)] mb-2">Delete post?</h3>
              <p className="font-body text-[var(--color-charcoal)]/60 text-sm mb-6">This action cannot be undone. The post will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-full border border-[var(--color-charcoal)]/20 text-[var(--color-charcoal)] font-body text-sm font-medium hover:bg-[var(--color-charcoal)]/5 transition-colors">Cancel</button>
                <button
                  onClick={async () => {
                    if (!postSlug) return
                    try {
                      const { deleteBlogPost } = await import('../../lib/api')
                      await deleteBlogPost(postSlug)
                      clearBlogPostsCache()
                      navigate('/admin')
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to delete post')
                      setShowDeleteConfirm(false)
                    }
                  }}
                  className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-body text-sm font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
