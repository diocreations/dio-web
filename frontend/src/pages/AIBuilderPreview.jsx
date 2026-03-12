import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ChevronLeft, Globe, Home, Info, Briefcase, Mail, FileText,
  Star, Shield, Zap, Users, Heart, MapPin, Phone, Clock,
  Facebook, Instagram, Linkedin, Menu, X, Palette, Download
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Icon mapping
const iconMap = {
  star: Star, shield: Shield, zap: Zap, users: Users, heart: Heart,
  home: Home, info: Info, briefcase: Briefcase, mail: Mail, file: FileText
};

// Theme configurations
const themes = {
  modern: {
    name: "Modern",
    primary: "#7c3aed",
    secondary: "#a855f7",
    gradient: "from-violet-600 to-purple-600"
  },
  corporate: {
    name: "Corporate",
    primary: "#1e40af",
    secondary: "#3b82f6",
    gradient: "from-blue-700 to-blue-500"
  },
  startup: {
    name: "Startup",
    primary: "#059669",
    secondary: "#10b981",
    gradient: "from-emerald-600 to-teal-500"
  },
  minimal: {
    name: "Minimal",
    primary: "#18181b",
    secondary: "#3f3f46",
    gradient: "from-zinc-800 to-zinc-600"
  }
};

// Animated Butterfly SVG for branding
const ButterflyIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <style>{`
      .butterfly-wing { animation: flap 0.4s ease-in-out infinite alternate; }
      .left-wing { transform-origin: 10px 10px; }
      .right-wing { transform-origin: 10px 10px; }
      @keyframes flap { from { transform: rotate(0deg); } to { transform: rotate(-20deg); } }
    `}</style>
    <g className="right-wing butterfly-wing">
      <path fill="#4D629A" d="M12.7,16.16c-2.36-2.36-2.64-6.14-2.64-6.14s3.98,0.48,6.14,2.64c1.27,1.28,1.52,3.09,0.56,4.06S13.97,17.43,12.7,16.16z"/>
      <path fill="#00A096" d="M16.26,12.5c-3.34,0-6.2-2.48-6.2-2.48s3.16-2.48,6.2-2.48c1.8,0,3.26,1.11,3.26,2.48S18.07,12.5,16.26,12.5z"/>
      <path fill="#89BF4A" d="M16.19,7.39c-2.36,2.36-6.14,2.64-6.14,2.64s0.48-3.99,2.64-6.14c1.27-1.27,3.09-1.52,4.05-0.56S17.47,6.12,16.19,7.39z"/>
    </g>
    <g className="left-wing butterfly-wing" style={{animationDirection: 'alternate-reverse'}}>
      <path fill="#8F5398" d="M7.3,16.11c2.36-2.36,2.64-6.14,2.64-6.14s-3.98,0.48-6.14,2.64c-1.27,1.27-1.52,3.09-0.56,4.06S6.03,17.39,7.3,16.11z"/>
      <path fill="#E16136" d="M3.74,12.45c3.34,0,6.2-2.48,6.2-2.48S6.78,7.5,3.74,7.5c-1.8,0-3.26,1.11-3.26,2.47S1.93,12.45,3.74,12.45z"/>
      <path fill="#F3BE33" d="M3.81,7.34c2.36,2.36,6.14,2.64,6.14,2.64S9.46,6,7.3,3.84C6.03,2.57,4.21,2.32,3.25,3.29S2.53,6.07,3.81,7.34z"/>
    </g>
  </svg>
);

