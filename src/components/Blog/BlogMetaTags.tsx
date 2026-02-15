import { Helmet } from 'react-helmet-async'
import { seoDefaults, createBreadcrumbSchema } from '../SEO/SEOHead'

interface BlogMetaTagsProps {
  title: string
  description?: string
  // For individual blog posts
  slug?: string
  image?: string
  imageAlt?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
  content?: string // For reading time calculation and article length
}

// Calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const text = content.replace(/<[^>]*>/g, '') // Strip HTML
  const wordCount = text.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

// Create Article structured data for blog posts
function createArticleSchema(props: {
  title: string
  description: string
  url: string
  image: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
  wordCount?: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${props.url}#article`,
    headline: props.title,
    description: props.description,
    image: {
      '@type': 'ImageObject',
      url: props.image,
      width: 1200,
      height: 630,
    },
    datePublished: props.publishedTime || new Date().toISOString(),
    dateModified: props.modifiedTime || props.publishedTime || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: props.author || 'LocalCooks Team',
      url: 'https://www.localcooks.ca',
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://www.localcooks.ca/#organization',
      name: 'LocalCooks',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.localcooks.ca/logo-lc.png',
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': props.url,
    },
    ...(props.wordCount && { wordCount: props.wordCount }),
    ...(props.tags && props.tags.length > 0 && { 
      keywords: props.tags.join(', '),
      articleSection: props.tags[0],
    }),
    inLanguage: 'en-CA',
    isPartOf: {
      '@type': 'Blog',
      '@id': 'https://www.localcooks.ca/blog#blog',
      name: 'Beyond the Plate - LocalCooks Blog',
      description: 'Explore the people, partnerships, and product updates shaping Local Cooks—and why better local food access matters.',
    },
  }
}

// Create Blog structured data for the blog listing page
const blogSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  '@id': 'https://www.localcooks.ca/blog#blog',
  name: 'Beyond the Plate - LocalCooks Blog',
  description: 'Explore the people, partnerships, and product updates shaping Local Cooks—and why better local food access matters.',
  url: 'https://www.localcooks.ca/blog',
  publisher: {
    '@type': 'Organization',
    '@id': 'https://www.localcooks.ca/#organization',
    name: 'LocalCooks',
  },
  inLanguage: 'en-CA',
}

export default function BlogMetaTags({
  title,
  description,
  slug,
  image,
  imageAlt,
  publishedTime,
  modifiedTime,
  author,
  tags,
  content,
}: BlogMetaTagsProps) {
  const isArticlePage = !!slug
  const pageTitle = title.includes('LocalCooks') ? title : `${title} | LocalCooks`
  
  const defaultDescription = isArticlePage
    ? 'Read the latest insights and stories from LocalCooks about local chefs, homemade food, and community in St. John\'s, Newfoundland.'
    : 'Explore the people, partnerships, and product updates shaping Local Cooks—and why better local food access matters.'
  
  const finalDescription = description || defaultDescription
  
  const canonicalUrl = isArticlePage
    ? `${seoDefaults.siteUrl}/blog/${slug}`
    : `${seoDefaults.siteUrl}/blog`
  
  const imageUrl = image?.startsWith('http') 
    ? image 
    : image 
      ? `${seoDefaults.siteUrl}${image.startsWith('/') ? '' : '/'}${image}`
      : `${seoDefaults.siteUrl}/chef.png`
  
  const finalImageAlt = imageAlt || `${title} - LocalCooks Blog`

  // Calculate word count for schema
  const wordCount = content ? content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length : undefined

  // Breadcrumb items
  const breadcrumbItems = isArticlePage
    ? [
        { name: 'Home', url: seoDefaults.siteUrl },
        { name: 'Blog', url: `${seoDefaults.siteUrl}/blog` },
        { name: title.replace(' - LocalCooks Blog', '').replace(' - LocalCooks', ''), url: canonicalUrl },
      ]
    : [
        { name: 'Home', url: seoDefaults.siteUrl },
        { name: 'Blog', url: `${seoDefaults.siteUrl}/blog` },
      ]

  return (
    <Helmet prioritizeSeoTags>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      
      {/* Keywords for Blog SEO */}
      <meta name="keywords" content={`local cooks blog, ${tags?.join(', ') || ''}, homemade food, local chefs, St Johns food, Newfoundland cuisine, food blog, home cooking, community food, local food stories`.trim().replace(/,\s*,/g, ',')} />
      
      {/* Hreflang for Language/Region targeting */}
      <link rel="alternate" hrefLang="en-CA" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={isArticlePage ? 'article' : 'website'} />
      <meta property="og:site_name" content="LocalCooks" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={finalImageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_CA" />
      
      {/* Article-specific OG Tags */}
      {isArticlePage && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {isArticlePage && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {isArticlePage && author && (
        <meta property="article:author" content={author} />
      )}
      {isArticlePage && tags && tags.length > 0 && (
        <meta property="article:section" content={tags[0]} />
      )}
      {isArticlePage && tags && tags.map((tag, i) => (
        <meta key={i} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@localcooksnfld" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={finalImageAlt} />
      
      {/* Structured Data - Breadcrumb */}
      <script type="application/ld+json">
        {JSON.stringify(createBreadcrumbSchema(breadcrumbItems))}
      </script>
      
      {/* Structured Data - Blog or Article Schema */}
      {isArticlePage ? (
        <script type="application/ld+json">
          {JSON.stringify(createArticleSchema({
            title: title.replace(' - LocalCooks Blog', '').replace(' - LocalCooks', ''),
            description: finalDescription,
            url: canonicalUrl,
            image: imageUrl,
            publishedTime,
            modifiedTime,
            author,
            tags,
            wordCount,
          }))}
        </script>
      ) : (
        <script type="application/ld+json">
          {JSON.stringify(blogSchema)}
        </script>
      )}
    </Helmet>
  )
}

export { calculateReadingTime, createArticleSchema, blogSchema }
