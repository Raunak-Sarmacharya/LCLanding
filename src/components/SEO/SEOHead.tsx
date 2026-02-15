import { Helmet } from '@dr.pogodin/react-helmet'

/**
 * SEO Configuration for LocalCooks
 * Comprehensive meta tags for local business SEO
 */

interface SEOHeadProps {
  title?: string
  description?: string
  canonicalUrl?: string
  image?: string
  imageAlt?: string
  type?: 'website' | 'article' | 'profile'
  noIndex?: boolean
  // Article-specific
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
  // Local business specific
  showLocalBusiness?: boolean
  // Breadcrumb items (auto-generates BreadcrumbList schema)
  breadcrumbs?: { name: string; url: string }[]
}

// Default SEO values
const defaults = {
  siteName: 'LocalCooks',
  siteUrl: 'https://www.localcooks.ca',
  title: 'Local Cooks | Homemade Meals from Local Chefs in St. John\'s, Newfoundland',
  description: 'Discover authentic homemade meals from passionate local chefs in St. John\'s, Newfoundland. Order delicious home-cooked food from talented neighborhood cooks. Fresh, diverse, and delivered to your door.',
  image: 'https://www.localcooks.ca/chef.png',
  imageAlt: 'Local chef cooking authentic homemade meals at LocalCooks',
  locale: 'en_CA',
  twitterHandle: '@localcooksnfld',
}

// LocalBusiness structured data for Google
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'FoodEstablishment',
  '@id': 'https://www.localcooks.ca/#organization',
  name: 'LocalCooks',
  alternateName: 'Local Cooks',
  description: 'LocalCooks connects you with talented home-based chefs in St. John\'s, Newfoundland. Order authentic homemade meals prepared with love by passionate local cooks in your community.',
  url: 'https://www.localcooks.ca',
  logo: {
    '@type': 'ImageObject',
    url: 'https://www.localcooks.ca/logo-lc.png',
    width: 512,
    height: 512,
  },
  image: [
    'https://www.localcooks.ca/chef.png',
    'https://www.localcooks.ca/logo-lc.png',
  ],
  telephone: '+1-709-631-8480',
  email: 'admin@localcook.shop',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'St. John\'s',
    addressRegion: 'NL',
    addressCountry: 'CA',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 47.5615,
    longitude: -52.7126,
  },
  areaServed: {
    '@type': 'City',
    name: 'St. John\'s',
    '@id': 'https://www.wikidata.org/wiki/Q2126',
  },
  servesCuisine: [
    'Homemade',
    'International',
    'Indian',
    'Asian',
    'Caribbean',
    'Middle Eastern',
    'Latin American',
    'European',
    'African',
  ],
  priceRange: '$$',
  currenciesAccepted: 'CAD',
  paymentAccepted: 'Credit Card, Debit Card',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '21:00',
    },
  ],
  sameAs: [
    'https://www.facebook.com/LocalCooks',
    'https://www.instagram.com/localcooksnfld/',
    'https://www.linkedin.com/company/local-cooks',
  ],
  potentialAction: {
    '@type': 'OrderAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://localcook.shop/app/index.php',
      inLanguage: 'en-CA',
      actionPlatform: [
        'http://schema.org/DesktopWebPlatform',
        'http://schema.org/MobileWebPlatform',
      ],
    },
    deliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModePickUp', 'http://purl.org/goodrelations/v1#DeliveryModeOwnFleet'],
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Homemade Meals',
    itemListElement: [
      {
        '@type': 'OfferCatalog',
        name: 'Fresh Homemade Food',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'FoodService',
              name: 'Homemade Meals from Local Chefs',
              description: 'Authentic home-cooked meals prepared by talented neighborhood chefs',
            },
          },
        ],
      },
    ],
  },
}

// Website structured data
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://www.localcooks.ca/#website',
  url: 'https://www.localcooks.ca',
  name: 'LocalCooks',
  description: defaults.description,
  publisher: {
    '@id': 'https://www.localcooks.ca/#organization',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.localcooks.ca/blog?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
  inLanguage: 'en-CA',
}

// BreadcrumbList for better navigation signals
// Per Google spec: last item must NOT have "item" URL — Google uses the containing page URL
const createBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => {
    const isLast = index === items.length - 1
    return {
      '@type': 'ListItem' as const,
      position: index + 1,
      name: item.name,
      ...(isLast ? {} : { item: item.url }),
    }
  }),
})

export default function SEOHead({
  title,
  description = defaults.description,
  canonicalUrl,
  image = defaults.image,
  imageAlt = defaults.imageAlt,
  type = 'website',
  noIndex = false,
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
  showLocalBusiness = false,
  breadcrumbs,
}: SEOHeadProps) {
  const pageTitle = title 
    ? `${title} | LocalCooks`
    : defaults.title
  
  const fullCanonicalUrl = canonicalUrl 
    ? `${defaults.siteUrl}${canonicalUrl.startsWith('/') ? '' : '/'}${canonicalUrl}`
    : defaults.siteUrl

  const fullImageUrl = image.startsWith('http') 
    ? image 
    : `${defaults.siteUrl}${image.startsWith('/') ? '' : '/'}${image}`

  return (
    <Helmet prioritizeSeoTags>
      {/* Basic Meta Tags */}
      <html lang="en-CA" />
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Geo Tags for Local SEO */}
      <meta name="geo.region" content="CA-NL" />
      <meta name="geo.placename" content="St. John's, Newfoundland" />
      <meta name="geo.position" content="47.5615;-52.7126" />
      <meta name="ICBM" content="47.5615, -52.7126" />
      
      {/* Keywords for Local Discovery */}
      <meta name="keywords" content="local cooks, home chefs, homemade food, St Johns, Newfoundland, local food delivery, home cooked meals, personal chef, neighborhood cook, authentic cuisine, food delivery NL, local chef near me, homemade meals delivery, St John's food, Newfoundland food delivery, local food St Johns" />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={defaults.siteName} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={defaults.locale} />
      
      {/* Article-specific OG Tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {type === 'article' && tags && tags.map((tag, i) => (
        <meta key={i} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={defaults.twitterHandle} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />
      
      {/* Hreflang for Language/Region targeting */}
      <link rel="alternate" hrefLang="en-CA" href={fullCanonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={fullCanonicalUrl} />
      
      {/* Mobile & Theme */}
      <meta name="theme-color" content="#f51042" />
      <meta name="apple-mobile-web-app-title" content="LocalCooks" />
      <meta name="application-name" content="LocalCooks" />
      
      {/* Structured Data - Website Schema (always include) */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      
      {/* Structured Data - LocalBusiness Schema (for homepage and relevant pages) */}
      {showLocalBusiness && (
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      )}
      
      {/* Structured Data - Breadcrumb (for sub-pages) */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(createBreadcrumbSchema(breadcrumbs))}
        </script>
      )}
    </Helmet>
  )
}

// Export schemas for use in other components
export { localBusinessSchema, websiteSchema, createBreadcrumbSchema, defaults as seoDefaults }

