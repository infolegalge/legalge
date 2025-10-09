/** @type {import('next-sitemap').IConfig} */
const siteUrl = 'https://www.legal.ge';

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'weekly',
  exclude: [
    '/api/*',
    '/api/auth/*',
    '/auth',
    '/auth/*',
    '/subscriber',
    '/subscriber/*',
    '/admin',
    '/admin/*',
    '/*/admin',
    '/*/admin/*',
  ],
  transform: async (config, path) => {
    const excludedPatterns = [
      /^\/auth(\/|$)/,
      /^\/subscriber(\/|$)/,
      /^\/admin(\/|$)/,
      /^\/api\/auth(\/|$)/,
    ];

    const urlPath = (() => {
      try {
        return new URL(path, siteUrl).pathname;
      } catch {
        return path;
      }
    })();

    if (excludedPatterns.some((pattern) => pattern.test(urlPath))) {
      return null;
    }

    return {
      ...config,
      loc: path,
      changefreq: 'weekly',
      priority: 0.7,
    };
  },
  alternateRefs: [
    { href: 'https://legal.ge/ka', hreflang: 'ka' },
    { href: 'https://legal.ge/en', hreflang: 'en' },
    { href: 'https://legal.ge/ru', hreflang: 'ru' },
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/auth',
          '/auth/*',
          '/subscriber',
          '/subscriber/*',
          '/api/auth',
          '/api/auth/*',
          '/admin',
          '/admin/*',
          '/*/admin',
          '/*/admin/*',
        ],
      },
    ],
    additionalSitemaps: [`${siteUrl}/sitemap.xml`],
  },
};
