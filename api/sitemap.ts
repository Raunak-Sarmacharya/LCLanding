import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Configure runtime
export const config = {
  runtime: 'nodejs'
}

interface BlogPost {
  slug: string
  updated_at: string
  created_at?: string
  image_url?: string | null
  title: string
  excerpt?: string | null
}

// ============================================================
// Enterprise-Grade XML Sitemap for localcooks.ca
// Optimized for Google Sitelinks, News, and Image indexing
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    let blogPosts: BlogPost[] = []

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      const { data, error } = await supabase
        .from('posts')
        .select('slug, updated_at, created_at, image_url, title, excerpt')
        .eq('published', true)
        .order('updated_at', { ascending: false })
        .limit(200)

      if (!error && data) {
        blogPosts = data
      }
    }

    const baseUrl = 'https://www.localcooks.ca'
    const today = new Date().toISOString().split('T')[0]
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

    // Determine if blog posts qualify for Google News (published within 2 days)
    const isRecentPost = (post: BlogPost) => {
      const pubDate = new Date(post.created_at || post.updated_at)
      return pubDate > twoDaysAgo
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
                            http://www.google.com/schemas/sitemap-image/1.1
                            http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd
                            http://www.google.com/schemas/sitemap-news/0.9
                            http://www.google.com/schemas/sitemap-news/0.9/sitemap-news.xsd">

  <!-- ================================== -->
  <!-- HOMEPAGE - Priority 1.0           -->
  <!-- ================================== -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en-CA" href="${baseUrl}/" />
    <image:image>
      <image:loc>${baseUrl}/chef.png</image:loc>
      <image:title>Local chef cooking authentic homemade meals in St. John's, Newfoundland</image:title>
      <image:caption>LocalCooks - The operating system for local food businesses. Compliance, payments, kitchen access, and delivery infrastructure.</image:caption>
    </image:image>
    <image:image>
      <image:loc>${baseUrl}/logo-lc.png</image:loc>
      <image:title>LocalCooks Logo</image:title>
    </image:image>
    <image:image>
      <image:loc>${baseUrl}/chef1.png</image:loc>
      <image:title>Home chef preparing authentic cuisine on LocalCooks platform</image:title>
    </image:image>
  </url>

  <!-- ================================== -->
  <!-- KEY SECTIONS - Priority 0.9       -->
  <!-- These are the sitelink candidates -->
  <!-- ================================== -->

  <!-- Blog - Distinct route, highest sitelink priority -->
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en-CA" href="${baseUrl}/blog" />
  </url>

  <!-- Contact - Distinct route -->
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en-CA" href="${baseUrl}/contact" />
  </url>

  <!-- ================================== -->
  <!-- HOMEPAGE SECTIONS - Priority 0.8  -->
  <!-- Anchor sections for sitelink hint -->
  <!-- ================================== -->

  <!-- About section -->
  <url>
    <loc>${baseUrl}/#about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- How It Works (chef platform + process) -->
  <url>
    <loc>${baseUrl}/#chefs</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Testimonials section -->
  <url>
    <loc>${baseUrl}/#testimonials</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- ================================== -->
  <!-- BLOG POSTS - Priority 0.7         -->
  <!-- With News markup for recent posts  -->
  <!-- ================================== -->
${blogPosts.map(post => {
  const postDate = post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : today
  const pubDate = post.created_at ? new Date(post.created_at).toISOString() : new Date(post.updated_at).toISOString()
  const isNews = isRecentPost(post)
  
  return `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${postDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="en-CA" href="${baseUrl}/blog/${post.slug}" />${post.image_url ? `
    <image:image>
      <image:loc>${post.image_url}</image:loc>
      <image:title>${escapeXml(post.title)}</image:title>${post.excerpt ? `
      <image:caption>${escapeXml(post.excerpt.substring(0, 200))}</image:caption>` : ''}
    </image:image>` : ''}${isNews ? `
    <news:news>
      <news:publication>
        <news:name>LocalCooks Blog</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>` : ''}
  </url>`
}).join('\n')}

  <!-- ================================== -->
  <!-- LEGAL PAGES - Priority 0.3        -->
  <!-- ================================== -->
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

</urlset>`

    res.setHeader('Content-Type', 'application/xml; charset=UTF-8')
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400')
    res.setHeader('X-Robots-Tag', 'noindex')
    
    return res.status(200).send(sitemap)
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.localcooks.ca/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.localcooks.ca/blog</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.localcooks.ca/contact</loc>
    <priority>0.9</priority>
  </url>
</urlset>`

    res.setHeader('Content-Type', 'application/xml')
    return res.status(200).send(basicSitemap)
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

