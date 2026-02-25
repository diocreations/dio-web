import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code,
  Search,
  MapPin,
  Brain,
  Zap,
  Mail,
  ArrowRight,
  Star,
  ChevronRight,
  Globe,
  Server,
  Shield,
  Layout as LayoutIcon,
  ExternalLink,
  Sparkles,
  Briefcase,
  Image,
  ShoppingCart,
  Rocket,
  Calendar,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const iconMap = {
  Code: Code,
  Search: Search,
  MapPin: MapPin,
  Brain: Brain,
  Zap: Zap,
  Mail: Mail,
  Globe: Globe,
  Server: Server,
  Shield: Shield,
  Layout: LayoutIcon,
};

const builderCategories = [
  { name: "Business Website", slug: "business", icon: Briefcase, color: "bg-blue-500", template_type: "basic" },
  { name: "Portfolio", slug: "portfolio", icon: Image, color: "bg-pink-500", template_type: "portfolio" },
  { name: "E-commerce Store", slug: "ecommerce", icon: ShoppingCart, color: "bg-green-500", template_type: "ecommerce" },
  { name: "Others", slug: "others", icon: Rocket, color: "bg-orange-500", template_type: "basic" },
];

// Color mapping for dynamic gradients - using safe static classes
const colorGradients = {
  violet: { from: "from-violet-900", via: "via-violet-800", to: "to-slate-900", accent: "violet", textGradient: "from-violet-300 to-pink-300" },
  blue: { from: "from-blue-900", via: "via-blue-800", to: "to-slate-900", accent: "blue", textGradient: "from-blue-300 to-cyan-300" },
  teal: { from: "from-teal-900", via: "via-teal-800", to: "to-slate-900", accent: "teal", textGradient: "from-teal-300 to-emerald-300" },
  pink: { from: "from-pink-900", via: "via-pink-800", to: "to-slate-900", accent: "pink", textGradient: "from-pink-300 to-rose-300" },
  orange: { from: "from-orange-900", via: "via-orange-800", to: "to-slate-900", accent: "orange", textGradient: "from-orange-300 to-amber-300" },
};

