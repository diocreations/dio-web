import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Users, Award, Target, Lightbulb, ArrowRight, CheckCircle2 } from "lucide-react";

const AboutPage = () => {
  const values = [
    {
      icon: Target,
      title: "Client-Focused",
      description: "Your success is our priority. We work closely with you to understand your goals and deliver solutions that exceed expectations."
    },
    {
      icon: Lightbulb,
      title: "Innovation First",
      description: "We stay ahead of technology trends to bring you cutting-edge solutions that give you a competitive advantage."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Quality is non-negotiable. Every project we deliver meets the highest standards of performance and reliability."
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "We believe in transparent communication and partnership throughout the project lifecycle."
    }
  ];

  const milestones = [
    { year: "2015", title: "Founded", description: "Started with a vision to democratize digital solutions" },
    { year: "2017", title: "100+ Projects", description: "Reached milestone of 100 successful project deliveries" },
    { year: "2019", title: "Global Expansion", description: "Extended services to clients across 20+ countries" },
    { year: "2021", title: "AI Integration", description: "Launched AI-powered development and automation services" },
    { year: "2023", title: "500+ Projects", description: "Celebrated 500+ successful digital transformations" },
    { year: "2025", title: "Industry Leader", description: "Recognized as a leading digital solutions provider" }
  ];

  return (
    <Layout>
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
                About Us
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground leading-tight">
                Building Digital
                <br />
                <span className="text-gradient">Excellence</span> Since 2015
              </h1>
              <p className="text-lg text-muted-foreground">
                DioCreations is a full-service digital agency specializing in web development, 
                SEO, and AI-powered solutions. We help businesses of all sizes establish and 
                grow their online presence.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground rounded-full px-8"
                  data-testid="about-cta"
                >
                  <Link to="/contact">
                    Work With Us
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
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80"
                alt="Our Team"
                className="rounded-3xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-heading font-bold text-4xl md:text-5xl">10+</p>
              <p className="text-slate-400 mt-2">Years Experience</p>
            </div>
            <div>
              <p className="font-heading font-bold text-4xl md:text-5xl">500+</p>
              <p className="text-slate-400 mt-2">Projects Completed</p>
            </div>
            <div>
              <p className="font-heading font-bold text-4xl md:text-5xl">50+</p>
              <p className="text-slate-400 mt-2">Team Members</p>
            </div>
            <div>
              <p className="font-heading font-bold text-4xl md:text-5xl">20+</p>
              <p className="text-slate-400 mt-2">Countries Served</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
              Our Values
            </span>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
              What Drives Us
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our core values shape everything we do and how we serve our clients
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
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

      {/* Timeline Section */}
      <section className="py-20 md:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
              Our Journey
            </span>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
              Milestones Along the Way
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

      {/* Why Choose Us Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-4">
                Why Choose Us
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-6">
                We're Your Partners in Digital Growth
              </h2>
              <p className="text-muted-foreground mb-8">
                With years of experience and a dedicated team of experts, we deliver 
                solutions that drive real results for your business.
              </p>
              <ul className="space-y-4">
                {[
                  "Custom solutions tailored to your needs",
                  "Dedicated project managers for every project",
                  "Transparent pricing with no hidden fees",
                  "24/7 support and maintenance",
                  "Proven track record of success",
                  "Latest technologies and best practices"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="text-primary flex-shrink-0 mt-0.5" size={20} />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80"
                alt="Why Choose Us"
                className="rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-violet-600 to-violet-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-6">
            Ready to Start Your Project?
          </h2>
          <p className="text-violet-100 mb-8 max-w-2xl mx-auto">
            Let's discuss how we can help you achieve your digital goals
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-8"
            data-testid="about-contact-cta"
          >
            <Link to="/contact">
              Get in Touch
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
