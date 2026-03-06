import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowRight, Tag } from "lucide-react";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/blog?published_only=true`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        const cats = [...new Set(data.map((post) => post.category))];
        setCategories(cats);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredPosts =
    activeCategory === "all"
      ? posts
      : posts.filter((post) => post.category === activeCategory);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-violet-subtle" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                Our Blog
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">
                Insights &
                <br />
                <span className="text-gradient">Knowledge Hub</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Stay updated with the latest trends in technology, web development, 
                SEO, and digital marketing.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setActiveCategory("all")}
                data-testid="blog-filter-all"
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setActiveCategory(category)}
                  data-testid={`blog-filter-${category.toLowerCase()}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 rounded-2xl aspect-video" />
                  <div className="mt-4 space-y-2">
                    <div className="bg-slate-200 h-6 w-3/4 rounded" />
                    <div className="bg-slate-200 h-4 w-full rounded" />
                    <div className="bg-slate-200 h-4 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No blog posts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.post_id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/blog/${post.slug}`} data-testid={`blog-post-${post.slug}`}>
                    <Card className="overflow-hidden border border-slate-100 hover:border-primary/20 hover:shadow-xl transition-all group h-full">
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={post.featured_image || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80"}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Tag size={14} className="text-primary" />
                            {post.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(post.published_at || post.created_at)}
                          </span>
                        </div>
                        <h3 className="font-heading font-semibold text-xl text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-muted-foreground" />
                          <span className="text-muted-foreground">{post.author}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-6">
            Stay Updated
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest insights and updates
          </p>
          <div className="flex justify-center" data-testid="blog-newsletter-cta">
            <NewsletterSubscribe source="blog-page" />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BlogPage;