const HomePage = () => {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [homepageContent, setHomepageContent] = useState(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Get random index based on session storage to persist across page
  const getRandomIndex = (key, max) => {
    if (max <= 0) return 0;
    const stored = sessionStorage.getItem(key);
    if (stored !== null) return parseInt(stored) % max;
    const idx = Math.floor(Math.random() * max);
    sessionStorage.setItem(key, idx.toString());
    return idx;
  };

  useEffect(() => {
    // Seed data and fetch all homepage content
    fetch(`${API_URL}/api/seed`, { method: "POST" }).catch(() => {});
    
    Promise.all([
      fetch(`${API_URL}/api/homepage/content`).then((r) => r.json()),
      fetch(`${API_URL}/api/services?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/testimonials?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/portfolio?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/settings`).then((r) => r.json()),
    ])
      .then(([homepageData, servicesData, testimonialsData, portfolioData, settingsData]) => {
        setHomepageContent(homepageData);
        setServices(servicesData.slice(0, 6));
        setTestimonials(testimonialsData.slice(0, 3));
        setPortfolio(portfolioData.filter(p => p.is_featured).slice(0, 4));
        setSiteSettings(settingsData);
        
        // Set initial hero index based on rotation settings
        const heroVariants = homepageData?.hero_variants || [];
        if (heroVariants.length > 0) {
          if (homepageData?.settings?.hero_rotation_type === "refresh") {
            setCurrentHeroIndex(getRandomIndex("hero_idx", heroVariants.length));
          }
        }
        
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Auto-rotate hero if carousel mode
  useEffect(() => {
    const settings = homepageContent?.settings;
    const heroVariants = homepageContent?.hero_variants || [];
    
    if (settings?.enable_hero_rotation && settings?.hero_rotation_type === "auto" && heroVariants.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroVariants.length);
      }, (settings?.hero_rotation_interval || 10) * 1000);
      return () => clearInterval(interval);
    }
  }, [homepageContent]);

  // Get current color scheme
  const currentColorScheme = useMemo(() => {
    const schemes = homepageContent?.color_schemes?.filter(s => s.is_active) || [];
    if (schemes.length === 0) return colorGradients.violet;
    
    if (homepageContent?.settings?.enable_color_rotation) {
      const idx = getRandomIndex("color_idx", schemes.length);
      const scheme = schemes[idx];
      return colorGradients[scheme?.name?.toLowerCase()] || colorGradients.violet;
    }
    return colorGradients.violet;
  }, [homepageContent]);

  // Get current hero content
  const currentHero = useMemo(() => {
    const variants = homepageContent?.hero_variants?.filter(v => v.is_active) || [];
    if (variants.length === 0) {
      return {
        badge_text: "AI-Powered Website Builder",
        title_line1: "Build Your Professional",
        title_line2: "Website in Minutes",
        subtitle: "Choose your category, describe your business, and let our AI create a stunning, SEO-optimized website ready for launch.",
        primary_cta_text: "Start Building Free",
        primary_cta_link: "/builder",
        secondary_cta_text: "View Our Services",
        secondary_cta_link: "/services",
      };
    }
    return variants[currentHeroIndex % variants.length];
  }, [homepageContent, currentHeroIndex]);

  // Currency formatting
  const currency = homepageContent?.visitor_currency || "EUR";
  const currencySymbol = homepageContent?.currency_symbol || "€";
  const currencyRate = homepageContent?.currency_rate || 1;

  const formatPrice = (price, priceUnit) => {
    if (!price) return null;
    const converted = (parseFloat(price) * currencyRate).toFixed(2);
    return `${currencySymbol}${converted}${priceUnit ? `/${priceUnit}` : ""}`;
  };

  // Featured products with converted prices
  const featuredProducts = homepageContent?.featured_products || [];
  
  // Featured blog posts
  const featuredBlog = homepageContent?.featured_blog || [];
  
  // Homepage settings
  const hpSettings = homepageContent?.settings || {};

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Dynamic Hero Section */}
      <section className={`relative min-h-[90vh] flex items-center overflow-hidden`}>
        {/* Background Gradient - Dynamic */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentColorScheme.from} ${currentColorScheme.via} ${currentColorScheme.to}`} />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentHeroIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white font-medium text-sm mb-6 border border-white/20">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  {currentHero.badge_text}
                </span>
                <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
                  {currentHero.title_line1}
                  <br />
                  <span className={`bg-gradient-to-r ${currentColorScheme.textGradient} bg-clip-text text-transparent`}>
                    {currentHero.title_line2}
                  </span>
                </h1>
                <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                  {currentHero.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Category Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {builderCategories.map((cat, index) => (
                <Link 
                  to={`/builder?category=${cat.slug}&template=${cat.template_type}`} 
                  key={index}
                >
                  <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all cursor-pointer group">
                    <div className={`w-12 h-12 ${cat.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <cat.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-white font-medium text-sm">{cat.name}</p>
                  </div>
                </Link>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-white text-violet-900 hover:bg-white/90 rounded-full px-8 h-14 text-lg font-semibold shadow-lg"
                data-testid="hero-cta-primary"
              >
                <Link to={currentHero.primary_cta_link}>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {currentHero.primary_cta_text}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8 h-14 border-2 border-white/30 text-white hover:bg-white/10 text-lg"
                data-testid="hero-cta-secondary"
              >
                <Link to={currentHero.secondary_cta_link}>{currentHero.secondary_cta_text}</Link>
              </Button>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-6 mt-12 text-white/80"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <ChevronRight className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm">5-Page Website</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <ChevronRight className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm">Mobile Responsive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <ChevronRight className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm">SEO Optimized</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <ChevronRight className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm">Ready in Minutes</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {hpSettings.show_stats !== false && hpSettings.stats?.length > 0 && (
        <section className="py-12 bg-slate-900">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {hpSettings.stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <p className="font-heading font-bold text-3xl md:text-4xl text-white mb-2">{stat.value}</p>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      {hpSettings.show_services !== false && (
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
                Our Services
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                Your Vision, Our Expertise
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive digital solutions tailored to transform your business
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => {
                const IconComponent = iconMap[service.icon] || Code;
                return (
                  <motion.div
                    key={service.service_id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link to={`/services/${service.slug}`} data-testid={`service-card-${service.slug}`}>
                      <Card className="p-8 rounded-2xl bg-white border border-slate-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/5 transition-all group h-full">
                        <CardContent className="p-0 space-y-4">
                          <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center group-hover:bg-primary transition-colors">
                            <IconComponent className="text-primary group-hover:text-white transition-colors" size={28} />
                          </div>
                          <h3 className="font-heading font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {service.short_description}
                          </p>
                          <div className="flex items-center text-primary text-sm font-medium pt-2">
                            Learn More
                            <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8"
                data-testid="view-all-services"
              >
                <Link to="/services">
                  View All Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {hpSettings.show_featured_products !== false && featuredProducts.length > 0 && (
        <section className="py-20 md:py-32 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
                Featured Products
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                Everything You Need to Go Online
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From domain registration to cloud hosting - we've got you covered
              </p>
              {currency !== "EUR" && (
                <p className="text-sm text-muted-foreground mt-2">
                  Prices shown in {currency}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product, index) => {
                const IconComponent = iconMap[product.icon] || Globe;
                return (
                  <motion.div
                    key={product.product_id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className={`p-6 rounded-2xl bg-white h-full relative ${product.is_popular ? 'border-2 border-primary' : 'border border-slate-100'}`}>
                      {product.is_popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xs font-medium">
                          Popular
                        </span>
                      )}
                      <CardContent className="p-0 space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                          <IconComponent className="text-primary" size={24} />
                        </div>
                        <h3 className="font-heading font-semibold text-lg text-foreground">
                          {product.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {product.short_description}
                        </p>
                        {product.price && (
                          <div className="pt-2">
                            <span className="font-heading font-bold text-2xl text-foreground">
                              {product.display_currency ? `${product.currency_symbol}${product.display_price}` : formatPrice(product.price, "")}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              /{product.price_unit}
                            </span>
                          </div>
                        )}
                        <Button
                          asChild
                          className={`w-full rounded-full ${product.is_popular ? 'bg-primary text-white' : ''}`}
                          variant={product.is_popular ? "default" : "outline"}
                          data-testid={`product-cta-${product.slug}`}
                        >
                          <Link to={`/products`}>{product.cta_text}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8"
                data-testid="view-all-products"
              >
                <Link to="/products">
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Blog Section */}
      {hpSettings.show_featured_blog !== false && featuredBlog.length > 0 && (
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
                Latest Insights
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                From Our Blog
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Stay updated with the latest trends and insights in digital technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredBlog.map((post, index) => (
                <motion.div
                  key={post.post_id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/blog/${post.slug}`} data-testid={`blog-card-${post.slug}`}>
                    <Card className="overflow-hidden border border-slate-100 hover:border-violet-200 hover:shadow-xl transition-all group h-full">
                      {post.featured_image && (
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-primary text-sm font-medium">{post.category}</span>
                          {post.published_at && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground text-sm flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(post.published_at).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center text-primary text-sm font-medium mt-4">
                          Read More
                          <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8"
                data-testid="view-all-blog"
              >
                <Link to="/blog">
                  View All Articles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Portfolio Section */}
      {hpSettings.show_portfolio !== false && (
        <section className="py-20 md:py-32 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
                Our Work
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                Featured Projects
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See how we've helped businesses transform their digital presence
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {portfolio.map((item, index) => (
                <motion.div
                  key={item.portfolio_id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/portfolio/${item.slug}`} data-testid={`portfolio-${item.slug}`}>
                    <Card className="overflow-hidden border border-slate-100 hover:border-violet-200 hover:shadow-xl transition-all group h-full">
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                          <span className="text-white font-medium flex items-center gap-2">
                            View Project <ExternalLink size={16} />
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-primary text-sm font-medium">{item.category}</span>
                          <span className="text-muted-foreground text-sm">• {item.client_name}</span>
                        </div>
                        <h3 className="font-heading font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                          {item.description}
                        </p>
                        {item.technologies && item.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {item.technologies.slice(0, 4).map((tech, i) => (
                              <span key={i} className="px-2 py-1 rounded bg-slate-100 text-xs text-muted-foreground">
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

            <div className="text-center mt-12">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8"
                data-testid="view-all-portfolio"
              >
                <Link to="/portfolio">
                  View All Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {hpSettings.show_testimonials !== false && (
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
                Testimonials
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                The Voices of Success
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Hear from our clients about their transformative experiences
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.testimonial_id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-8 rounded-2xl bg-white border border-slate-100 h-full">
                    <CardContent className="p-0 space-y-6">
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="text-yellow-400 fill-yellow-400"
                            size={20}
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center gap-4 pt-4 border-t border-border">
                        {testimonial.client_image ? (
                          <img
                            src={testimonial.client_image}
                            alt={testimonial.client_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full gradient-violet flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {testimonial.client_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-heading font-semibold text-foreground">
                            {testimonial.client_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.client_title}, {testimonial.client_company}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {hpSettings.show_cta !== false && (
        <section className={`py-20 md:py-32 bg-gradient-to-r ${currentColorScheme.from.replace('from-', 'from-')} ${currentColorScheme.to.replace('to-', 'to-')}`}>
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-white">
                Ready to Transform Your Business?
              </h2>
              <p className={`text-${currentColorScheme.accent}-100 text-lg max-w-2xl mx-auto`}>
                Let's discuss how we can help you achieve your digital goals
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-8 h-12"
                  data-testid="cta-contact"
                >
                  <Link to="/contact">
                    Get Free Consultation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 h-12 border-white text-white hover:bg-white/10"
                  data-testid="cta-portfolio"
                >
                  <Link to="/portfolio">View Our Work</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default HomePage;
