/** @type {import('next-sitemap').IConfig} */
const siteUrl = 'https://www.legal.ge';

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'weekly',
  exclude: ['/api/*'],
  transform: async (config, path) => ({
    loc: path,
    changefreq: 'weekly',
    priority: 0.7,
  }),
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/*/admin', '/api/auth/'],
      },
    ],
    additionalSitemaps: [`${siteUrl}/sitemap.xml`],
  },
};
