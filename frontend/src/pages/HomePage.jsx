import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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

// Trust logos placeholder - these would come from admin
const trustLogos = [
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
  const [siteSettings, setSiteSettings] = useState(null);
  const [homepageContent, setHomepageContent] = useState(null);
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
      fetch(`${API_URL}/api/products?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/testimonials?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/portfolio?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/settings`).then((r) => r.json()),
    ])
      .then(([homepageData, servicesData, productsData, testimonialsData, portfolioData, settingsData]) => {
        setHomepageContent(homepageData);
        setServices(servicesData.slice(0, 6));
        setProducts(productsData.slice(0, 4));
        setTestimonials(testimonialsData.slice(0, 3));
        setPortfolio(portfolioData.filter(p => p.is_featured).slice(0, 4));
        setSiteSettings(settingsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Get current hero content
  const currentHero = useMemo(() => {
    const variants = homepageContent?.hero_variants?.filter(v => v.is_active) || [];
    if (variants.length === 0) {
      // Default matching LIVE site
      return {
        badge_text: "Digital Excellence for Modern Business",
        title_line1: "Your AI-Powered",
        title_line2: "Growing Partner",
        subtitle: "From small business websites to enterprise-grade systems - we build eCommerce, AI-driven, and mobile app solutions that scale your business",
        primary_cta_text: "Get Started",
        primary_cta_link: "/contact",
        secondary_cta_text: "View Services",
        secondary_cta_link: "/services",
      };
    }
    const idx = homepageContent?.settings?.enable_hero_rotation 
      ? getRandomIndex("hero_idx", variants.length) 
      : 0;
    return variants[idx];
  }, [homepageContent]);

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
      {/* Hero Section - Matching LIVE Site */}
      <section className="relative bg-gradient-to-br from-violet-50 via-white to-violet-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-6">
                {currentHero.badge_text}
              </span>
              <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight mb-6">
                {currentHero.title_line1}
                <br />
                <span className="bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
                  {currentHero.title_line2}
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                {currentHero.subtitle}
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-10">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 rounded-full px-8 h-12"
                  data-testid="hero-cta-primary"
                >
                  <Link to={currentHero.primary_cta_link}>
                    {currentHero.primary_cta_text}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 h-12 border-2"
                  data-testid="hero-cta-secondary"
                >
                  <Link to={currentHero.secondary_cta_link}>{currentHero.secondary_cta_text}</Link>
                </Button>
              </div>

              {/* Stats */}
              {hpSettings.show_stats !== false && (
                <div className="flex flex-wrap gap-8">
                  {stats.slice(0, 3).map((stat, index) => (
                    <div key={index} className="text-center">
                      <p className="font-heading font-bold text-2xl md:text-3xl text-primary">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Right - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
                  alt="Digital Solutions"
                  className="rounded-2xl shadow-2xl w-full"
                />
                {/* Floating Badge */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Star className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">4.9/5</p>
                    <p className="text-xs text-muted-foreground">Client Rating</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="border-t border-slate-100 bg-white/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-6">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Trusted by innovative companies worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {trustLogos.map((logo, index) => (
                <div key={index} className="flex items-center gap-2 text-slate-400">
                  <logo.icon size={20} />
                  <span className="text-sm font-medium">{logo.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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

      {/* Products Section */}
      {hpSettings.show_products !== false && (
        <section className="py-20 md:py-32 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
                Our Products
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
                              {formatPrice(product.price)}
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

      {/* Portfolio Section */}
      {hpSettings.show_portfolio !== false && (
        <section className="py-20 md:py-32">
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
        <section className="py-20 md:py-32 bg-slate-50">
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
                          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                            <span className="text-primary font-semibold">
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
        <section className="py-20 md:py-32 bg-gradient-to-r from-violet-600 to-violet-800">
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
              <p className="text-violet-100 text-lg max-w-2xl mx-auto">
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