const AIBuilderPreview = () => {
  const { websiteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [websiteData, setWebsiteData] = useState(null);
  const [currentPage, setCurrentPage] = useState("home");
  const [currentTheme, setCurrentTheme] = useState("modern");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchWebsite();
  }, [websiteId]);

  const fetchWebsite = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ai-builder/website/${websiteId}`);
      if (!response.ok) {
        throw new Error("Website not found");
      }
      const data = await response.json();
      setWebsiteData(data);
      setCurrentTheme(data.theme || "modern");
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load website preview");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai-builder/website/${websiteId}/download`);
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${websiteData?.business_name?.toLowerCase().replace(/\s+/g, '-') || 'website'}-website.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Website downloaded!");
    } catch (err) {
      toast.error("Failed to download website");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !websiteData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">{error || "Website not found"}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const content = websiteData.content || {};
  const images = websiteData.images || {};
  const brand = content.brand || { name: websiteData.business_name };
  const theme = themes[currentTheme] || themes.modern;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
            <span className="text-sm font-medium text-slate-600 hidden sm:block">
              Preview: {brand.name}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={currentTheme} onValueChange={setCurrentTheme}>
              <SelectTrigger className="w-32 h-9">
                <Palette size={14} className="mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(themes).map(([key, t]) => (
                  <SelectItem key={key} value={key}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button size="sm" onClick={handleDownload} className={`bg-gradient-to-r ${theme.gradient}`}>
              <Download size={14} className="mr-1" /> Download
            </Button>
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="fixed top-14 left-0 right-0 bg-slate-50 border-b z-40">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 py-2">
            {[
              { id: "home", label: "Home", icon: Home },
              { id: "about", label: "About", icon: Info },
              { id: "services", label: "Services", icon: Briefcase },
              { id: "blog", label: "Blog", icon: FileText },
              { id: "contact", label: "Contact", icon: Mail }
            ].map((page) => (
              <Button
                key={page.id}
                variant={currentPage === page.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage(page.id)}
                className={currentPage === page.id ? `bg-gradient-to-r ${theme.gradient}` : ""}
              >
                <page.icon size={14} className="mr-1" /> {page.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Website Preview */}
      <div className="pt-28 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
            {/* Website Header */}
            <header className={`bg-gradient-to-r ${theme.gradient} text-white`}>
              <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={24} />
                  <span className="font-bold text-lg">{brand.name}</span>
                </div>
                <nav className="hidden md:flex items-center gap-6">
                  {["Home", "About", "Services", "Blog", "Contact"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item.toLowerCase())}
                      className={`text-sm font-medium hover:opacity-80 ${currentPage === item.toLowerCase() ? "border-b-2 border-white pb-1" : ""}`}
                    >
                      {item}
                    </button>
                  ))}
                </nav>
                <Button variant="secondary" size="sm" className="hidden md:flex">
                  Contact Us
                </Button>
                <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </header>

            {/* Page Content */}
            <main className="min-h-[600px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* HOME PAGE */}
                  {currentPage === "home" && content.homepage && (
                    <div>
                      <section 
                        className={`bg-gradient-to-br ${theme.gradient} text-white py-20 px-6 relative`}
                        style={images?.hero ? {
                          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(data:image/png;base64,${images.hero})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        <div className="max-w-4xl mx-auto text-center relative z-10">
                          <h1 className="text-4xl md:text-5xl font-bold mb-4">{content.homepage.headline}</h1>
                          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">{content.homepage.subheadline}</p>
                          <Button size="lg" variant="secondary" className="text-lg px-8">
                            {content.homepage.cta_text || "Get Started"}
                          </Button>
                        </div>
                      </section>

                      {content.homepage.features && (
                        <section className="py-16 px-6">
                          <div className="max-w-5xl mx-auto">
                            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
                            <div className="grid md:grid-cols-3 gap-8">
                              {content.homepage.features.map((feature, i) => {
                                const Icon = iconMap[feature.icon] || Star;
                                return (
                                  <Card key={i} className="text-center p-6 hover:shadow-lg transition-shadow">
                                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${theme.gradient} text-white mb-4`}>
                                      <Icon size={24} />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                                    <p className="text-slate-600">{feature.description}</p>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        </section>
                      )}
                    </div>
                  )}

                  {/* ABOUT PAGE */}
                  {currentPage === "about" && content.about && (
                    <div>
                      <section className={`bg-gradient-to-br ${theme.gradient} text-white py-16 px-6`}>
                        <div className="max-w-4xl mx-auto text-center">
                          <h1 className="text-4xl font-bold mb-4">{content.about.headline || "About Us"}</h1>
                        </div>
                      </section>
                      <section className="py-16 px-6">
                        <div className="max-w-3xl mx-auto">
                          <p className="text-lg leading-relaxed whitespace-pre-line">{content.about.content}</p>
                          {content.about.mission && (
                            <div className="mt-12 p-6 bg-slate-50 rounded-xl">
                              <h3 className="font-semibold text-lg mb-2">Our Mission</h3>
                              <p className="text-slate-600">{content.about.mission}</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  )}

                  {/* SERVICES PAGE */}
                  {currentPage === "services" && content.services && (
                    <div>
                      <section className={`bg-gradient-to-br ${theme.gradient} text-white py-16 px-6`}>
                        <div className="max-w-4xl mx-auto text-center">
                          <h1 className="text-4xl font-bold mb-4">{content.services.headline || "Our Services"}</h1>
                          <p className="text-xl opacity-90">{content.services.description}</p>
                        </div>
                      </section>
                      <section className="py-16 px-6">
                        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
                          {content.services.services?.map((service, i) => (
                            <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
                              <h3 className="font-semibold text-xl mb-2">{service.title}</h3>
                              <p className="text-slate-600 mb-4">{service.description}</p>
                              {service.price && (
                                <p className="font-semibold" style={{ color: theme.primary }}>{service.price}</p>
                              )}
                            </Card>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {/* BLOG PAGE */}
                  {currentPage === "blog" && content.blog && (
                    <div>
                      <section className={`bg-gradient-to-br ${theme.gradient} text-white py-16 px-6`}>
                        <div className="max-w-4xl mx-auto text-center">
                          <h1 className="text-4xl font-bold mb-4">{content.blog.headline || "Blog"}</h1>
                        </div>
                      </section>
                      <section className="py-16 px-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                          {content.blog.articles?.map((article, i) => (
                            <Card key={i} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-xl mb-2">{article.title}</h3>
                                  <p className="text-slate-600">{article.summary}</p>
                                </div>
                                <span className="text-sm text-slate-400">{article.date}</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {/* CONTACT PAGE */}
                  {currentPage === "contact" && content.contact && (
                    <div>
                      <section className={`bg-gradient-to-br ${theme.gradient} text-white py-16 px-6`}>
                        <div className="max-w-4xl mx-auto text-center">
                          <h1 className="text-4xl font-bold mb-4">{content.contact.headline || "Contact Us"}</h1>
                          <p className="text-xl opacity-90">{content.contact.description}</p>
                        </div>
                      </section>
                      <section className="py-16 px-6">
                        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Get in Touch</h2>
                            <div className="space-y-4">
                              {content.contact.email && (
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient}`}>
                                    <Mail size={20} className="text-white" />
                                  </div>
                                  <span>{content.contact.email}</span>
                                </div>
                              )}
                              {content.contact.phone && (
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient}`}>
                                    <Phone size={20} className="text-white" />
                                  </div>
                                  <span>{content.contact.phone}</span>
                                </div>
                              )}
                              {content.contact.address && (
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient}`}>
                                    <MapPin size={20} className="text-white" />
                                  </div>
                                  <span>{content.contact.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Card className="p-6">
                            <h3 className="font-semibold text-lg mb-4">Send us a message</h3>
                            <div className="space-y-4">
                              <Input placeholder="Your Name" />
                              <Input placeholder="Your Email" type="email" />
                              <Textarea placeholder="Your Message" rows={4} />
                              <Button className={`w-full bg-gradient-to-r ${theme.gradient}`}>
                                Send Message
                              </Button>
                            </div>
                          </Card>
                        </div>
                      </section>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Website Footer */}
            <footer className="bg-slate-900 text-white py-12 px-6">
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <Globe size={24} />
                    <span className="font-bold text-lg">{brand.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Facebook size={20} className="hover:text-blue-400 cursor-pointer" />
                    <Instagram size={20} className="hover:text-pink-400 cursor-pointer" />
                    <Linkedin size={20} className="hover:text-blue-400 cursor-pointer" />
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-slate-400 text-sm">
                    {content.footer?.copyright || `© 2025 ${brand.name}. All rights reserved.`}
                  </p>
                  <a 
                    href="https://diocreations.eu" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    <ButterflyIcon className="w-5 h-5" />
                    <span>Built with Diocreations AI</span>
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIBuilderPreview;
