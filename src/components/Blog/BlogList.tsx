import { motion } from 'motion/react'
import BlogCard from './BlogCard'
import type { BlogPost } from '../../lib/types'

interface BlogListProps {
  posts: BlogPost[]
}

export default function BlogList({ posts }: BlogListProps) {
  console.log('BlogList: Rendering with posts:', posts.length, posts)
  
  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-body text-lg text-[var(--color-charcoal)]/60">
          No blog posts available yet. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {posts.map((post, index) => {
        console.log('BlogList: Rendering post:', post.id, post.title)
        return (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <BlogCard post={post} />
        </motion.div>
        )
      })}
    </div>
  )
}

