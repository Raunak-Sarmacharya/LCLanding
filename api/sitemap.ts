import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Configure runtime
export const config = {
  runtime: 'nodejs'
}

interface BlogPost {
  slug: string
  updated_at: string
  image_url?: string | null
  title: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    let blogPosts: BlogPost[] = []

    // Try to fetch blog posts from Supabase
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      const { data, error } = await supabase
        .from('posts')
        .select('slug, updated_at, image_url, title')
        .eq('published', true)
        .order('updated_at', { ascending: false })
        .limit(100)

      if (!error && data) {
        blogPosts = data
      }
    }

    const baseUrl = 'https://www.localcooks.ca'
    const today = new Date().toISOString().split('T')[0]

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  
  <!-- Homepage - Highest Priority -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${baseUrl}/chef.png</image:loc>
      <image:title>Local chef cooking authentic homemade meals</image:title>
      <image:caption>LocalCooks - Discover homemade meals from passionate local chefs in St. John's, Newfoundland</image:caption>
    </image:image>
    <image:image>
      <image:loc>${baseUrl}/logo-lc.png</image:loc>
      <image:title>LocalCooks Logo</image:title>
    </image:image>
  </url>

  <!-- Blog Section - High Priority for SEO -->
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Contact Page -->
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Terms of Service -->
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Privacy Policy -->
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Dynamic Blog Posts -->
${blogPosts.map(post => `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>${post.image_url ? `
    <image:image>
      <image:loc>${post.image_url}</image:loc>
      <image:title>${escapeXml(post.title)}</image:title>
    </image:image>` : ''}
  </url>`).join('\n')}

</urlset>`

    // Set headers for XML response
    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400') // 1 hour client, 24 hours CDN
    
    return res.status(200).send(sitemap)
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Return a basic sitemap on error
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.localcooks.ca/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.localcooks.ca/blog</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.localcooks.ca/contact</loc>
    <priority>0.8</priority>
  </url>
</urlset>`

    res.setHeader('Content-Type', 'application/xml')
    return res.status(200).send(basicSitemap)
  }
}

// Helper function to escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

