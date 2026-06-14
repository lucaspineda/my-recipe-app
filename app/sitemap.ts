import type { MetadataRoute } from 'next'

const BASE_URL = 'https://chefinhoia.com.br'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString()

  // Public, indexable static routes
  const routes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/recipe', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/plans', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/signup', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/login', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  ]

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
