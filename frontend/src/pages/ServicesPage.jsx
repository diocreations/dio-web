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
  ChevronRight,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const iconMap = {
  Code: Code,
  Search: Search,
  MapPin: MapPin,
  Brain: Brain,
  Zap: Zap,
  Mail: Mail,
};

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/services?active_only=true`)
      .then((res) => res.json())
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-violet-subtle" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm mb-6">
                Our Services
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">
                Comprehensive Digital
                <br />
                <span className="text-gradient">Solutions</span> for Your Business
              </h1>
              <p className="text-lg text-muted-foreground">
                From web development to AI integration, we offer end-to-end services 
                to help your business thrive in the digital landscape.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 rounded-2xl h-64" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {services.map((service, index) => {
                const IconComponent = iconMap[service.icon] || Code;
                const isEven = index % 2 === 0;

                return (
                  <motion.div
                    key={service.service_id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden border border-slate-100 hover:border-violet-200 hover:shadow-xl transition-all">
                      <CardContent className="p-0">
                        <div className={`grid grid-cols-1 lg:grid-cols-2 ${!isEven ? 'lg:flex-row-reverse' : ''}`}>
                          {/* Image Side */}
                          <div className={`relative h-64 lg:h-auto bg-gradient-to-br from-violet-100 to-violet-50 ${!isEven ? 'lg:order-2' : ''}`}>
                            {service.image_url ? (
                              <img
                                src={service.image_url}
                                alt={service.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <IconComponent className="text-primary/30" size={120} />
                              </div>
                            )}
                          </div>

                          {/* Content Side */}
                          <div className={`p-8 lg:p-12 flex flex-col justify-center ${!isEven ? 'lg:order-1' : ''}`}>
                            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-6">
                              <IconComponent className="text-primary" size={28} />
                            </div>
                            <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-4">
                              {service.title}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                              {service.description}
                            </p>
                            {service.features && service.features.length > 0 && (
                              <ul className="space-y-2 mb-6">
                                {service.features.slice(0, 4).map((feature, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ChevronRight className="text-primary" size={16} />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div>
                              <Button
                                asChild
                                className="bg-primary text-primary-foreground rounded-full px-6"
                                data-testid={`service-learn-more-${service.slug}`}
                              >
                                <Link to={`/services/${service.slug}`}>
                                  Learn More
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-violet-600 to-violet-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-6">
            Not Sure Which Service You Need?
          </h2>
          <p className="text-violet-100 mb-8 max-w-2xl mx-auto">
            Let's discuss your project requirements and find the perfect solution for your business
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-8"
            data-testid="services-contact-cta"
          >
            <Link to="/contact">
              Get Free Consultation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default ServicesPage;
