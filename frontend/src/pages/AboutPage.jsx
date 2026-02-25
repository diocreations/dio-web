import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Award, Target, Lightbulb, ArrowRight, CheckCircle2, Heart, Shield, Zap, Globe } from "lucide-react";
import { Helmet } from "react-helmet";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Icon mapping
const iconMap = {
  Target: Target,
  Lightbulb: Lightbulb,
  Award: Award,
  Users: Users,
  Heart: Heart,
  Shield: Shield,
  Zap: Zap,
  Globe: Globe,
};

const AboutPage = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/about/content`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Default values if content not loaded
  const heroContent = {
    badge: content?.hero_badge || "About Us",
    titleLine1: content?.hero_title_line1 || "Building Digital",
    titleLine2: content?.hero_title_line2 || "Excellence Since 2015",
    description: content?.hero_description || "DioCreations is a full-service digital agency specializing in web development, SEO, and AI-powered solutions.",
    ctaText: content?.hero_cta_text || "Work With Us",
    ctaLink: content?.hero_cta_link || "/contact",
    image: content?.hero_image || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
  };

  const stats = content?.stats || [
    { value: "10+", label: "Years Experience" },
    { value: "500+", label: "Projects Completed" },
    { value: "50+", label: "Team Members" },
    { value: "20+", label: "Countries Served" },
  ];

  const values = content?.values || [
    { icon: "Target", title: "Client-Focused", description: "Your success is our priority." },
    { icon: "Lightbulb", title: "Innovation First", description: "We stay ahead of technology trends." },
    { icon: "Award", title: "Excellence", description: "Quality is non-negotiable." },
    { icon: "Users", title: "Collaboration", description: "Transparent communication and partnership." },
  ];

  const milestones = content?.milestones || [
    { year: "2015", title: "Founded", description: "Started with a vision to democratize digital solutions" },
    { year: "2023", title: "500+ Projects", description: "Celebrated 500+ successful digital transformations" },
  ];

  const whyUsPoints = content?.why_us_points || [
    "Custom solutions tailored to your needs",
    "24/7 support and maintenance",
    "Proven track record of success",
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
      <Helmet>
        <title>{content?.meta_title || "About Us | DIOCREATIONS"}</title>
        <meta name="description" content={content?.meta_description || "Learn about DIOCREATIONS"} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-violet-subtle" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm">
                {heroContent.badge}
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground leading-tight">
                {heroContent.titleLine1}
                <br />
                <span className="text-gradient">{heroContent.titleLine2}</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                {heroContent.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground rounded-full px-8"
                  data-testid="about-cta"
                >
                  <Link to={heroContent.ctaLink}>
                    {heroContent.ctaText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img
                src={heroContent.image}
                alt="Our Team"
                className="rounded-3xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {content?.show_stats !== false && (
        <section className="py-16 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <p className="font-heading font-bold text-4xl md:text-5xl">{stat.value}</p>
                  <p className="text-slate-400 mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Values Section */}
      {content?.show_values !== false && (
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
                {content?.values_badge || "Our Values"}
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                {content?.values_title || "What Drives Us"}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {content?.values_subtitle || "Our core values shape everything we do"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const Icon = iconMap[value.icon] || Target;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto">
                      <Icon className="text-primary" size={32} />
                    </div>
                    <h3 className="font-heading font-semibold text-xl text-foreground">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {value.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Timeline Section */}
      {content?.show_timeline !== false && (
        <section className="py-20 md:py-32 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
                {content?.timeline_badge || "Our Journey"}
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                {content?.timeline_title || "Milestones Along the Way"}
              </h2>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-violet-200 hidden md:block" />

              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`flex flex-col md:flex-row items-center gap-8 ${
                      index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <span className="text-primary font-heading font-bold text-lg">
                          {milestone.year}
                        </span>
                        <h3 className="font-heading font-semibold text-xl text-foreground mt-2">
                          {milestone.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-2">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-primary relative z-10" />
                    <div className="flex-1" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      {content?.show_why_us !== false && (
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
                  {content?.why_us_badge || "Why Choose Us"}
                </span>
                <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-6">
                  {content?.why_us_title || "We're Your Partners in Digital Growth"}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {content?.why_us_description || "With years of experience and a dedicated team of experts, we deliver solutions that drive real results for your business."}
                </p>
                <ul className="space-y-4">
                  {whyUsPoints.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="text-primary flex-shrink-0 mt-0.5" size={20} />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <img
                  src={content?.why_us_image || "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80"}
                  alt="Why Choose Us"
                  className="rounded-3xl shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {content?.show_cta !== false && (
        <section className="py-20 bg-gradient-to-r from-violet-600 to-violet-800">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-6">
                {content?.cta_title || "Ready to Start Your Project?"}
              </h2>
              <p className="text-violet-100 mb-8 max-w-2xl mx-auto">
                {content?.cta_subtitle || "Let's discuss how we can help you achieve your digital goals"}
              </p>
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-full px-8"
                data-testid="about-contact-cta"
              >
                <Link to={content?.cta_button_link || "/contact"}>
                  {content?.cta_button_text || "Get in Touch"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default AboutPage;
