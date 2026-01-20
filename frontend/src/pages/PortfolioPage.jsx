import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, ArrowRight } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PortfolioPage = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/portfolio?active_only=true`)
      .then((res) => res.json())
      .then((data) => {
        setPortfolio(data);
        const cats = [...new Set(data.map((item) => item.category))];
        setCategories(cats);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredPortfolio =
    activeCategory === "all"
      ? portfolio
      : portfolio.filter((item) => item.category === activeCategory);

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
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-6">
                Our Portfolio
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">
                Our Success
                <br />
                <span className="text-gradient">Stories</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Explore our latest projects and see how we've helped businesses 
                achieve their digital goals.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filter & Portfolio Grid */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setActiveCategory("all")}
                data-testid="filter-all"
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setActiveCategory(category)}
                  data-testid={`filter-${category.toLowerCase()}`}
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
                    <div className="bg-slate-200 h-4 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPortfolio.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No portfolio items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPortfolio.map((item, index) => (
                <motion.div
                  key={item.portfolio_id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/portfolio/${item.slug}`} data-testid={`portfolio-item-${item.slug}`}>
                    <Card className="overflow-hidden border border-slate-100 hover:border-violet-200 hover:shadow-xl transition-all group">
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={item.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                          <span className="text-white font-medium flex items-center gap-2">
                            View Project
                            <ExternalLink size={16} />
                          </span>
                        </div>
                        {item.is_featured && (
                          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-white text-xs font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                      <CardContent className="p-6">
                        <span className="text-primary text-sm font-medium">
                          {item.category}
                        </span>
                        <h3 className="font-heading font-semibold text-xl text-foreground mt-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                          {item.description}
                        </p>
                        {item.technologies && item.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {item.technologies.slice(0, 3).map((tech, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded bg-slate-100 text-xs text-muted-foreground"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-violet-600 to-violet-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-6">
            Want to Be Our Next Success Story?
          </h2>
          <p className="text-violet-100 mb-8 max-w-2xl mx-auto">
            Let's discuss how we can help bring your project to life
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-8"
            data-testid="portfolio-contact-cta"
          >
            <Link to="/contact">
              Start Your Project
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default PortfolioPage;
