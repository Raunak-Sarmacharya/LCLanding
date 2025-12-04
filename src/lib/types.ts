export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  author_name: string
  published: boolean
  created_at: string
  updated_at: string
  tags?: string[] | null
}

export interface CreateBlogPostInput {
  title: string
  slug?: string
  content: string
  excerpt?: string
  author_name: string
  tags?: string[]
}

