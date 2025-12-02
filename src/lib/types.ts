export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  author_name: string
  published: boolean
  created_at: string
  updated_at: string
}

export interface CreateBlogPostInput {
  title: string
  slug: string
  content: string
  excerpt?: string
  author_name: string
}

