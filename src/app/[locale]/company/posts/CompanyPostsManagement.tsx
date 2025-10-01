'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  FileText,
  Loader2,
  Search,
  Building2
} from "lucide-react";

interface Post {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  coverImageAlt?: string | null;
  date: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  slug: string;
  author?: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
}

interface CompanyPostsManagementProps {
  locale: string;
}

export default function CompanyPostsManagement({ locale }: CompanyPostsManagementProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [companySlug, setCompanySlug] = useState<string | null>(null);

  // Resolve company slug/id once
  useEffect(() => {
    const resolveCompany = async () => {
      try {
        const fromSession = (session?.user as any)?.companySlug as string | undefined;
        if (fromSession) {
          setCompanySlug(fromSession);
          return;
        }
        const res = await fetch('/api/company/overview', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.company?.slug) setCompanySlug(data.company.slug);
        }
      } catch {}
    };
    resolveCompany();
  }, [session]);

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const params = new URLSearchParams({ scope: 'company', locale });
        if (companySlug) params.set('companySlug', companySlug);
        const response = await fetch(`/api/posts?${params.toString()}`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        } else {
          const text = await response.text().catch(() => '');
          console.error('Failed to fetch posts', response.status, response.statusText, text);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [companySlug, locale]);

  const filteredPosts = (posts || []).filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setDeleting(postId);
    try {
      const response = await fetch(`/api/posts/${postId}?scope=company`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(prev => prev.filter(post => post.id !== postId));
      } else {
        console.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Company Posts</h1>
          <p className="text-muted-foreground">Create and manage your company&apos;s blog posts and articles</p>
        </div>
        <Link href={`/${locale}/company/posts/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{(posts || []).length}</div>
            <div className="text-sm text-muted-foreground">Total Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {(posts || []).filter(p => p.status === 'PUBLISHED').length}
            </div>
            <div className="text-sm text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {(posts || []).filter(p => p.status === 'DRAFT').length}
            </div>
            <div className="text-sm text-muted-foreground">Drafts</div>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">
                {searchQuery ? 'No posts found' : 'No posts yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search criteria'
                  : 'Start sharing your company\'s expertise by creating your first post'
                }
              </p>
              {!searchQuery && (
                <Link href={`/${locale}/company/posts/new`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      <Badge className={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                    </div>
                    
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date ? new Date(post.date).toLocaleDateString() : 'No date'}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {post.content ? post.content.length : 0} characters
                      </div>
                      {post.author && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {post.author.name || post.author.email}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${locale}/news/${post.slug}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${locale}/company/posts/${post.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deleting === post.id}
                    >
                      {deleting === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

