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
  Users,
  Award,
  ThumbsUp,
  Calendar,
  FileSearch,
  FileText,
  PenLine,
  Sparkles,
  Briefcase,
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
  FileSearch: FileSearch,
  FileText: FileText,
  PenLine: PenLine,
  Sparkles: Sparkles,
  Briefcase: Briefcase,
  Star: Star,
};

// Color accent mapping with HSL values for CSS variable override
const accentColors = {
  violet: {
    badge: "bg-violet-100 text-violet-700",
    gradient: "from-violet-600 to-violet-800",
    primary: "bg-violet-600 hover:bg-violet-700",
    light: "bg-violet-50",
    border: "border-violet-200",
    hoverBorder: "hover:border-violet-200",
    css: { "--primary": "265 80% 50%", "--ring": "265 80% 50%", "--accent": "265 60% 60%", "--secondary": "265 30% 96%", "--secondary-foreground": "265 80% 30%" },
  },
  blue: {
    badge: "bg-blue-100 text-blue-700",
    gradient: "from-blue-600 to-blue-800",
    primary: "bg-blue-600 hover:bg-blue-700",
    light: "bg-blue-50",
    border: "border-blue-200",
    hoverBorder: "hover:border-blue-200",
    css: { "--primary": "221 83% 53%", "--ring": "221 83% 53%", "--accent": "221 60% 60%", "--secondary": "221 30% 96%", "--secondary-foreground": "221 83% 30%" },
  },
  teal: {
    badge: "bg-teal-100 text-teal-700",
    gradient: "from-teal-600 to-teal-800",
    primary: "bg-teal-600 hover:bg-teal-700",
    light: "bg-teal-50",
    border: "border-teal-200",
    hoverBorder: "hover:border-teal-200",
    css: { "--primary": "172 66% 50%", "--ring": "172 66% 50%", "--accent": "172 50% 55%", "--secondary": "172 30% 96%", "--secondary-foreground": "172 66% 30%" },
  },
  pink: {
    badge: "bg-pink-100 text-pink-700",
    gradient: "from-pink-600 to-pink-800",
    primary: "bg-pink-600 hover:bg-pink-700",
    light: "bg-pink-50",
    border: "border-pink-200",
    hoverBorder: "hover:border-pink-200",
    css: { "--primary": "333 71% 51%", "--ring": "333 71% 51%", "--accent": "333 55% 60%", "--secondary": "333 30% 96%", "--secondary-foreground": "333 71% 30%" },
  },
  orange: {
    badge: "bg-orange-100 text-orange-700",
    gradient: "from-orange-600 to-orange-800",
    primary: "bg-orange-600 hover:bg-orange-700",
    light: "bg-orange-50",
    border: "border-orange-200",
    hoverBorder: "hover:border-orange-200",
    css: { "--primary": "25 95% 53%", "--ring": "25 95% 53%", "--accent": "25 70% 60%", "--secondary": "25 30% 96%", "--secondary-foreground": "25 95% 30%" },
  },
};

// Trust logos - fallback if no client logos from API
const defaultTrustLogos = [
  { name: "User Focused", icon: Users },
  { name: "Premium Work", icon: Award },
  { name: "Award-Winning", icon: Award },
  { name: "Trustworthy", icon: ThumbsUp },
  { name: "Innovative", icon: Brain },
  { name: "Global Reach", icon: Globe },
];

