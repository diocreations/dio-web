import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Search, Sparkles, Target, CheckCircle, ArrowRight,
  Zap, TrendingUp, BarChart3, Award, Linkedin, FileSearch
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const defaultContent = {
  hero: {
    badge: "AI Resume Analyzer & LinkedIn Optimizer",
    title: "Optimize Your Career",
    highlight: "Profile Today",
    description: "Get AI-powered insights to improve your resume and LinkedIn profile. Stand out to recruiters and land more interviews.",
    cta_text: "Analyze Your Resume",
    cta_link: "/resume-optimizer",
    secondary_cta_text: "Optimize LinkedIn",
    secondary_cta_link: "/resume-optimizer",
    image: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&q=80"
  },
  features: [
    { icon: "Search", title: "ATS Score Analysis", description: "See how well your resume performs against Applicant Tracking Systems" },
    { icon: "Target", title: "Job Match Score", description: "Compare your resume against specific job descriptions for better targeting" },
    { icon: "Sparkles", title: "AI Suggestions", description: "Get personalized recommendations to improve your resume content" },
    { icon: "Linkedin", title: "LinkedIn Optimization", description: "Optimize your LinkedIn profile to attract more recruiters" },
    { icon: "TrendingUp", title: "Keyword Analysis", description: "Identify missing keywords that could boost your visibility" },
    { icon: "BarChart3", title: "Detailed Reports", description: "Comprehensive analysis with actionable improvement tips" }
  ],
  stats: [
    { value: "10K+", label: "Resumes Analyzed" },
    { value: "85%", label: "Interview Rate Increase" },
    { value: "4.8/5", label: "User Rating" }
  ],
  process: [
    { step: "1", title: "Upload Resume", description: "Upload your resume in PDF or Word format" },
    { step: "2", title: "AI Analysis", description: "Our AI analyzes your resume against industry standards" },
    { step: "3", title: "Get Insights", description: "Receive detailed feedback and improvement suggestions" },
    { step: "4", title: "Optimize", description: "Apply changes and watch your interview rate improve" }
  ],
  cta: {
    title: "Ready to Supercharge Your Job Search?",
    description: "Join thousands of professionals who have improved their career prospects with our AI tools.",
    button_text: "Start Free Analysis",
    button_link: "/resume-optimizer"
  }
};

const iconMap = {
  Search, Sparkles, Target, Zap, TrendingUp, BarChart3, Award, Linkedin, FileSearch, CheckCircle
};

const ResumeAnalyzerLandingPage = () => {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/pages/resume-analyzer-landing`)
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
        <title>AI Resume Analyzer & LinkedIn Optimizer | DioCreations</title>
        <meta name="description" content="Get AI-powered insights to improve your resume and LinkedIn profile. Analyze your ATS score, get keyword suggestions, and land more interviews." />
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
                <Button asChild size="lg" className="bg-primary text-primary-foreground rounded-full px-8" data-testid="resume-analyzer-landing-cta">
                  <Link to={content.hero.cta_link}>
                    {content.hero.cta_text}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                  <Link to={content.hero.secondary_cta_link}>
                    <Linkedin className="mr-2 h-5 w-5" />
                    {content.hero.secondary_cta_text}
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
                alt="Resume Analyzer"
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
              Powerful Analysis Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to optimize your resume and LinkedIn profile
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

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {content.process.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
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
            <Button asChild size="lg" variant="secondary" className="rounded-full px-8" data-testid="resume-analyzer-landing-cta-bottom">
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

export default ResumeAnalyzerLandingPage;
