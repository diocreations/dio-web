import Layout from "@/components/Layout";
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Tag, Share2, ArrowRight, Package, Wrench } from "lucide-react";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import AdSenseUnit from "@/components/AdSenseUnit";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const SITE_URL = "https://www.diocreations.eu";

// Category to related content mapping for internal linking
const CATEGORY_LINKS = {
  "Web Development": {
    services: [
      { name: "Web & Mobile Development", slug: "web-mobile-development", description: "Custom websites and applications" },
      { name: "AI Solutions", slug: "ai-solutions", description: "Intelligent automation for your business" },
    ],
    products: [
      { name: "Website Builder", path: "/builder", description: "Build your website in minutes" },
    ]
  },
  "SEO": {
    services: [
      { name: "SEO Services", slug: "seo-services", description: "Improve your search rankings" },
      { name: "Local SEO", slug: "local-seo", description: "Dominate local search results" },
    ],
    products: [
      { name: "Resume Optimizer", path: "/resume-optimizer", description: "AI-powered resume analysis" },
    ]
  },
  "AI": {
    services: [
      { name: "AI Solutions", slug: "ai-solutions", description: "Custom AI implementations" },
      { name: "Private LLMs", slug: "private-llms", description: "Secure AI for enterprise" },
    ],
    products: [
      { name: "Resume AI", path: "/resume-optimizer", description: "AI resume optimization" },
      { name: "Cover Letter Generator", path: "/cover-letter", description: "AI-powered cover letters" },
    ]
  },
  "Business": {
    services: [
      { name: "Marketing Automation", slug: "marketing-automation", description: "Automate your marketing" },
      { name: "Email Marketing", slug: "email-marketing", description: "Engage your audience" },
    ],
    products: [
      { name: "Website Builder", path: "/builder", description: "Launch your business online" },
    ]
  },
  "Career": {
    services: [
      { name: "Web Development", slug: "web-mobile-development", description: "Portfolio websites" },
    ],
    products: [
      { name: "Resume Optimizer", path: "/resume-optimizer", description: "Beat ATS systems" },
      { name: "Resume Builder", path: "/resume-builder", description: "Create professional resumes" },
      { name: "Cover Letter Generator", path: "/cover-letter", description: "Stand out applications" },
    ]
  },
  "E-commerce": {
    services: [
      { name: "Web Development", slug: "web-mobile-development", description: "E-commerce solutions" },
      { name: "SEO Services", slug: "seo-services", description: "Drive organic traffic" },
    ],
    products: [
      { name: "Website Builder", path: "/builder", description: "Launch your store" },
    ]
  },
  "default": {
    services: [
      { name: "Web Development", slug: "web-mobile-development", description: "Custom web solutions" },
      { name: "SEO Services", slug: "seo-services", description: "Improve visibility" },
    ],
    products: [
      { name: "Website Builder", path: "/builder", description: "Build your online presence" },
      { name: "Resume Optimizer", path: "/resume-optimizer", description: "AI-powered tools" },
    ]
  }
};

