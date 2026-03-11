import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FAQSection = ({ pageType = "both" }) => {
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState({});

  useEffect(() => {
    fetch(`${API_URL}/api/faq/public?page_type=${pageType}`)
      .then(r => r.json())
      .then(data => {
        setFaqData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pageType]);

  const toggleItem = (faqId) => {
    setOpenItems(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!faqData || faqData.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our {pageType === "services" ? "services" : pageType === "products" ? "products" : "services and products"}
          </p>
        </motion.div>

        <div className="space-y-8">
          {faqData.map((categoryGroup, catIndex) => (
            <motion.div
              key={categoryGroup.category.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: catIndex * 0.1 }}
            >
              <h3 className="font-heading font-semibold text-xl text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                {categoryGroup.category.name}
              </h3>
              
              <div className="space-y-3">
                {categoryGroup.faqs.map((faq) => (
                  <div
                    key={faq.faq_id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => toggleItem(faq.faq_id)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-foreground pr-4">
                        {faq.question}
                      </span>
                      <motion.div
                        animate={{ rotate: openItems[faq.faq_id] ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown size={20} className="text-muted-foreground" />
                      </motion.div>
                    </button>
                    
                    <AnimatePresence>
                      {openItems[faq.faq_id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-6 pb-4 border-t border-slate-100 pt-4">
                            <p className="text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                            {faq.link_url && (
                              <Link
                                to={faq.link_url}
                                className="inline-flex items-center gap-1 mt-3 text-primary hover:text-primary/80 font-medium text-sm"
                              >
                                {faq.link_text || "Learn More"}
                                <ExternalLink size={14} />
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Still have questions?{" "}
            <Link to="/contact" className="text-primary hover:text-primary/80 font-medium">
              Contact us
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
