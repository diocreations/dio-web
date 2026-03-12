import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Eye, Palette, Edit3, Rocket, ArrowRight, Home, Info,
  Briefcase, Mail, FileText, Check, ChevronLeft, ChevronRight, Globe,
  Star, Shield, Zap, Users, Heart, MapPin, Phone, Clock, Facebook,
  Instagram, Linkedin, Menu, X
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Icon mapping for dynamic icons
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
    bg: "bg-white",
    text: "text-slate-900",
    accent: "bg-violet-600",
    gradient: "from-violet-600 to-purple-600"
  },
  corporate: {
    name: "Corporate",
    primary: "#1e40af",
    secondary: "#3b82f6",
    bg: "bg-slate-50",
    text: "text-slate-800",
    accent: "bg-blue-700",
    gradient: "from-blue-700 to-blue-500"
  },
  startup: {
    name: "Startup",
    primary: "#059669",
    secondary: "#10b981",
    bg: "bg-white",
    text: "text-gray-900",
    accent: "bg-emerald-600",
    gradient: "from-emerald-600 to-teal-500"
  },
  minimal: {
    name: "Minimal",
    primary: "#18181b",
    secondary: "#3f3f46",
    bg: "bg-white",
    text: "text-zinc-900",
    accent: "bg-zinc-900",
    gradient: "from-zinc-800 to-zinc-600"
  }
};

const AIBuilderPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("input"); // input, generating, preview
  const [businessTypes, setBusinessTypes] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Form state
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  
  // Website state
  const [websiteId, setWebsiteId] = useState(null);
  const [websiteContent, setWebsiteContent] = useState(null);
  const [currentPage, setCurrentPage] = useState("home");
  const [currentTheme, setCurrentTheme] = useState("modern");
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    // Fetch business types
    fetch(`${API_URL}/api/ai-builder/business-types`)
      .then(r => r.json())
      .then(data => setBusinessTypes(data))
      .catch(() => setBusinessTypes([
        "Restaurant & Food", "Professional Services", "Retail & E-commerce",
        "Healthcare & Wellness", "Technology & IT", "Creative & Design", "Other"
      ]));
  }, []);

  const handleGenerate = async () => {
    if (!businessName.trim() || !businessType || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setStep("generating");
    setGenerating(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const response = await fetch(`${API_URL}/api/ai-builder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          business_type: businessType,
          description: description,
          location: location
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const data = await response.json();
      setProgress(100);
      
      setTimeout(() => {
        setWebsiteId(data.website_id);
        setWebsiteContent(data.content);
        setStep("preview");
        setGenerating(false);
        toast.success("Your website is ready!");
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setGenerating(false);
      setStep("input");
      toast.error("Website generation failed. Please try again.");
    }
  };

  const handleThemeChange = async (theme) => {
    setCurrentTheme(theme);
    if (websiteId) {
      try {
        await fetch(`${API_URL}/api/ai-builder/website/${websiteId}/theme`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(theme)
        });
      } catch {
        // Silent fail - theme is already updated locally
      }
    }
  };

  const updateContent = (path, value) => {
    const newContent = JSON.parse(JSON.stringify(websiteContent));
    const keys = path.split(".");
    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setWebsiteContent(newContent);
  };

  const saveContent = async () => {
    if (websiteId && websiteContent) {
      try {
        await fetch(`${API_URL}/api/ai-builder/website/${websiteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(websiteContent)
        });
        toast.success("Changes saved!");
      } catch {
        toast.error("Failed to save changes");
      }
    }
    setIsEditing(false);
    setEditingField(null);
  };

  const theme = themes[currentTheme];

  // Input Step
  if (step === "input") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Build Your Website with AI
            </h1>
            <p className="text-lg text-slate-600">
              Create a complete multi-page website in seconds
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="p-6 space-y-5">
              <div>
                <Label htmlFor="businessName" className="text-sm font-medium">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Acme Solutions"
                  className="mt-1.5"
                  data-testid="ai-builder-business-name"
                />
              </div>

              <div>
                <Label htmlFor="businessType" className="text-sm font-medium">
                  Business Type <span className="text-red-500">*</span>
                </Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger className="mt-1.5" data-testid="ai-builder-business-type">
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Short Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your business does..."
                  className="mt-1.5 min-h-[100px]"
                  data-testid="ai-builder-description"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-sm font-medium">
                  Location <span className="text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., New York, NY"
                  className="mt-1.5"
                  data-testid="ai-builder-location"
                />
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full h-12 text-base bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                data-testid="ai-builder-generate-btn"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate My Website
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-500 mt-4">
            Powered by AI • Your website will be ready in seconds
          </p>
        </motion.div>
      </div>
    );
  }

  // Generating Step
  if (step === "generating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-violet-200 border-t-violet-600"
            />
            <Sparkles className="w-10 h-10 text-violet-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Creating Your Website
          </h2>
          <p className="text-slate-600 mb-6">
            AI is generating your complete multi-page website...
          </p>
          
          <div className="w-64 mx-auto">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-600 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">{progress}% complete</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Preview Step - Full Website Preview
  if (step === "preview" && websiteContent) {
    const content = websiteContent;
    const brand = content.brand || { name: businessName, tagline: "", primary_color: "#7c3aed" };

    return (
      <div className="min-h-screen bg-slate-100">
        {/* Toolbar */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setStep("input")}>
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <span className="text-sm font-medium text-slate-600 hidden sm:block">
                Editing: {brand.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Theme Selector */}
              <Select value={currentTheme} onValueChange={handleThemeChange}>
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
              
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => isEditing ? saveContent() : setIsEditing(true)}
              >
                {isEditing ? <><Check size={14} className="mr-1" /> Save</> : <><Edit3 size={14} className="mr-1" /> Edit</>}
              </Button>
              
              <Button
                size="sm"
                className={`bg-gradient-to-r ${theme.gradient} hover:opacity-90`}
                onClick={() => setShowPublishModal(true)}
                data-testid="ai-builder-publish-btn"
              >
                <Rocket size={14} className="mr-1" /> Publish
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
            <div className={`${theme.bg} shadow-2xl rounded-lg overflow-hidden`}>
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
                        {/* Hero */}
                        <section className={`bg-gradient-to-br ${theme.gradient} text-white py-20 px-6`}>
                          <div className="max-w-4xl mx-auto text-center">
                            <EditableText
                              value={content.homepage.headline}
                              isEditing={isEditing}
                              onChange={(v) => updateContent("homepage.headline", v)}
                              className="text-4xl md:text-5xl font-bold mb-4"
                            />
                            <EditableText
                              value={content.homepage.subheadline}
                              isEditing={isEditing}
                              onChange={(v) => updateContent("homepage.subheadline", v)}
                              className="text-xl opacity-90 mb-8 max-w-2xl mx-auto"
                            />
                            <Button size="lg" variant="secondary" className="text-lg px-8">
                              {content.homepage.cta_text || "Get Started"}
                              <ArrowRight className="ml-2" size={20} />
                            </Button>
                          </div>
                        </section>

                        {/* Features */}
                        {content.homepage.features && (
                          <section className="py-16 px-6">
                            <div className="max-w-5xl mx-auto">
                              <h2 className={`text-3xl font-bold text-center mb-12 ${theme.text}`}>
                                Why Choose Us
                              </h2>
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

                        {/* Services Preview */}
                        {content.homepage.services_preview && (
                          <section className="py-16 px-6 bg-slate-50">
                            <div className="max-w-5xl mx-auto">
                              <h2 className={`text-3xl font-bold text-center mb-12 ${theme.text}`}>
                                Our Services
                              </h2>
                              <div className="grid md:grid-cols-3 gap-6">
                                {content.homepage.services_preview.map((service, i) => (
                                  <Card key={i} className="p-6">
                                    <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                                    <p className="text-slate-600 text-sm">{service.description}</p>
                                  </Card>
                                ))}
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
                            <h1 className="text-4xl font-bold mb-4">{content.about.headline || content.about.title}</h1>
                          </div>
                        </section>
                        <section className="py-16 px-6">
                          <div className="max-w-3xl mx-auto">
                            <EditableText
                              value={content.about.content}
                              isEditing={isEditing}
                              onChange={(v) => updateContent("about.content", v)}
                              className={`text-lg ${theme.text} leading-relaxed whitespace-pre-line`}
                              multiline
                            />
                            {content.about.mission && (
                              <div className="mt-12 p-6 bg-slate-50 rounded-xl">
                                <h3 className="font-semibold text-lg mb-2">Our Mission</h3>
                                <p className="text-slate-600">{content.about.mission}</p>
                              </div>
                            )}
                            {content.about.values && (
                              <div className="mt-8">
                                <h3 className="font-semibold text-lg mb-4">Our Values</h3>
                                <div className="flex flex-wrap gap-2">
                                  {content.about.values.map((value, i) => (
                                    <span key={i} className={`px-4 py-2 rounded-full bg-gradient-to-r ${theme.gradient} text-white text-sm`}>
                                      {value}
                                    </span>
                                  ))}
                                </div>
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
                            <h1 className="text-4xl font-bold mb-4">{content.services.headline || content.services.title}</h1>
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
                                  <p className={`font-semibold`} style={{ color: theme.primary }}>{service.price}</p>
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
                            <h1 className="text-4xl font-bold mb-4">{content.blog.headline || content.blog.title}</h1>
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
                            <h1 className="text-4xl font-bold mb-4">{content.contact.headline || content.contact.title}</h1>
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
                                {content.contact.hours && (
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient}`}>
                                      <Clock size={20} className="text-white" />
                                    </div>
                                    <span>{content.contact.hours}</span>
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
                      {content.footer?.social_links?.includes("facebook") && <Facebook size={20} className="hover:text-blue-400 cursor-pointer" />}
                      {content.footer?.social_links?.includes("instagram") && <Instagram size={20} className="hover:text-pink-400 cursor-pointer" />}
                      {content.footer?.social_links?.includes("linkedin") && <Linkedin size={20} className="hover:text-blue-400 cursor-pointer" />}
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
                    {content.footer?.copyright || `© 2025 ${brand.name}. All rights reserved.`}
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>

        {/* Publish Modal Overlay */}
        <AnimatePresence>
          {false && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              {/* Publish modal content here */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
};

// Editable Text Component
const EditableText = ({ value, isEditing, onChange, className, multiline = false }) => {
  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${className} bg-yellow-50 border-2 border-yellow-400 rounded p-2 w-full min-h-[150px]`}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} bg-yellow-50 border-2 border-yellow-400 rounded px-2`}
      />
    );
  }
  return <div className={className}>{value}</div>;
};

export default AIBuilderPage;