// Related Content Component for internal linking
const RelatedContent = ({ category }) => {
  const links = CATEGORY_LINKS[category] || CATEGORY_LINKS["default"];
  
  return (
    <section className="py-12 bg-slate-50 mt-12">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <h2 className="font-heading font-bold text-2xl text-foreground mb-8 text-center">
          Related Services & Products
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Services */}
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-lg mb-4">
              <Wrench size={20} className="text-primary" />
              Our Services
            </h3>
            <div className="space-y-3">
              {links.services.map((service, i) => (
                <Link 
                  key={i}
                  to={`/services/${service.slug}`}
                  className="block p-4 bg-white rounded-lg border hover:border-primary hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {service.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                    <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Products */}
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-lg mb-4">
              <Package size={20} className="text-primary" />
              Our Products
            </h3>
            <div className="space-y-3">
              {links.products.map((product, i) => (
                <Link 
                  key={i}
                  to={product.path}
                  className="block p-4 bg-white rounded-lg border hover:border-primary hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                    <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Need help with your project?</p>
          <Button asChild>
            <Link to="/contact">Get in Touch <ArrowRight size={16} className="ml-2" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

// Component to inject AdSense within content
const BlogContentWithAds = ({ content, adsenseCode, position }) => {
  // Split content into paragraphs/blocks
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const elements = Array.from(doc.body.children);
  
  if (elements.length === 0) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  let insertIndex;
  if (position === "after_first_paragraph") {
    insertIndex = 1;
  } else if (position === "middle_content") {
    insertIndex = Math.floor(elements.length / 2);
  }

  const beforeAd = elements.slice(0, insertIndex).map(el => el.outerHTML).join('');
  const afterAd = elements.slice(insertIndex).map(el => el.outerHTML).join('');

  return (
    <div className="prose prose-lg max-w-none
      [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-6
      [&_a]:text-primary [&_a]:no-underline [&_a]:hover:underline
      [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4
      [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
      [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2
      [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic
      [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:rounded-lg [&_pre]:p-4
    ">
      <div dangerouslySetInnerHTML={{ __html: beforeAd }} />
      <div className="my-6">
        <AdSenseUnit adsenseCode={adsenseCode} className="bg-slate-50 rounded-lg p-4" />
      </div>
      <div dangerouslySetInnerHTML={{ __html: afterAd }} />
    </div>
  );
};

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/blog/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <h1 className="font-heading font-bold text-2xl mb-4">Post Not Found</h1>
          <Button asChild>
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // Generate clean excerpt for meta description
  const metaDescription = post?.excerpt 
    ? post.excerpt.replace(/<[^>]+>/g, '').substring(0, 160) 
    : post?.content?.replace(/<[^>]+>/g, '').substring(0, 160) || '';
  
  const featuredImage = post?.featured_image || `${SITE_URL}/og-blog.png`;
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;
  const publishedDate = post?.published_at || post?.created_at || new Date().toISOString();
  
  // Clean content for noscript (remove scripts, keep text)
  const cleanContentForCrawlers = post?.content?.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') || '';

  return (
    <Layout>
      {/* SEO Content for Crawlers - visible without JavaScript */}
      <noscript>
        <article style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h1>{post.title}</h1>
          <p><strong>Author:</strong> {post.author || 'DIOCREATIONS'}</p>
          <p><strong>Category:</strong> {post.category || 'General'}</p>
          <p><strong>Published:</strong> {formatDate(post.published_at || post.created_at)}</p>
          <hr />
          <div dangerouslySetInnerHTML={{ __html: cleanContentForCrawlers }} />
          <hr />
          <p>
            <a href="/blog">← Back to Blog</a> | 
            <a href="/services">Our Services</a> | 
            <a href="/contact">Contact Us</a>
          </p>
        </article>
      </noscript>
      
      {/* SEO Meta Tags */}
      {post && (
        <Helmet>
          <title>{post.title} | DIOCREATIONS Blog</title>
          <meta name="description" content={metaDescription} />
          <meta name="author" content={post.author || 'DIOCREATIONS'} />
          <link rel="canonical" href={canonicalUrl} />
          
          {/* Open Graph */}
          <meta property="og:type" content="article" />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:image" content={featuredImage} />
          <meta property="og:site_name" content="DIOCREATIONS" />
          <meta property="article:published_time" content={publishedDate} />
          <meta property="article:author" content={post.author || 'DIOCREATIONS'} />
          <meta property="article:section" content={post.category || 'General'} />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={canonicalUrl} />
          <meta name="twitter:title" content={post.title} />
          <meta name="twitter:description" content={metaDescription} />
          <meta name="twitter:image" content={featuredImage} />
          
          {/* Structured Data - Article */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": post.title,
              "description": metaDescription,
              "image": featuredImage,
              "author": {
                "@type": "Person",
                "name": post.author || "DIOCREATIONS"
              },
              "publisher": {
                "@type": "Organization",
                "name": "DIOCREATIONS",
                "logo": {
                  "@type": "ImageObject",
                  "url": `${SITE_URL}/logo.png`
                }
              },
              "datePublished": publishedDate,
              "dateModified": post.updated_at || publishedDate,
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": canonicalUrl
              },
              "articleSection": post.category || "General",
              "keywords": post.tags?.join(', ') || post.category || "General"
            })}
          </script>
          
          {/* BreadcrumbList Schema */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": SITE_URL
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Blog",
                  "item": `${SITE_URL}/blog`
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": post.title,
                  "item": canonicalUrl
                }
              ]
            })}
          </script>
        </Helmet>
      )}
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 gradient-violet-subtle" />
        <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">
          <Link
            to="/blog"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar size={14} />
                {formatDate(post.published_at || post.created_at)}
              </span>
            </div>

            <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-foreground">
              {post.title}
            </h1>

            <p className="text-xl text-muted-foreground">
              {post.excerpt}
            </p>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <div className="w-12 h-12 rounded-full gradient-violet flex items-center justify-center">
                <span className="text-white font-semibold">
                  {post.author?.charAt(0) || "A"}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">{post.author}</p>
                <p className="text-sm text-muted-foreground">Author</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Image */}
      {post.featured_image && (
        <section className="pb-12">
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full rounded-2xl shadow-lg"
            />
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          {/* AdSense: Before Content */}
          {post.adsense_code && post.adsense_position === "before_content" && (
            <div className="my-6">
              <AdSenseUnit adsenseCode={post.adsense_code} />
            </div>
          )}

          {/* Render content with AdSense injection based on position */}
          {post.adsense_code && (post.adsense_position === "after_first_paragraph" || post.adsense_position === "middle_content") ? (
            <BlogContentWithAds content={post.content} adsenseCode={post.adsense_code} position={post.adsense_position} />
          ) : (
            <div 
              className="prose prose-lg max-w-none
                [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-6
                [&_a]:text-primary [&_a]:no-underline [&_a]:hover:underline
                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4
                [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
                [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic
                [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:rounded-lg [&_pre]:p-4
              "
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {/* AdSense: After Content */}
          {post.adsense_code && post.adsense_position === "after_content" && (
            <div className="my-8">
              <AdSenseUnit adsenseCode={post.adsense_code} className="bg-slate-50 rounded-lg p-4" />
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-border">
              <span className="text-muted-foreground text-sm mr-2">Tags:</span>
              {post.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-slate-100 text-sm text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="flex items-center gap-4 mt-8 pt-8 border-t border-border">
            <span className="text-muted-foreground text-sm">Share this post:</span>
            <button
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              onClick={() => {
                navigator.share?.({
                  title: post.title,
                  text: post.excerpt,
                  url: window.location.href,
                });
              }}
            >
              <Share2 size={20} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </section>

      {/* Related Services & Products - Internal Linking */}
      <RelatedContent category={post.category} />

      {/* Newsletter CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-4">
            Enjoyed this article?
          </h2>
          <p className="text-muted-foreground mb-6">
            Subscribe to our newsletter for more insights
          </p>
          <div className="flex justify-center">
            <NewsletterSubscribe source="blog" />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BlogPostPage;
