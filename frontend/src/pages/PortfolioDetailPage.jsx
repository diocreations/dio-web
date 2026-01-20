import Layout from "../components/Layout";
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { ArrowRight, ArrowLeft, ExternalLink } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PortfolioDetailPage = () => {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/portfolio/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setItem(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <h1 className="font-heading font-bold text-2xl mb-4">Project Not Found</h1>
          <Button asChild>
            <Link to="/portfolio">Back to Portfolio</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <Link
            to="/portfolio"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portfolio
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-violet-100 text-primary font-medium text-sm">
                {item.category}
              </span>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground">
                {item.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {item.description}
              </p>
              
              {item.client_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium text-foreground">{item.client_name}</p>
                </div>
              )}

              {item.technologies && item.technologies.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {item.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-violet-100 text-primary text-sm font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-4">
                {item.project_url && (
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary text-primary-foreground rounded-full px-8"
                  >
                    <a href={item.project_url} target="_blank" rel="noopener noreferrer">
                      View Live Project
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8"
                >
                  <Link to="/contact">Start Similar Project</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img
                src={item.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"}
                alt={item.title}
                className="rounded-3xl shadow-2xl w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {item.gallery_images && item.gallery_images.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-8">
              Project Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {item.gallery_images.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <img
                    src={image}
                    alt={`${item.title} - Image ${index + 1}`}
                    className="rounded-xl shadow-lg w-full aspect-video object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-violet-600 to-violet-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-6">
            Like What You See?
          </h2>
          <p className="text-violet-100 mb-8 max-w-2xl mx-auto">
            Let's create something amazing together
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-8"
          >
            <Link to="/contact">
              Start Your Project
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default PortfolioDetailPage;
