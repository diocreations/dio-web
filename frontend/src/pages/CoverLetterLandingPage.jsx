import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  FileText, Sparkles, PenTool, CheckCircle, ArrowRight,
  Zap, Clock, Target, Award, Star, MessageSquare
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const defaultContent = {
  hero: {
    badge: "AI Cover Letter Generator",
    title: "Write Perfect Cover Letters",
    highlight: "Instantly",
    description: "Create personalized, compelling cover letters in seconds with our AI-powered generator. Tailored to each job application.",
    cta_text: "Generate Cover Letter",
    cta_link: "/cover-letter",
    image: "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=800&q=80"
  },
  features: [
    { icon: "Sparkles", title: "AI-Powered Writing", description: "Generate professional cover letters tailored to specific job descriptions" },
    { icon: "Target", title: "Job-Specific Content", description: "Automatically match your skills to job requirements" },
    { icon: "PenTool", title: "Multiple Tones", description: "Choose from professional, creative, or enthusiastic writing styles" },
    { icon: "Zap", title: "Instant Generation", description: "Create a complete cover letter in under 30 seconds" },
    { icon: "Clock", title: "Save Time", description: "No more hours spent crafting the perfect letter" },
    { icon: "MessageSquare", title: "Easy Editing", description: "Fine-tune generated content to add your personal touch" }
  ],
  stats: [
    { value: "25K+", label: "Cover Letters Created" },
    { value: "3x", label: "More Interviews" },
    { value: "30 sec", label: "Average Time" }
  ],
  benefits: [
    "Personalized to each job application",
    "ATS-optimized formatting",
    "Professional language and tone",
    "Highlights relevant experience",
    "Easy to customize and edit",
    "Multiple export formats"
  ],
  cta: {
    title: "Stop Struggling with Cover Letters",
    description: "Let AI do the heavy lifting while you focus on preparing for interviews.",
    button_text: "Create Your Cover Letter",
    button_link: "/cover-letter"
  }
};

const iconMap = {
  Sparkles, FileText, PenTool, Zap, Clock, Target, Award, Star, MessageSquare, CheckCircle
};

const CoverLetterLandingPage = () => {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/pages/cover-letter-landing`)
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
        <title>AI Cover Letter Generator - Create Perfect Cover Letters | DioCreations</title>
        <meta name="description" content="Create personalized, compelling cover letters in seconds with our AI-powered generator. Tailored to each job application for maximum impact." />
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
              <Button asChild size="lg" className="bg-primary text-primary-foreground rounded-full px-8" data-testid="cover-letter-landing-cta">
                <Link to={content.hero.cta_link}>
                  {content.hero.cta_text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <img
                src={content.hero.image}
                alt="Cover Letter Generator"
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
              Smart Cover Letter Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create cover letters that get responses
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

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-6">
                Why Use AI for Cover Letters?
              </h2>
              <p className="text-muted-foreground mb-8">
                Our AI understands what hiring managers look for and creates compelling narratives that highlight your strengths.
              </p>
              <ul className="space-y-4">
                {content.benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="space-y-4">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3 mt-6"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-4/5"></div>
              </div>
            </motion.div>
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
            <Button asChild size="lg" variant="secondary" className="rounded-full px-8" data-testid="cover-letter-landing-cta-bottom">
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

export default CoverLetterLandingPage;
