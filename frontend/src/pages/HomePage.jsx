import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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

const HomePage = () => {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    // Seed data and fetch
    fetch(`${API_URL}/api/seed`, { method: "POST" }).catch(() => {});
    
    Promise.all([
      fetch(`${API_URL}/api/services?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/products?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/testimonials?active_only=true`).then((r) => r.json()),
      fetch(`${API_URL}/api/settings`).then((r) => r.json()),
    ])
      .then(([servicesData, productsData, testimonialsData, settingsData]) => {
        setServices(servicesData.slice(0, 6));
        setProducts(productsData.slice(0, 4));
        setTestimonials(testimonialsData.slice(0, 3));
        setSettings(settingsData);
      })
      .catch(console.error);
  }, []);

  const clientLogos = [
    { name: "Luxe Fashion", logo: "LF" },
    { name: "FinServe Bank", logo: "FS" },
    { name: "HealthTrack", logo: "HT" },
    { name: "InsightPro", logo: "IP" },
    { name: "PropertyHub", logo: "PH" },
    { name: "EduLearn", logo: "EL" }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 gradient-violet-subtle" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-6">
                  Digital Excellence for Modern Business
                </span>
                <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight">
                  Your{" "}
                  <span className="text-gradient">AI-Powered</span>
                  <br />
                  Growth Starts Here
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-lg text-muted-foreground max-w-xl"
              >
                From small business websites to enterprise-grade systems — we build 
                eCommerce, AI-driven, and mobile app solutions that scale your business.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="flex flex-wrap gap-4"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-12"
                  data-testid="hero-cta-primary"
                >
                  <Link to="/contact">
                    Get Started
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
                  <Link to="/services">View Services</Link>
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-wrap gap-8 pt-8 border-t border-border mt-8"
              >
                <div>
                  <p className="font-heading font-bold text-3xl text-foreground">10+</p>
                  <p className="text-sm text-muted-foreground">Years Experience</p>
                </div>
                <div>
                  <p className="font-heading font-bold text-3xl text-foreground">500+</p>
                  <p className="text-sm text-muted-foreground">Projects Delivered</p>
                </div>
                <div>
                  <p className="font-heading font-bold text-3xl text-foreground">98%</p>
                  <p className="text-sm text-muted-foreground">Client Satisfaction</p>
                </div>
              </motion.div>
            </div>

            {/* Right - Hero Image/Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative">
                <div className="absolute inset-0 gradient-violet rounded-3xl blur-2xl opacity-30 transform rotate-6" />
                <img
                  src="https://images.unsplash.com/photo-1581225218177-9a18341ec628?w=600&q=80"
                  alt="Digital Solutions"
                  className="relative rounded-3xl shadow-2xl w-full"
                />
                {/* Floating Card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-violet flex items-center justify-center">
                      <Star className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-lg">4.9/5</p>
                      <p className="text-xs text-muted-foreground">Client Rating</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 bg-slate-50 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by innovative companies worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {clientLogos.map((client, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <span className="font-heading font-bold text-sm">{client.logo}</span>
                </div>
                <span className="font-medium text-sm hidden sm:block">{client.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
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

      {/* Products Section */}
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
                            ${product.price}
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

      {/* Testimonials Section */}
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

      {/* CTA Section */}
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
    </Layout>
  );
};

export default HomePage;
