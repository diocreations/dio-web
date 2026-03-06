import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  FileText, Sparkles, Download, CheckCircle, ArrowRight,
  Zap, Shield, Clock, Award, Users, Star, Search, Target,
  TrendingUp, BarChart3, Linkedin, PenTool, MessageSquare,
  Code, Globe, Smartphone, Mail, Phone, MapPin, Heart,
  Rocket, Lightbulb, Settings, Database, Cloud, Lock
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const iconMap = {
  FileText, Sparkles, Download, CheckCircle, ArrowRight,
  Zap, Shield, Clock, Award, Users, Star, Search, Target,
  TrendingUp, BarChart3, Linkedin, PenTool, MessageSquare,
  Code, Globe, Smartphone, Mail, Phone, MapPin, Heart,
  Rocket, Lightbulb, Settings, Database, Cloud, Lock
};

const CustomPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/pages/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(data => {
        if (!data.is_custom || !data.is_published) {
          setNotFound(true);
        } else {
          setPage(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

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

  if (notFound) {
    return <Navigate to="/" replace />;
  }

  const content = page?.content || {};
  const hero = content.hero || {};
  const stats = content.stats || [];
  const features = content.features || [];
  const testimonials = content.testimonials || [];
  const benefits = content.benefits || [];
  const cta = content.cta || {};

  return (
    <Layout>
      <Helmet>
        <title>{page?.title || "Page"} | DioCreations</title>
        <meta name="description" content={hero.description || ""} />
      </Helmet>

      {(hero.title || hero.description) && (
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 gradient-violet-subtle" />
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                {hero.badge && <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">{hero.badge}</span>}
                <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
                  {hero.title}
                  {hero.highlight && <><br /><span className="text-gradient">{hero.highlight}</span></>}
                </h1>
                {hero.description && <p className="text-lg text-muted-foreground mb-8 max-w-lg">{hero.description}</p>}
                <div className="flex flex-col sm:flex-row gap-4">
                  {hero.cta_text && hero.cta_link && (
                    <Button asChild size="lg" className="bg-primary text-primary-foreground rounded-full px-8">
                      <Link to={hero.cta_link}>{hero.cta_text}<ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                  )}
                </div>
              </motion.div>
              {hero.image && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
                  <img src={hero.image} alt={hero.title || "Hero"} className="rounded-2xl shadow-2xl w-full" />
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {stats.length > 0 && (
        <section className="py-12 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="grid grid-cols-3 gap-8 text-center">
              {stats.map((stat, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {features.length > 0 && (
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            {content.features_title && (
              <div className="text-center mb-16">
                <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">{content.features_title}</h2>
                {content.features_subtitle && <p className="text-muted-foreground max-w-2xl mx-auto">{content.features_subtitle}</p>}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                  <Card className="h-full hover:shadow-lg transition-shadow border-slate-100">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">{getIcon(feature.icon)}</div>
                      <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {benefits.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                {content.benefits_title && <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-6">{content.benefits_title}</h2>}
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.li key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                  <Card className="h-full">
                    <CardContent className="p-6">
                      {testimonial.rating && (
                        <div className="flex gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                        </div>
                      )}
                      <p className="text-foreground mb-4 italic">"{testimonial.text}"</p>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        {testimonial.role && <p className="text-sm text-muted-foreground">{testimonial.role}</p>}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {(cta.title || cta.description) && (
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="bg-gradient-to-r from-primary to-violet-600 rounded-3xl p-12 text-center text-white">
              {cta.title && <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">{cta.title}</h2>}
              {cta.description && <p className="text-white/80 mb-8 max-w-2xl mx-auto">{cta.description}</p>}
              {cta.button_text && cta.button_link && (
                <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
                  <Link to={cta.button_link}>{cta.button_text}<ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default CustomPage;