const HomePage = () => {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [homepageContent, setHomepageContent] = useState(null);
  const [promotedSections, setPromotedSections] = useState([]);
  const [clientLogos, setClientLogos] = useState([]);
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
    fetch(`${API_URL}/api/seed`, { method: "POST" }).catch(() => {});
    
    Promise.all([
      fetch(`${API_URL}/api/homepage/content`).then((r) => r.json()),
      fetch(`${API_URL}/api/services?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/products?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/testimonials?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/portfolio?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/blog?published_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/homepage/promoted-sections`).then((r) => r.ok ? r.json() : []),
      fetch(`${API_URL}/api/homepage/client-logos`).then((r) => r.ok ? r.json() : []),
    ])
      .then(([homepageData, servicesData, productsData, testimonialsData, portfolioData, blogData, promotedData, clientLogosData]) => {
        setHomepageContent(homepageData);
        setPromotedSections(Array.isArray(promotedData) ? promotedData.filter(p => p.is_active !== false) : []);
        setClientLogos(Array.isArray(clientLogosData) ? clientLogosData.filter(l => l.is_active !== false) : []);
        setServices(servicesData.slice(0, 6));
        setProducts(productsData.slice(0, 4));
        setTestimonials(testimonialsData.slice(0, 3));
        setPortfolio(portfolioData.filter(p => p.is_featured).slice(0, 4));
        setBlogPosts(blogData.slice(0, 3));
        
        // Set initial hero index based on rotation settings
        const heroVariants = homepageData?.hero_variants || [];
        if (heroVariants.length > 0 && homepageData?.settings?.enable_hero_rotation) {
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

  // Get current color accent
  const currentAccent = useMemo(() => {
    const schemes = homepageContent?.color_schemes?.filter(s => s.is_active) || [];
    const settings = homepageContent?.settings;
    
    if (settings?.enable_color_rotation && schemes.length > 0) {
      const idx = getRandomIndex("color_idx", schemes.length);
      const schemeName = schemes[idx]?.name?.toLowerCase() || "violet";
      return accentColors[schemeName] || accentColors.violet;
    }
    return accentColors.violet;
  }, [homepageContent]);

  // Get current hero content (includes image)
  const currentHero = useMemo(() => {
    const variants = homepageContent?.hero_variants?.filter(v => v.is_active) || [];
    if (variants.length === 0) {
      return {
        badge_text: "Digital Excellence for Modern Business",
        title_line1: "Your AI-Powered",
        title_line2: "Growing Partner",
        subtitle: "From small business websites to enterprise-grade systems - we build eCommerce, AI-driven, and mobile app solutions that scale your business",
        primary_cta_text: "Get Started",
        primary_cta_link: "/contact",
        secondary_cta_text: "View Services",
        secondary_cta_link: "/services",
        hero_image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      };
    }
    return variants[currentHeroIndex % variants.length];
  }, [homepageContent, currentHeroIndex]);

  // Currency formatting
  const currency = homepageContent?.visitor_currency || "EUR";
  const currencySymbol = homepageContent?.currency_symbol || "€";
  const currencyRate = homepageContent?.currency_rate || 1;

  const formatPrice = (price) => {
    if (!price) return null;
    const converted = (parseFloat(price) * currencyRate).toFixed(2);
    return `${currencySymbol}${converted}`;
  };

  // Homepage settings
  const hpSettings = homepageContent?.settings || {};
  const stats = hpSettings.stats || [
    { value: "10+", label: "Years Experience" },
    { value: "500+", label: "Projects Delivered" },
    { value: "98%", label: "Client Satisfaction" },
  ];

  // Section order
  const sectionOrder = hpSettings.section_order || ["services", "products", "blog", "portfolio", "testimonials", "cta"];

  // Featured items
  const featuredBlog = homepageContent?.featured_blog || blogPosts;
  const featuredProducts = homepageContent?.featured_products || products;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Section components
  const renderSection = (sectionId) => {
    switch (sectionId) {
      case "services":
        return hpSettings.show_services !== false && <ServicesSection key="services" services={services} accent={currentAccent} />;
      case "products":
        return hpSettings.show_products !== false && <ProductsSection key="products" products={featuredProducts} formatPrice={formatPrice} currency={currency} accent={currentAccent} />;
      case "blog":
        return hpSettings.show_blog !== false && featuredBlog.length > 0 && <BlogSection key="blog" posts={featuredBlog} accent={currentAccent} />;
      case "portfolio":
        return hpSettings.show_portfolio !== false && <PortfolioSection key="portfolio" portfolio={portfolio} accent={currentAccent} />;
      case "testimonials":
        return hpSettings.show_testimonials !== false && <TestimonialsSection key="testimonials" testimonials={testimonials} accent={currentAccent} />;
      case "cta":
        return hpSettings.show_cta !== false && <CTASection key="cta" accent={currentAccent} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className={`relative bg-gradient-to-br ${currentAccent.light} via-white to-white overflow-hidden`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentHeroIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className={`inline-block px-4 py-2 rounded-full ${currentAccent.badge} font-medium text-sm mb-6`}>
                    {currentHero.badge_text}
                  </span>
                  <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight mb-6">
                    {currentHero.title_line1}
                    <br />
                    <span className={`bg-gradient-to-r ${currentAccent.gradient} bg-clip-text text-transparent`}>
                      {currentHero.title_line2}
                    </span>
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                    {currentHero.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-10">
                <Button
                  asChild
                  size="lg"
                  className={`${currentAccent.primary} text-white rounded-full px-8 h-12`}
                  data-testid="hero-cta-primary"
                >
                  {currentHero.primary_cta_new_tab ? (
                    <a href={currentHero.primary_cta_link} target="_blank" rel="noopener noreferrer">
                      {currentHero.primary_cta_text}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  ) : (
                    <Link to={currentHero.primary_cta_link}>
                      {currentHero.primary_cta_text}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  )}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className={`rounded-full px-8 h-12 border-2 ${currentAccent.border}`}
                  data-testid="hero-cta-secondary"
                >
                  {currentHero.secondary_cta_new_tab ? (
                    <a href={currentHero.secondary_cta_link} target="_blank" rel="noopener noreferrer">
                      {currentHero.secondary_cta_text}
                    </a>
                  ) : (
                    <Link to={currentHero.secondary_cta_link}>{currentHero.secondary_cta_text}</Link>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Right - Hero Image (rotates with hero variant) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentHero.hero_image}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <img
                    src={currentHero.hero_image || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
                    alt="Digital Solutions"
                    className="rounded-2xl shadow-2xl w-full"
                  />
                  {/* Floating Badge - Client Rating */}
                  {homepageContent?.settings?.show_client_rating !== false && (
                    <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Star className="text-green-600" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{homepageContent?.settings?.client_rating_value || "4.9/5"}</p>
                        <p className="text-xs text-muted-foreground">{homepageContent?.settings?.client_rating_label || "Client Rating"}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Client Logos / Trust Section */}
        <div className="border-t border-slate-100 bg-white/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-8">
            <p className="text-center text-sm text-muted-foreground mb-6">
              {homepageContent?.settings?.trust_section_title || "Trusted by innovative companies worldwide"}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {clientLogos.length > 0 ? (
                clientLogos.map((logo, index) => (
                  <motion.div
                    key={logo.logo_id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="grayscale hover:grayscale-0 transition-all duration-300"
                  >
                    {logo.url ? (
                      <a href={logo.url} target="_blank" rel="noopener noreferrer" title={logo.name}>
                        <img 
                          src={logo.image_url} 
                          alt={logo.name} 
                          className="h-8 md:h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                        />
                      </a>
                    ) : (
                      <img 
                        src={logo.image_url} 
                        alt={logo.name} 
                        className="h-8 md:h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                        title={logo.name}
                      />
                    )}
                  </motion.div>
                ))
              ) : (
                // Fallback to icon-based trust badges if no client logos
                defaultTrustLogos.map((logo, index) => (
                  <div key={index} className="flex items-center gap-2 text-slate-400">
                    <logo.icon size={20} />
                    <span className="text-sm font-medium">{logo.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stats Section - Moved below trust badges */}
        {hpSettings.show_stats !== false && (
          <div className="border-t border-slate-100 bg-gradient-to-b from-white to-slate-50">
            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-10">
              <div className="flex flex-wrap justify-center gap-12 md:gap-16 lg:gap-24">
                {stats.slice(0, 4).map((stat, index) => (
                  <motion.div 
                    key={index} 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <p className={`font-heading font-bold text-3xl md:text-4xl bg-gradient-to-r ${currentAccent.gradient} bg-clip-text text-transparent`}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Promoted AI Tools Section */}
      {homepageContent?.settings?.show_promoted_section !== false && promotedSections.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-slate-50 to-white" data-testid="promoted-tools-section">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="text-center mb-12">
              <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4 ${currentAccent.badge}`}>
                AI-Powered Tools
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                Supercharge Your Career
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Use our AI-powered tools to optimize your job search and stand out from the competition
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {promotedSections.map((tool, index) => {
                const IconComponent = iconMap[tool.icon] || Sparkles;
                return (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link to={tool.path}>
                      <Card className={`h-full hover:shadow-lg transition-all duration-300 ${currentAccent.hoverBorder} hover:border-2 group cursor-pointer`}>
                        <CardContent className="p-6">
                          <div className={`w-14 h-14 rounded-xl ${currentAccent.light} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <IconComponent className={`${currentAccent.badge.split(" ")[1]}`} size={28} />
                          </div>
                          <h3 className="font-heading font-semibold text-xl mb-2 group-hover:text-primary transition-colors">
                            {tool.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-4">
                            {tool.description}
                          </p>
                          <span className={`inline-flex items-center text-sm font-medium ${currentAccent.badge.split(" ")[1]} group-hover:gap-2 transition-all`}>
                            Try Now <ArrowRight size={14} className="ml-1" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Render sections in order */}
      {sectionOrder.map((sectionId) => renderSection(sectionId))}
    </Layout>
  );
};

// Services Section Component
const ServicesSection = ({ services, accent }) => (
  <section className="py-20 md:py-32">
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
      <div className="text-center mb-16">
        <span className={`inline-block px-4 py-2 rounded-full ${accent.badge} font-medium text-sm mb-4`}>
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
                <Card className={`p-8 rounded-2xl bg-white border border-slate-100 hover:${accent.border} hover:shadow-xl transition-all group h-full`}>
                  <CardContent className="p-0 space-y-4">
                    <div className={`w-14 h-14 rounded-2xl ${accent.badge.split(' ')[0]} flex items-center justify-center group-hover:${accent.primary.split(' ')[0]} transition-colors`}>
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
        <Button asChild variant="outline" size="lg" className="rounded-full px-8" data-testid="view-all-services">
          <Link to="/services">View All Services <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  </section>
);

// Products Section Component
const ProductsSection = ({ products, formatPrice, currency, accent }) => (
  <section className="py-20 md:py-32 bg-slate-50">
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
      <div className="text-center mb-16">
        <span className={`inline-block px-4 py-2 rounded-full ${accent.badge} font-medium text-sm mb-4`}>
          Our Products
        </span>
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
          Everything You Need to Go Online
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          From domain registration to cloud hosting - we've got you covered
        </p>
        {currency !== "EUR" && (
          <p className="text-sm text-muted-foreground mt-2">Prices shown in {currency}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, index) => {
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
                  <div className={`w-12 h-12 rounded-xl ${accent.badge.split(' ')[0]} flex items-center justify-center`}>
                    <IconComponent className="text-primary" size={24} />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-foreground">{product.title}</h3>
                  <p className="text-muted-foreground text-sm">{product.short_description}</p>
                  {product.price && (
                    <div className="pt-2">
                      <span className="font-heading font-bold text-2xl text-foreground">
                        {product.display_price ? `${product.currency_symbol}${product.display_price}` : formatPrice(product.price)}
                      </span>
                      <span className="text-muted-foreground text-sm">/{product.price_unit}</span>
                    </div>
                  )}
                  <Button asChild className={`w-full rounded-full ${product.is_popular ? 'bg-primary text-white' : ''}`} variant={product.is_popular ? "default" : "outline"}>
                    <Link to="/products">{product.cta_text}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <Button asChild variant="outline" size="lg" className="rounded-full px-8" data-testid="view-all-products">
          <Link to="/products">View All Products <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  </section>
);

// Blog Section Component
const BlogSection = ({ posts, accent }) => (
  <section className="py-20 md:py-32">
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
      <div className="text-center mb-16">
        <span className={`inline-block px-4 py-2 rounded-full ${accent.badge} font-medium text-sm mb-4`}>
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
        {posts.map((post, index) => (
          <motion.div
            key={post.post_id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link to={`/blog/${post.slug}`} data-testid={`blog-card-${post.slug}`}>
              <Card className={`overflow-hidden border border-slate-100 ${accent.hoverBorder} hover:shadow-xl transition-all group h-full`}>
                {post.featured_image && (
                  <div className="relative aspect-video overflow-hidden">
                    <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                  <p className="text-muted-foreground text-sm line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center text-primary text-sm font-medium mt-4">
                    Read More <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Button asChild variant="outline" size="lg" className="rounded-full px-8" data-testid="view-all-blog">
          <Link to="/blog">View All Articles <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  </section>
);

// Portfolio Section Component
const PortfolioSection = ({ portfolio, accent }) => (
  <section className="py-20 md:py-32 bg-slate-50">
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
      <div className="text-center mb-16">
        <span className={`inline-block px-4 py-2 rounded-full ${accent.badge} font-medium text-sm mb-4`}>
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
              <Card className={`overflow-hidden border border-slate-100 ${accent.hoverBorder} hover:shadow-xl transition-all group h-full`}>
                <div className="relative aspect-video overflow-hidden">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="text-white font-medium flex items-center gap-2">View Project <ExternalLink size={16} /></span>
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
                  <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{item.description}</p>
                  {item.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {item.technologies.slice(0, 4).map((tech, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-slate-100 text-xs text-muted-foreground">{tech}</span>
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
        <Button asChild variant="outline" size="lg" className="rounded-full px-8" data-testid="view-all-portfolio">
          <Link to="/portfolio">View All Projects <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  </section>
);

// Testimonials Section Component
const TestimonialsSection = ({ testimonials, accent }) => (
  <section className="py-20 md:py-32">
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
      <div className="text-center mb-16">
        <span className={`inline-block px-4 py-2 rounded-full ${accent.badge} font-medium text-sm mb-4`}>
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
                    <Star key={i} className="text-yellow-400 fill-yellow-400" size={20} />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  {testimonial.client_image ? (
                    <img src={testimonial.client_image} alt={testimonial.client_name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${accent.badge.split(' ')[0]} flex items-center justify-center`}>
                      <span className="text-primary font-semibold">{testimonial.client_name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-heading font-semibold text-foreground">{testimonial.client_name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.client_title}, {testimonial.client_company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// CTA Section Component
const CTASection = ({ accent }) => (
  <section className={`py-20 md:py-32 bg-gradient-to-r ${accent.gradient}`}>
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
        <p className="text-white/80 text-lg max-w-2xl mx-auto">
          Let's discuss how we can help you achieve your digital goals
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 h-12" data-testid="cta-contact">
            <Link to="/contact">Get Free Consultation <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 border-white text-white hover:bg-white/10" data-testid="cta-portfolio">
            <Link to="/portfolio">View Our Work</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

export default HomePage;
