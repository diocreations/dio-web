import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  FileText, Sparkles, Download, CheckCircle, ArrowRight,
  Zap, Shield, Clock, Award, Users, Star
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const defaultContent = {
  hero: {
    badge: "AI-Powered Resume Builder",
    title: "Create Professional Resumes",
    highlight: "in Minutes",
    description: "Build stunning, ATS-friendly resumes with our AI-powered builder. Stand out from the crowd and land your dream job.",
    cta_text: "Build Your Resume",
    cta_link: "/resume-builder",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80"
  },
  features: [
    { icon: "Sparkles", title: "AI-Powered Content", description: "Generate professional bullet points and summaries with AI assistance" },
    { icon: "FileText", title: "ATS-Friendly Templates", description: "All templates are optimized to pass Applicant Tracking Systems" },
    { icon: "Download", title: "Export to PDF", description: "Download your resume in high-quality PDF format instantly" },
    { icon: "Zap", title: "Quick & Easy", description: "Create a professional resume in under 10 minutes" },
    { icon: "Shield", title: "Privacy First", description: "Your data is secure and never shared with third parties" },
    { icon: "Clock", title: "Save & Edit Anytime", description: "Save your progress and come back to edit whenever you need" }
  ],
  stats: [
    { value: "50K+", label: "Resumes Created" },
    { value: "95%", label: "Success Rate" },
    { value: "4.9/5", label: "User Rating" }
  ],
  testimonials: [
    { name: "Sarah J.", role: "Software Engineer", text: "Got 3 interview calls within a week of using my new resume!", rating: 5 },
    { name: "Michael R.", role: "Marketing Manager", text: "The AI suggestions were incredibly helpful. Highly recommend!", rating: 5 }
  ],
  cta: {
    title: "Ready to Build Your Perfect Resume?",
    description: "Join thousands of job seekers who have landed their dream jobs with our resume builder.",
    button_text: "Get Started Free",
    button_link: "/resume-builder"
  }
};

const iconMap = {
  Sparkles, FileText, Download, Zap, Shield, Clock, Award, Users, Star, CheckCircle
};

const ResumeBuilderLandingPage = () => {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/pages/resume-builder-landing`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.content) setContent({ ...defaultContent, ...data.content });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getIcon = (iconName) => {
    const Icon = iconMap[iconName] || Sparkles;
    return <Icon className="w-6 h-6" />;
  };

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
        <title>AI Resume Builder - Create Professional Resumes | DioCreations</title>
        <meta name="description" content="Build stunning, ATS-friendly resumes with our AI-powered resume builder. Create professional resumes in minutes and land your dream job." />
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
            >
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                {content.hero.badge}
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
                {content.hero.title}
                <br />
                <span className="text-gradient">{content.hero.highlight}</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                {content.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-primary text-primary-foreground rounded-full px-8" data-testid="resume-builder-landing-cta">
                  <Link to={content.hero.cta_link}>
                    {content.hero.cta_text}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <img
                src={content.hero.image}
                alt="Resume Builder"
                className="rounded-2xl shadow-2xl w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-3 gap-8 text-center">
            {content.stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
              Why Choose Our Resume Builder?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create a professional resume that gets noticed
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-slate-100">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      {getIcon(feature.icon)}
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
              What Our Users Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {content.testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-foreground mb-4 italic">"{testimonial.text}"</p>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="bg-gradient-to-r from-primary to-violet-600 rounded-3xl p-12 text-center text-white">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
              {content.cta.title}
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              {content.cta.description}
            </p>
            <Button asChild size="lg" variant="secondary" className="rounded-full px-8" data-testid="resume-builder-landing-cta-bottom">
              <Link to={content.cta.button_link}>
                {content.cta.button_text}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ResumeBuilderLandingPage;
