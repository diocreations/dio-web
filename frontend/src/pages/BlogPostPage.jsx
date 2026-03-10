import Layout from "@/components/Layout";
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Tag, Share2 } from "lucide-react";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import AdSenseUnit from "@/components/AdSenseUnit";

const API_URL = process.env.REACT_APP_BACKEND_URL;

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

  return (
    <Layout>
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

      {/* Newsletter CTA */}
      <section className="py-20 bg-slate-50">
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
