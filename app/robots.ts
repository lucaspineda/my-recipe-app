import type { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private / app routes that should not be indexed
      disallow: [
        '/profile',
        '/minhas-receitas',
        '/password-reset',
        '/plans/thank-you',
      ],
    },
    sitemap: 'https://chefinhoia.com.br/sitemap.xml',
  }
}