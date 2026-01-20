import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Globe,
  Server,
  Shield,
  Layout as LayoutIcon,
  Cloud,
  CloudCog,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const iconMap = {
  Globe: Globe,
  Server: Server,
  Shield: Shield,
  Layout: LayoutIcon,
  Cloud: Cloud,
  CloudCog: CloudCog,
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/products?active_only=true`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
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
                Our Products
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">
                Everything You Need to
                <br />
                <span className="text-gradient">Build Online</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                From domain registration to cloud hosting, we provide all the tools 
                and services you need to establish your online presence.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 rounded-2xl h-96" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    <Card
                      className={`p-8 rounded-2xl bg-white h-full relative ${
                        product.is_popular
                          ? "border-2 border-primary shadow-xl shadow-violet-500/10"
                          : "border border-slate-100 hover:border-violet-200"
                      } hover:shadow-xl transition-all`}
                    >
                      {product.is_popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-medium">
                          Most Popular
                        </span>
                      )}
                      <CardContent className="p-0 space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                          <IconComponent className="text-primary" size={28} />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-xl text-foreground mb-2">
                            {product.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {product.short_description}
                          </p>
                        </div>

                        {product.price && (
                          <div className="py-4 border-y border-slate-100">
                            <span className="font-heading font-bold text-4xl text-foreground">
                              ${product.price}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              /{product.price_unit}
                            </span>
                          </div>
                        )}

                        {product.features && product.features.length > 0 && (
                          <ul className="space-y-3">
                            {product.features.map((feature, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <CheckCircle2
                                  className="text-primary flex-shrink-0 mt-0.5"
                                  size={16}
                                />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}

                        <Button
                          asChild
                          className={`w-full rounded-full ${
                            product.is_popular
                              ? "bg-primary text-white"
                              : ""
                          }`}
                          variant={product.is_popular ? "default" : "outline"}
                          data-testid={`product-cta-${product.slug}`}
                        >
                          <Link to="/contact">{product.cta_text}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
              Why Choose Our Products?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All our products come with these standard features
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "99.9% Uptime", desc: "Rock-solid reliability guaranteed" },
              { title: "24/7 Support", desc: "Expert help whenever you need it" },
              { title: "Easy Setup", desc: "Get started in minutes" },
              { title: "Secure", desc: "Enterprise-grade security" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-primary" size={32} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-violet-600 to-violet-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-6">
            Need Help Choosing?
          </h2>
          <p className="text-violet-100 mb-8 max-w-2xl mx-auto">
            Our team is here to help you find the perfect solution for your needs
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-8"
            data-testid="products-contact-cta"
          >
            <Link to="/contact">
              Contact Sales
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default ProductsPage;
