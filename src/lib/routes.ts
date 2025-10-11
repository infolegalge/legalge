export const routes = {
  authorPosts: (locale: string, authorId: string) => `/${locale}/authors/${authorId}`,
  companyPosts: (locale: string, slug: string) => `/${locale}/companies/${slug}/posts`,
  newsPost: (locale: string, slug: string) => `/${locale}/news/${slug}`,
};
