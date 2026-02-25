import Layout from "@/components/Layout";
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Tag, Share2 } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

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
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }}
          />

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

      {/* CTA */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-4">
            Enjoyed this article?
          </h2>
          <p className="text-muted-foreground mb-6">
            Subscribe to our newsletter for more insights
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground rounded-full px-8"
          >
            <Link to="/contact">Subscribe Now</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default BlogPostPage;
